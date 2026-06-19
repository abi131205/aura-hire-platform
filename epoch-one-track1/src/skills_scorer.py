import math
from pathlib import Path
from src.jd_parser import CANONICAL_SKILLS

PROFICIENCY_WEIGHTS = {
    "beginner": 0.25,
    "intermediate": 0.50,
    "advanced": 0.75,
    "expert": 1.0
}

class SkillsScorer:
    def __init__(self, skill_alias_map=None):
        """
        Initializes the skills scorer.
        skill_alias_map: pre-computed dict of candidate skill names -> canonical category names
        """
        self.skill_alias_map = skill_alias_map or {}

    def get_skill_category(self, skill_name):
        """
        Resolves a skill name to its canonical JD skill category.
        Uses precomputed alias map if available, falls back to substring matching.
        """
        skill_name_lower = skill_name.lower().strip()
        
        # 1. Try precomputed alias map
        if skill_name_lower in self.skill_alias_map:
            return self.skill_alias_map[skill_name_lower]
            
        # 2. Fallback substring matching for standalone test runs
        for category, keywords in CANONICAL_SKILLS.items():
            for kw in keywords:
                if kw in skill_name_lower or skill_name_lower in kw:
                    return category
        return None

    def score_single_skill(self, skill):
        """
        Computes the score for a single candidate skill:
        score = weight * log(1 + duration_months) * log(1 + endorsements)
        """
        proficiency = skill.get("proficiency", "beginner").lower().strip()
        weight = PROFICIENCY_WEIGHTS.get(proficiency, 0.25)
        
        duration = float(skill.get("duration_months", 0))
        endorsements = float(skill.get("endorsements", 0))
        
        # Natural log is used here
        score = weight * math.log(1.0 + duration) * math.log(1.0 + endorsements)
        return score

    def score_candidates(self, candidates_list):
        """
        Scores all candidates based on their skills and JD requirements.
        Returns a dictionary mapping candidate_id -> normalized skills score [0, 1].
        """
        scores = {}
        
        for cand in candidates_list:
            cid = cand["candidate_id"]
            skills = cand.get("skills", [])
            
            # Count zero-duration expert/advanced skills (traps)
            fake_skills_count = 0
            for s in skills:
                prof = s.get("proficiency", "beginner").lower().strip()
                dur = s.get("duration_months", 0)
                if prof in ("expert", "advanced") and dur == 0:
                    fake_skills_count += 1
            
            # Group candidate skill scores by canonical category
            category_best_scores = {cat: 0.0 for cat in CANONICAL_SKILLS.keys()}
            
            for s in skills:
                cat = self.get_skill_category(s["name"])
                if cat:
                    skill_score = self.score_single_skill(s)
                    if skill_score > category_best_scores[cat]:
                        category_best_scores[cat] = skill_score
            
            # Combine scores across categories. Let's sum them.
            total_score = sum(category_best_scores.values())
            
            # Apply trust multiplier for fake skills
            # If candidate has >= 3 fake/stuffed skills, penalize heavily (set to 0.0)
            if fake_skills_count >= 3:
                trust_multiplier = 0.0
            else:
                trust_multiplier = 1.0
                
            scores[cid] = total_score * trust_multiplier
            
        # Normalize scores to [0, 1] across the entire cohort
        if scores:
            max_score = max(scores.values())
            if max_score > 0:
                for cid in scores:
                    scores[cid] = scores[cid] / max_score
                    
        return scores
