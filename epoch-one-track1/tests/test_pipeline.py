import unittest
import json
import csv
import subprocess
from pathlib import Path
from datetime import datetime

from src.jd_parser import JobDescriptionParser
from src.skills_scorer import SkillsScorer
from src.career_scorer import CareerScorer
from src.signals_scorer import SignalsScorer

class TestRankingPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.project_root = Path(__file__).resolve().parent.parent
        cls.sample_data_path = cls.project_root / "data" / "sample_candidates.json"
        cls.jd_path = cls.project_root / "job_description.docx"
        
        # Load sample candidates
        with open(cls.sample_data_path, 'r', encoding='utf-8') as f:
            cls.sample_candidates = json.load(f)

    def test_jd_parser(self):
        """Test the job description parser."""
        self.assertTrue(self.jd_path.exists())
        parser = JobDescriptionParser(self.jd_path)
        self.assertGreater(len(parser.raw_text), 100)
        self.assertEqual(parser.min_exp, 5.0)
        self.assertEqual(parser.max_exp, 9.0)

    def test_skills_scorer(self):
        """Test the skills match logic and fake skill detection."""
        # Candidate 1 (Ira Vora) has 17 skills, including advanced Milvus
        scorer = SkillsScorer()
        scores = scorer.score_candidates(self.sample_candidates)
        
        # Check that scores are mapping correctly
        self.assertIn("CAND_0000001", scores)
        self.assertGreater(scores["CAND_0000001"], 0.0)
        
        # Test zero-duration expert skill penalty
        fake_cand = {
            "candidate_id": "CAND_FAKE_SKILLS",
            "skills": [
                {"name": "FAISS", "proficiency": "expert", "duration_months": 0, "endorsements": 1},
                {"name": "Python", "proficiency": "expert", "duration_months": 0, "endorsements": 2},
                {"name": "embeddings", "proficiency": "expert", "duration_months": 0, "endorsements": 3}
            ]
        }
        fake_scores = scorer.score_candidates([fake_cand])
        # Since candidate has 3 expert skills with 0 months, trust should be 0.0
        self.assertEqual(fake_scores["CAND_FAKE_SKILLS"], 0.0)

    def test_career_scorer(self):
        """Test career progression, consulting firm penalties, and date range honeypot checks."""
        scorer = CareerScorer()
        scores = scorer.score_candidates(self.sample_candidates)
        
        self.assertIn("CAND_0000001", scores)
        
        # Test consulting company penalty
        consulting_cand = {
            "candidate_id": "CAND_CONSULTING",
            "profile": {"years_of_experience": 6.0, "current_title": "Senior AI Engineer"},
            "career_history": [
                {"company": "TCS", "title": "Senior Engineer", "start_date": "2024-01-01", "end_date": None, "duration_months": 30, "is_current": True, "industry": "IT Services", "company_size": "10001+", "description": "some work"},
                {"company": "Infosys", "title": "Developer", "start_date": "2020-01-01", "end_date": "2024-01-01", "duration_months": 48, "is_current": False, "industry": "IT Services", "company_size": "10001+", "description": "some work"}
            ]
        }
        normal_cand = {
            "candidate_id": "CAND_NORMAL",
            "profile": {"years_of_experience": 6.0, "current_title": "Senior AI Engineer"},
            "career_history": [
                {"company": "ProductCo", "title": "Senior Engineer", "start_date": "2024-01-01", "end_date": None, "duration_months": 30, "is_current": True, "industry": "Software", "company_size": "201-500", "description": "some work"}
            ]
        }
        # CAND_NORMAL should score higher than a consulting-only profile
        c_scores = scorer.score_candidates([normal_cand, consulting_cand])
        self.assertLess(c_scores["CAND_CONSULTING"], 0.2) # Penalty applied

        # Test date range discrepancy honeypot check
        inconsistent_cand = {
            "candidate_id": "CAND_INCONSISTENT",
            "profile": {"years_of_experience": 5.0, "current_title": "Senior Engineer"},
            "career_history": [
                # Claims 150 months (12.5 years) but start date is 2024-01-01 to June 2026 (~30 months)
                {"company": "ProductCo", "title": "Senior Engineer", "start_date": "2024-01-01", "end_date": None, "duration_months": 150, "is_current": True, "industry": "Software", "company_size": "50-100", "description": "work"}
            ]
        }
        i_scores = scorer.score_candidates([inconsistent_cand])
        # Should be exactly 0 due to honeypot date inconsistency check
        self.assertEqual(i_scores["CAND_INCONSISTENT"], 0.0)

    def test_signals_scorer(self):
        """Test behavioral signals scoring and invalid salary bounds."""
        scorer = SignalsScorer()
        scores = scorer.score_candidates(self.sample_candidates)
        
        self.assertIn("CAND_0000001", scores)
        
        # Test invalid salary range honeypot check
        invalid_salary_cand = {
            "candidate_id": "CAND_INVALID_SAL",
            "redrob_signals": {
                "expected_salary_range_inr_lpa": {"min": 35.0, "max": 25.0}, # min > max
                "last_active_date": "2026-06-01",
                "open_to_work_flag": True,
                "recruiter_response_rate": 0.9,
                "interview_completion_rate": 0.9,
                "offer_acceptance_rate": 0.8
            }
        }
        s_scores = scorer.score_candidates([invalid_salary_cand])
        # Should be exactly 0 due to invalid salary check
        self.assertEqual(s_scores["CAND_INVALID_SAL"], 0.0)

    def test_end_to_end_pipeline(self):
        """Test end-to-end execution of precompute.py and rank.py on sample candidates."""
        import sys
        from unittest.mock import patch
        import precompute
        import rank

        # 1. Run precompute on sample data
        temp_cache = self.project_root / "artifacts" / "test_embeddings.pkl"
        with patch.object(sys, 'argv', [
            "precompute.py",
            "--candidates", str(self.sample_data_path),
            "--out", str(temp_cache)
        ]):
            precompute.main()

        self.assertTrue(temp_cache.exists())
        
        # Swap temporary embeddings cache to original path to allow rank.py to run on it
        real_cache = self.project_root / "artifacts" / "embeddings.pkl"
        backup_cache = self.project_root / "artifacts" / "embeddings.pkl.bak"
        if backup_cache.exists():
            backup_cache.unlink()
            
        backup_cache_exists = real_cache.exists()
        if backup_cache_exists:
            real_cache.rename(backup_cache)
        temp_cache.rename(real_cache)
        
        try:
            # 2. Run rank.py
            output_csv = self.project_root / "test_submission.csv"
            with patch.object(sys, 'argv', [
                "rank.py",
                "--candidates", str(self.sample_data_path),
                "--out", str(output_csv)
            ]):
                rank.main()

            self.assertTrue(output_csv.exists())
            
            # 3. Read and validate CSV contents
            with open(output_csv, 'r', encoding='utf-8') as f:
                reader = list(csv.reader(f))
                
            # Header check
            self.assertEqual(reader[0], ["candidate_id", "rank", "score", "reasoning"])
            
            # Row count check (sample candidates contains 50, but rank.py outputs up to 100 rows. So it should contain all 50)
            self.assertEqual(len(reader), len(self.sample_candidates) + 1)
            
            # Non-increasing score check
            scores = [float(row[2]) for row in reader[1:]]
            for i in range(len(scores) - 1):
                self.assertGreaterEqual(scores[i], scores[i+1], "Scores are not non-increasing by rank!")
                
        finally:
            # Clean up test output and restore backup cache
            if output_csv.exists():
                output_csv.unlink()
            if real_cache.exists():
                real_cache.unlink()
            if backup_cache.exists():
                backup_cache.rename(real_cache)

if __name__ == '__main__':
    unittest.main()
