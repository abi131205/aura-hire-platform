import argparse
import json
import pickle
import sys
from pathlib import Path
from sentence_transformers import SentenceTransformer

from src.jd_parser import JobDescriptionParser
from src.semantic_scorer import SemanticScorer
from src.skills_scorer import SkillsScorer
from src.career_scorer import CareerScorer
from src.signals_scorer import SignalsScorer
from src.ranker import CandidateRanker

def parse_args():
    parser = argparse.ArgumentParser(description="Rank candidates against the job description.")
    parser.add_argument("--candidates", type=str, required=True, help="Path to candidates.jsonl")
    parser.add_argument("--out", type=str, required=True, help="Path to output submission CSV")
    return parser.parse_args()

def main():
    args = parse_args()
    
    candidates_path = Path(args.candidates)
    output_path = Path(args.out)
    
    # Resolve project root paths
    project_root = Path(__file__).resolve().parent
    embeddings_cache_path = project_root / "artifacts" / "embeddings.pkl"
    jd_path = project_root / "job_description.docx"
    
    # 1. Validation
    if not candidates_path.exists():
        print(f"Error: Candidates file {candidates_path} does not exist.")
        sys.exit(1)
        
    if not jd_path.exists():
        print(f"Error: Job description file {jd_path} does not exist.")
        sys.exit(1)
        
    if not embeddings_cache_path.exists():
        print(f"Error: Precomputed embeddings cache not found at {embeddings_cache_path}.")
        print("Please run precompute.py first to generate the cache.")
        sys.exit(1)
        
    # 2. Load candidates
    print(f"Loading candidates from {candidates_path}...")
    candidates = []
    # Support both jsonl and json (for test sample candidates)
    if candidates_path.suffix == '.json':
        with open(candidates_path, 'r', encoding='utf-8') as f:
            candidates = json.load(f)
    else:
        with open(candidates_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    candidates.append(json.loads(line))
                    
    print(f"Loaded {len(candidates)} candidates.")
    
    # 3. Load precomputed artifacts cache
    print(f"Loading precomputed cache from {embeddings_cache_path}...")
    try:
        with open(embeddings_cache_path, 'rb') as f:
            cache_data = pickle.load(f)
        skill_alias_map = cache_data.get("skill_alias_map", {})
    except Exception as e:
        print(f"Error loading cache: {e}")
        sys.exit(1)
        
    # 4. Parse JD & compute JD embedding
    print("Parsing job description and computing JD embedding...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    jd_parser = JobDescriptionParser(jd_path)
    jd_embedding = jd_parser.get_embedding(model)
    
    # 5. Initialize scorers
    print("Scoring candidates...")
    semantic_scorer = SemanticScorer(embeddings_cache_path)
    skills_scorer = SkillsScorer(skill_alias_map)
    career_scorer = CareerScorer()
    signals_scorer = SignalsScorer()
    
    # 6. Run scoring layers
    print("  Computing Semantic similarity scores...")
    semantic_scores = semantic_scorer.score_candidates(jd_embedding, candidates)
    
    print("  Computing Skills match scores...")
    skills_scores = skills_scorer.score_candidates(candidates)
    
    print("  Computing Career trajectory scores...")
    career_scores = career_scorer.score_candidates(candidates)
    
    print("  Computing Behavioral signals scores...")
    signals_scores = signals_scorer.score_candidates(candidates)
    
    # 7. Rank and output results
    print("Ranking candidates and generating reasoning...")
    ranker = CandidateRanker()
    ranker.rank_and_save(
        candidates,
        semantic_scores,
        skills_scores,
        career_scores,
        signals_scores,
        output_path
    )
    
    print(f"Done! Submission output generated at {output_path}")

if __name__ == '__main__':
    main()
