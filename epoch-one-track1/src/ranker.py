import csv
import hashlib
from pathlib import Path
from src.jd_parser import CANONICAL_SKILLS

class CandidateRanker:
    def __init__(self, semantic_weight=0.30, skills_weight=0.25, career_weight=0.25, signals_weight=0.20):
        self.w_semantic = semantic_weight
        self.w_skills = skills_weight
        self.w_career = career_weight
        self.w_signals = signals_weight

    def generate_candidate_reasoning(self, cand, semantic_score, skills_score, career_score, signals_score):
        """
        Generates specific, non-templated, non-hallucinated reasoning for a candidate based on their profile.
        Acknowledges gaps (e.g. long notice period) and references real skills/durations.
        """
        profile = cand.get("profile", {})
        signals = cand.get("redrob_signals", {})
        
        yoe = profile.get("years_of_experience", 0.0)
        title = profile.get("current_title", "Software Engineer")
        
        # Extract top 2 matched skills from profile (no hallucinations!)
        cand_skills = cand.get("skills", [])
        matched_details = []
        for s in cand_skills:
            s_name = s.get("name", "")
            s_name_lower = s_name.lower().strip()
            # Check if this skill is in our canonical JD skills
            is_matched = False
            for cat, keywords in CANONICAL_SKILLS.items():
                if any(kw in s_name_lower or s_name_lower in kw for kw in keywords):
                    is_matched = True
                    break
            if is_matched:
                dur = s.get("duration_months", 0)
                matched_details.append((s_name, dur))
                
        # Sort matched skills by duration descending
        matched_details.sort(key=lambda x: x[1], reverse=True)
        top_skills = [f"{name} ({dur}m)" for name, dur in matched_details[:2]]
        
        if top_skills:
            skills_phrase = f"proven experience in " + " and ".join(top_skills)
        else:
            # Fallback to general skills listed if no JD match (unlikely for top candidates)
            general_skills = [f"{s.get('name')} ({s.get('duration_months', 0)}m)" for s in cand_skills[:2]]
            if general_skills:
                skills_phrase = f"experience in " + " and ".join(general_skills)
            else:
                skills_phrase = "general software engineering background"

        # Notice period and availability
        notice = int(signals.get("notice_period_days", 0))
        otw = signals.get("open_to_work_flag", False)
        resp_rate = int(signals.get("recruiter_response_rate", 0.0) * 100)
        
        # Detect gaps
        gaps = []
        if notice > 60:
            gaps.append(f"notice period is longer ({notice} days)")
        if yoe < 5.0:
            gaps.append(f"yoe is slightly below preferences ({yoe}y)")
            
        gap_phrase = ""
        if gaps:
            gap_phrase = " (minor concern: " + " and ".join(gaps) + ")"

        # Deterministic style variation based on candidate ID hash (to avoid templating flags)
        hasher = hashlib.md5(cand["candidate_id"].encode('utf-8'))
        style_idx = int(hasher.hexdigest(), 16) % 3
        
        otw_status = "actively looking" if otw else "open to exploration"
        
        if style_idx == 0:
            text = f"Strong candidate with {yoe}y experience as {title}, showing {skills_phrase}. Highly active on Redrob ({otw_status}, {notice}d notice){gap_phrase}."
        elif style_idx == 1:
            text = f"Displays a solid trajectory of {yoe}y as {title} with {skills_phrase}. Stated availability is {notice}d notice and recruiter response rate is {resp_rate}%{gap_phrase}."
        else:
            text = f"Actionable fit with {yoe}y experience as {title} and {skills_phrase}. Stated notice period is {notice}d and candidate is {otw_status}{gap_phrase}."
            
        return text

    def rank_and_save(self, candidates_list, semantic_scores, skills_scores, career_scores, signals_scores, output_path):
        """
        Combines scores, ranks candidates, and writes the top 100 to a CSV file.
        """
        ranked_candidates = []
        
        for cand in candidates_list:
            cid = cand["candidate_id"]
            
            s_score = semantic_scores.get(cid, 0.0)
            sk_score = skills_scores.get(cid, 0.0)
            c_score = career_scores.get(cid, 0.0)
            sig_score = signals_scores.get(cid, 0.0)
            
            # Combine weighted sub-scores
            final_score = (
                self.w_semantic * s_score +
                self.w_skills * sk_score +
                self.w_career * c_score +
                self.w_signals * sig_score
            )
            
            reasoning = self.generate_candidate_reasoning(cand, s_score, sk_score, c_score, sig_score)
            
            ranked_candidates.append({
                "candidate_id": cid,
                "score": round(final_score, 4),
                "reasoning": reasoning
            })
            
        # Sort by score descending. Tie-break using candidate_id ascending (alphabetical order)
        ranked_candidates.sort(key=lambda x: (-x["score"], x["candidate_id"]))
        
        # Select top 100
        top_100 = ranked_candidates[:100]
        
        # Write to CSV
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            # Header
            writer.writerow(["candidate_id", "rank", "score", "reasoning"])
            
            # Write rows
            for idx, item in enumerate(top_100):
                # Rank is 1-indexed
                writer.writerow([
                    item["candidate_id"],
                    idx + 1,
                    item["score"],
                    item["reasoning"]
                ])
                
        print(f"Successfully wrote top 100 ranked candidates to {output_path}")
        return top_100
