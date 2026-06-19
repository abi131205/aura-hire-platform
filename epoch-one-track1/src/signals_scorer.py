import math
from datetime import datetime

def parse_date(date_str, default_date=None):
    if not date_str:
        return default_date or datetime.today()
    try:
        parts = date_str.split('-')
        return datetime(int(parts[0]), int(parts[1]), int(parts[2]))
    except Exception:
        return default_date or datetime.today()

class SignalsScorer:
    def __init__(self):
        pass

    def score_single_candidate(self, signals, ref_date):
        """
        Computes a composite recruiter readiness score in [0, 1] for a candidate's signals.
        """
        # 1. Honeypot check: invalid salary range
        salary = signals.get("expected_salary_range_inr_lpa", {})
        sal_min = salary.get("min", 0.0)
        sal_max = salary.get("max", 0.0)
        if sal_min > sal_max:
            return 0.0  # Invalid salary is a strong honeypot signal
            
        # 2. Activity score based on last active date
        last_active = parse_date(signals.get("last_active_date"), ref_date)
        days_ago = (ref_date - last_active).days
        days_ago = max(0, days_ago)
        # Decay function: drops to 0.5 at 30 days
        activity_score = 1.0 / (1.0 + (days_ago / 30.0))
        
        # 3. Open to work flag
        otw = signals.get("open_to_work_flag", False)
        otw_score = 1.0 if otw else 0.5
        
        # 4. Stated notice period (lower is better for urgency roles)
        notice_days = float(signals.get("notice_period_days", 0))
        # notice period of <= 30 days is best; linear decay from 30 to 150 days
        notice_score = max(0.1, 1.0 - (max(0.0, notice_days - 30.0) / 120.0))
        
        # 5. Recruiter response rate (fraction of recruiter messages replied to)
        response_rate = float(signals.get("recruiter_response_rate", 0.0))
        response_score = max(0.0, min(1.0, response_rate))
        
        # 6. Interview completion rate
        interview_rate = float(signals.get("interview_completion_rate", 0.0))
        interview_score = max(0.0, min(1.0, interview_rate))
        
        # 7. Offer acceptance rate
        offer_rate = float(signals.get("offer_acceptance_rate", -1.0))
        if offer_rate < 0.0:
            offer_score = 0.6  # Default/neutral for candidates with no offer history
        else:
            offer_score = max(0.0, min(1.0, offer_rate))
            
        # 8. Profile completeness score
        completeness = float(signals.get("profile_completeness_score", 0.0))
        completeness_score = max(0.0, min(1.0, completeness / 100.0))
        
        # 9. GitHub activity score (highly relevant for a technical role)
        github = float(signals.get("github_activity_score", -1.0))
        if github < 0.0:
            github_score = 0.2  # Slight default for developers without GitHub linked
        else:
            github_score = max(0.0, min(1.0, github / 100.0))
            
        # Weighted combination of signals
        weights = {
            "activity": 0.15,
            "otw": 0.15,
            "notice": 0.15,
            "response": 0.15,
            "interview": 0.15,
            "offer": 0.10,
            "completeness": 0.05,
            "github": 0.10
        }
        
        composite = (
            weights["activity"] * activity_score +
            weights["otw"] * otw_score +
            weights["notice"] * notice_score +
            weights["response"] * response_score +
            weights["interview"] * interview_score +
            weights["offer"] * offer_score +
            weights["completeness"] * completeness_score +
            weights["github"] * github_score
        )
        
        return composite

    def score_candidates(self, candidates_list):
        """
        Scores behavioral signals for all candidates.
        Returns a dictionary mapping candidate_id -> signals score [0, 1].
        """
        scores = {}
        ref_date = datetime.today()
        for cand in candidates_list:
            cid = cand["candidate_id"]
            signals = cand.get("redrob_signals", {})
            scores[cid] = self.score_single_candidate(signals, ref_date)
            
        # Normalize
        if scores:
            max_score = max(scores.values())
            if max_score > 0:
                for cid in scores:
                    scores[cid] = scores[cid] / max_score
                    
        return scores
