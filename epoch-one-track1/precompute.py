import argparse
import json
import pickle
import sys
from pathlib import Path
import torch
from sentence_transformers import SentenceTransformer
from src.jd_parser import CANONICAL_SKILLS
from src.skills_scorer import SkillsScorer
from src.career_scorer import CareerScorer
from src.signals_scorer import SignalsScorer

def parse_args():
    parser = argparse.ArgumentParser(description="Precompute candidate embeddings and skill alias map.")
    parser.add_argument("--candidates", type=str, required=True, help="Path to candidates.jsonl")
    parser.add_argument("--out", type=str, required=True, help="Path to output pickle file")
    return parser.parse_args()

def main():
    args = parse_args()
    
    candidates_path = Path(args.candidates)
    output_path = Path(args.out)
    
    if not candidates_path.exists():
        print(f"Error: Candidates file {candidates_path} does not exist.")
        sys.exit(1)
        
    print(f"Reading candidates from {candidates_path}...")
    candidates = []
    if candidates_path.suffix == '.json':
        with open(candidates_path, 'r', encoding='utf-8') as f:
            candidates = json.load(f)
    else:
        with open(candidates_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    candidates.append(json.loads(line))
                
    n_candidates = len(candidates)
    print(f"Loaded {n_candidates} candidates.")
    
    # 1. Precompute skill alias map (as per Condition 3)
    print("Precomputing skill alias map...")
    skill_alias_map = {}
    for cand in candidates:
        for s in cand.get("skills", []):
            s_name = s.get("name", "")
            s_name_lower = s_name.lower().strip()
            if s_name_lower not in skill_alias_map:
                resolved_cat = None
                for cat, keywords in CANONICAL_SKILLS.items():
                    for kw in keywords:
                        if kw in s_name_lower or s_name_lower in kw:
                            resolved_cat = cat
                            break
                    if resolved_cat:
                        break
                skill_alias_map[s_name_lower] = resolved_cat
                
    print(f"Unique skills resolved: {len(skill_alias_map)}")
    
    # 2. Select top N candidates using cheap heuristic scorers to save CPU hours
    print("Filtering candidates using heuristic scorers...")
    skills_scorer = SkillsScorer(skill_alias_map)
    skills_scores = skills_scorer.score_candidates(candidates)
    
    career_scorer = CareerScorer()
    career_scores = career_scorer.score_candidates(candidates)
    
    signals_scorer = SignalsScorer()
    signals_scores = signals_scorer.score_candidates(candidates)
    
    candidate_heuristics = []
    for cand in candidates:
        cid = cand["candidate_id"]
        sk = skills_scores.get(cid, 0.0)
        c = career_scores.get(cid, 0.0)
        sig = signals_scores.get(cid, 0.0)
        h_score = 0.25 * sk + 0.25 * c + 0.20 * sig
        candidate_heuristics.append((cand, h_score))
        
    # Sort by heuristic score descending
    candidate_heuristics.sort(key=lambda x: x[1], reverse=True)
    
    # Keep top 10,000 candidates for embedding generation (strictly safe)
    top_n = min(10000, len(candidate_heuristics))
    print(f"Selecting top {top_n} candidates for semantic embedding...")
    selected_candidates = [item[0] for item in candidate_heuristics[:top_n]]
    
    # 3. Precompute semantic embeddings for selected candidates
    print("Preparing texts for semantic embedding...")
    texts = []
    candidate_ids = []
    
    for cand in selected_candidates:
        cid = cand["candidate_id"]
        profile = cand.get("profile", {})
        career = cand.get("career_history", [])
        
        # Build a robust textual representation of the candidate
        headline = profile.get("headline", "")
        summary = profile.get("summary", "")
        curr_title = profile.get("current_title", "")
        
        roles_text = []
        for role in career:
            r_title = role.get("title", "")
            r_desc = role.get("description", "")
            roles_text.append(f"{r_title}: {r_desc}")
            
        combined_text = f"Title: {curr_title}. Headline: {headline}. Summary: {summary}. Experience: {' '.join(roles_text)}"
        # Truncate to 1000 chars to avoid model padding overhead and fit within the 256 token limit of all-MiniLM-L6-v2
        combined_text = combined_text[:1000]
        texts.append(combined_text)
        candidate_ids.append(cid)
        
    print("Loading embedding model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    # Set PyTorch thread limit to utilize CPU cores efficiently in a single process
    torch.set_num_threads(8)
    
    print(f"Computing embeddings for {len(texts)} selected candidates on CPU...")
    # Sort texts by length to minimize padding overhead in batches
    sorted_indices = sorted(range(len(texts)), key=lambda k: len(texts[k]))
    sorted_texts = [texts[i] for i in sorted_indices]
    
    import numpy as np
    # Compute embeddings
    sorted_embeddings = model.encode(sorted_texts, batch_size=256, show_progress_bar=True, convert_to_numpy=True)
    
    # Restore original order
    embeddings_list = [None] * len(texts)
    for i, idx in enumerate(sorted_indices):
        embeddings_list[idx] = sorted_embeddings[i]
    embeddings = np.array(embeddings_list)
    
    print(f"Saving precomputed artifacts to {output_path}...")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    cache_data = {
        "candidate_ids": candidate_ids,
        "embeddings": embeddings,
        "skill_alias_map": skill_alias_map
    }
    
    with open(output_path, 'wb') as f:
        pickle.dump(cache_data, f, protocol=4)
        
    print("Precomputation finished successfully!")

if __name__ == '__main__':
    main()
