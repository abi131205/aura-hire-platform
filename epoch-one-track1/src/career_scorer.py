from datetime import datetime
from pathlib import Path
from src.jd_parser import CONSULTING_COMPANIES

# Title category keywords and their ranks
TITLE_RANKS = {
    "junior": ["junior", "jr", "intern", "associate", "trainee", "entry", "level 1", "level i", "co-op"],
    "mid": ["engineer", "developer", "analyst", "specialist", "consultant", "scientist", "programmer", "member of technical staff", "mts"],
    "senior": ["senior", "sr", "lead", "principal", "staff", "founding", "founder", "architect", "head", "director", "chief", "cto", "vp", "manager", "tech lead"]
}

def parse_date(date_str):
    if not date_str:
        return datetime(2026, 6, 17) # Reference date for current roles
    try:
        parts = date_str.split('-')
        return datetime(int(parts[0]), int(parts[1]), int(parts[2]))
    except Exception:
        return datetime(2026, 6, 17)

class CareerScorer:
    def __init__(self):
        pass

    def get_title_rank(self, title):
        title_lower = title.lower()
        # Check senior first
        for kw in TITLE_RANKS["senior"]:
            if kw in title_lower:
                return 3
        # Check junior
        for kw in TITLE_RANKS["junior"]:
            if kw in title_lower:
                return 1
        # Check mid
        for kw in TITLE_RANKS["mid"]:
            if kw in title_lower:
                return 2
        return 2 # Default to mid if not specified

    def evaluate_progression(self, career_history):
        """
        Analyzes title ranks over time.
        Returns a progression score in [0.2, 1.0].
        """
        if not career_history:
            return 0.5
            
        ranks = [self.get_title_rank(role.get("title", "")) for role in career_history]
        # In candidates.jsonl, career_history is typically ordered from current (index 0) to oldest.
        # Let's reverse it so it's chronological (oldest to current).
        chrono_ranks = list(reversed(ranks))
        
        if len(chrono_ranks) <= 1:
            return 0.8 # Single role, neutral progression
            
        # Check if rank increases
        has_increase = False
        has_decrease = False
        for i in range(len(chrono_ranks) - 1):
            if chrono_ranks[i+1] > chrono_ranks[i]:
                has_increase = True
            elif chrono_ranks[i+1] < chrono_ranks[i]:
                has_decrease = True
                
        if has_increase and not has_decrease:
            return 1.0 # Clear upward progression
        elif has_increase and has_decrease:
            return 0.8 # Fluctuating, but shows some growth
        elif not has_increase and not has_decrease:
            # Steady at the same rank
            if chrono_ranks[-1] == 3:
                return 0.9 # Stayed senior
            return 0.7 # Stayed mid or junior
        else:
            return 0.3 # Downward progression

    def score_yoe(self, yoe):
        """
        Scores YOE relative to the 5-9 year window.
        """
        if 5.0 <= yoe <= 9.0:
            return 1.0
        elif 4.0 <= yoe < 5.0:
            # Interpolate from 0.8 to 1.0
            return 0.8 + 0.2 * (yoe - 4.0)
        elif 9.0 < yoe <= 12.0:
            # Interpolate from 1.0 down to 0.7
            return 1.0 - 0.1 * (yoe - 9.0)
        elif 0.0 <= yoe < 4.0:
            # Interpolate from 0.0 to 0.8
            return 0.2 + 0.15 * yoe
        else:
            # yoe > 12
            score = 0.7 - 0.05 * (yoe - 12.0)
            return max(0.2, score)

    def score_candidates(self, candidates_list):
        """
        Scores career trajectory for all candidates.
        Returns a dictionary mapping candidate_id -> career score [0, 1].
        """
        scores = {}
        
        for cand in candidates_list:
            cid = cand["candidate_id"]
            profile = cand.get("profile", {})
            career = cand.get("career_history", [])
            yoe = float(profile.get("years_of_experience", 0))
            
            # 1. Check for physical honeypot logical inconsistencies
            is_honeypot = False
            
            # Check 1a: Single role duration exceeds YOE * 12 + 6
            for role in career:
                dur_m = role.get("duration_months", 0)
                if dur_m > (yoe * 12 + 6):
                    is_honeypot = True
                    break
            
            # Check 1b: Date range vs stated duration inconsistency
            for role in career:
                start = parse_date(role.get("start_date"))
                end = parse_date(role.get("end_date"))
                dur_m = role.get("duration_months", 0)
                
                days = (end - start).days
                calendar_months = round(days / 30.4)
                
                if abs(dur_m - calendar_months) > 12:
                    is_honeypot = True
                    break
                    
            if is_honeypot:
                scores[cid] = 0.0
                continue
                
            # 2. Base scores
            yoe_score = self.score_yoe(yoe)
            
            # Current title match
            current_title = profile.get("current_title", "")
            current_rank = self.get_title_rank(current_title)
            if current_rank == 3:
                title_score = 1.0
            elif current_rank == 2:
                title_score = 0.6
            else:
                title_score = 0.2
                
            # Progression score
            prog_score = self.evaluate_progression(career)
            
            # Combine components
            candidate_career_score = (0.4 * yoe_score) + (0.4 * title_score) + (0.2 * prog_score)
            
            # 3. Penalties
            # Consulting penalty: entire career at TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini
            if career:
                is_consulting_only = True
                for role in career:
                    company = role.get("company", "").lower().strip()
                    # Check if company name contains any of the consulting company names
                    matches_consulting = False
                    for cc in CONSULTING_COMPANIES:
                        if cc in company:
                            matches_consulting = True
                            break
                    if not matches_consulting:
                        is_consulting_only = False
                        break
                        
                if is_consulting_only:
                    candidate_career_score *= 0.1
            
            # Stagnation check: same title for 10+ years (120 months) at the same company
            has_stagnation = False
            for role in career:
                dur_m = role.get("duration_months", 0)
                if dur_m >= 120:
                    has_stagnation = True
                    break
            if has_stagnation:
                candidate_career_score *= 0.5
                
            scores[cid] = candidate_career_score
            
        # Normalize
        if scores:
            max_score = max(scores.values())
            if max_score > 0:
                for cid in scores:
                    scores[cid] = scores[cid] / max_score
                    
        return scores
