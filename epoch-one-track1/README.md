# India Runs Hackathon — Track 1: Intelligent Candidate Discovery & Ranking

## Team: Epoch One

This repository contains Team Epoch One's solution for Track 1: The Data & AI Challenge of the India Runs Hackathon. The objective is to rank 100,000 candidate profiles against a specific Job Description (JD) for a **Senior AI Engineer — Founding Team** role.

---

## 🚀 Quick Start (Reproduce Submission)

To run the pipeline and generate the final `submission.csv` from `candidates.jsonl`, run:

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run offline precomputation (one-time step to embed profiles and cache skills)
python precompute.py --candidates ./data/candidates.jsonl --out ./artifacts/embeddings.pkl

# 3. Execute the ranker (Main reproduce command, completes in under 10 seconds)
python rank.py --candidates ./data/candidates.jsonl --out ./submission.csv
```

---

## 🏗️ Architecture Summary

Our candidate ranking system uses a weighted composite scoring architecture across 4 distinct layers:

$$\text{Final Score} = 0.30 \times \text{Semantic} + 0.25 \times \text{Skills} + 0.25 \times \text{Career} + 0.20 \times \text{Signals}$$

### 1. Semantic Similarity Score (Layer 1 - Weight: 30%)
- **Model**: `all-MiniLM-L6-v2` (sentence-transformers), a lightweight, CPU-efficient model.
- **Logic**: Candidates are represented by concatenating their summary, current title, and career history descriptions. Cosine similarity is computed between candidate vectors and the parsed JD embedding vector.
- **Performance Optimization**: Candidate text embeddings are pre-computed offline and cached in `artifacts/embeddings.pkl`. At ranking time, cosine similarity is computed in milliseconds using optimized numpy dot products.

### 2. Skills Match Score (Layer 2 - Weight: 25%)
- **Formula**:
  $$\text{Skill Score} = \text{proficiency\_weight} \times \log(1 + \text{duration\_months}) \times \log(1 + \text{endorsements})$$
- **Logic**: Candidate skills are mapped to canonical JD skill categories (e.g. vector search, LLM fine-tuning). We take the maximum score for each canonical category.
- **Cross-Validation**: Self-reported proficiency alone is not trusted. If a candidate claims a skill but has 0 duration or 0 endorsements, that term reduces to 0. A skill alias map is precomputed offline to accelerate ranking time.

### 3. Career Trajectory Score (Layer 3 - Weight: 25%)
- **Seniority Match**: Evaluates candidate's total years of experience against the JD range (5-9 years preferred, with smooth scaling outside).
- **Career Progression**: Rates career growth based on transitions from junior roles to senior/lead/architect titles.
- **Penalties**:
  - **Consulting Trap**: Candidates whose career history is *entirely* at service/consulting companies (TCS, Infosys, Wipro, Accenture, Cognizant, Capgemini) receive a 0.1x multiplier.
  - **Stagnation Trap**: Candidates remaining in the exact same title at the same company for 10+ years receive a 0.5x multiplier.

### 4. Redrob Behavioral Signals Score (Layer 4 - Weight: 20%)
- **Logic**: Evaluates recruiter readiness using platform engagement signals.
- **Recency Decay**: Computes candidate activity days ago relative to `datetime.today()`, applying an exponential decay.
- **Weighting**: Combines availability (`open_to_work_flag`), notice period (sub-30 day buyout preferred), recruiter response rate, interview completion rate, offer acceptance rate, and verified profile metrics.

---

## 🛡️ Honeypot Filtering

The dataset contains ~80 fake "honeypot" candidates with impossible profiles. Our scorers naturally filter them out:
1. **0-Duration Expert Skills**: If a candidate claims "expert" or "advanced" in a skill but has `duration_months = 0`, the skill score is 0. If a candidate has $\ge 3$ such fake skills, their entire skills score is multiplied by 0.0.
2. **Date Range Discrepancies**: If a candidate claims a role duration (in months) that is inconsistent with the elapsed calendar months between `start_date` and `end_date` (difference $> 12$ months), the career score is set to 0.0.
3. **Role Duration > YOE**: If a single role's duration exceeds the total stated years of experience by more than 6 months, the career score is set to 0.0.
4. **Invalid Salary Ranges**: If the minimum expected salary exceeds the maximum expected salary in `expected_salary_range_inr_lpa`, the signals score is set to 0.0.

---

## 📂 Repository Structure

```
epoch-one-track1/
│
├── README.md                     ← Setup instructions + reproduce guide
├── submission_metadata.yaml      ← Challenge metadata
├── requirements.txt              ← Pinned dependencies
│
├── rank.py                       ← Main execution script
├── precompute.py                 ← Offline precomputation script
│
├── src/
│   ├── __init__.py
│   ├── jd_parser.py              ← Custom docx parser & JD terms extractor
│   ├── semantic_scorer.py        ← Layer 1 scorer (cosine similarity)
│   ├── skills_scorer.py          ← Layer 2 scorer (skills validation)
│   ├── career_scorer.py          ← Layer 3 scorer (trajectory & traps)
│   ├── signals_scorer.py         ← Layer 4 scorer (behavioral signals)
│   └── ranker.py                 ← Combined scorer & reasoning generator
│
├── artifacts/
│   └── embeddings.pkl            ← Precomputed cache (generated via precompute.py)
│
├── data/
│   ├── candidates.jsonl          ← Full dataset (100,000 candidates)
│   └── sample_candidates.json    ← Test subset (50 candidates)
│
├── validate_submission.py        ← Official validator script
│
└── tests/
    └── test_pipeline.py          ← Test suite (JD, scorers, integration)
```
