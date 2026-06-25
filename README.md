# AuraHire — Intelligent Candidate Ranking Platform
### India Runs Hackathon 2026 | Track 1: Data & AI Challenge
**Team Epoch One** | Redrob × Hack2Skill

---

## 🏆 Project Overview

AuraHire is an enterprise-grade AI candidate ranking platform that scores 100,000 candidates against a job description using a four-layer mathematical scoring pipeline. It identifies the top 100 candidates the way a great recruiter would — not by matching keywords, but by understanding who genuinely fits the role.

**Live Dashboard:** https://aura-hire.netlify.app
**Backend API:** https://aura-hire.onrender.com
**GitHub Repo:** https://github.com/abi131205/aura-hire-platform

---

## 🧠 Scoring Architecture

AuraHire combines four independent scoring layers:

| Layer | Weight | What It Measures |
|---|---|---|
| Semantic Similarity | 30% | Cosine similarity between JD and candidate career narrative using TF-IDF + SVD embeddings |
| Skills Match | 25% | Cross-validated skill scoring: proficiency × log(1+duration) × log(1+endorsements) |
| Career Trajectory | 25% | Title progression, industry relevance, product vs consulting penalty |
| Behavioural Signals | 20% | 23 Redrob platform signals including notice period, GitHub activity, response rate |

**Final Score Formula:**
Score = 0.30 × Semantic + 0.25 × Skills + 0.25 × Career + 0.20 × Signals

---

## ⚡ Key Technical Achievements

- **26× Speed Optimisation:** Two-stage retrieval pipeline reduces precomputation from 3.5 hours to 8 minutes on CPU by running embeddings only on top 10,000 candidates filtered by heuristic scoring
- **Anti-Honeypot Detection:** Mathematical formula log(1 + duration_months) naturally zeroes out skills with zero months of usage — no special-case logic needed
- **Precision-Aware Sorting:** Scores rounded to 4 decimal places before sorting with candidate_id tie-breaking — passes validate_submission.py with zero errors
- **Memory-Optimised Deployment:** Backend on Render free tier reduced from 400MB+ to <40MB using lazy loading and keyword fallback scorer

---

## 📁 Repository Structure
aura-hire-platform/  
├── epoch-one-track1/          ← Core ranking pipeline  
│   ├── src/  
│   │   ├── jd_parser.py       ← JD requirements extraction  
│   │   ├── semantic_scorer.py ← Layer 1: Semantic similarity  
│   │   ├── skills_scorer.py   ← Layer 2: Skills matching  
│   │   ├── career_scorer.py   ← Layer 3: Career trajectory  
│   │   ├── signals_scorer.py  ← Layer 4: Behavioural signals  
│   │   └── ranker.py          ← Score combination + reasoning  
│   ├── artifacts/  
│   │   └── embeddings.pkl     ← Precomputed embeddings cache  
│   ├── data/  
│   │   └── sample_candidates.json  
│   ├── precompute.py          ← One-time embedding generation  
│   ├── rank.py                ← Main entry point  
│   ├── validate_submission.py ← Official hackathon validator  
│   ├── submission.csv         ← Final ranked output (100 candidates)  
│   ├── submission_metadata.yaml  
│   └── requirements.txt  
└── candidate-dashboard/       ← Interactive web dashboard  
    └── frontend/              ← React + Vite application  

---

## 🚀 Reproduction Guide

### Prerequisites
- Python 3.10 or higher
- 16GB RAM (for full 100K ranking)
- CPU only — no GPU required

### Step 1 — Clone the Repository
```bash
git clone https://github.com/abi131205/aura-hire-platform.git
cd aura-hire-platform/epoch-one-track1
```

### Step 2 — Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3 — Add the Dataset
Download candidates.jsonl from the hackathon dataset and place it at:
`epoch-one-track1/data/candidates.jsonl`

### Step 4 — Run Precomputation (One Time Only)
This generates the embeddings cache. Takes ~8 minutes on CPU. Only needs to run once.
```bash
python precompute.py \
  --candidates ./data/candidates.jsonl \
  --out ./artifacts/embeddings.pkl
```

### Step 5 — Generate the Ranking
This is the main submission step. Runs in under 60 seconds after precomputation.
```bash
python rank.py \
  --candidates ./data/candidates.jsonl \
  --out ./submission.csv
```

### Step 6 — Validate the Output
```bash
python validate_submission.py submission.csv
```
Expected output: `Submission is valid.`

---

## 📊 Submission Output

The final `submission.csv` contains 100 ranked candidates with the following columns:

| Column | Description |
|---|---|
| candidate_id | Unique ID in CAND_XXXXXXX format |
| rank | Position 1–100 |
| score | Composite score (4 decimal places) |
| reasoning | Fact-based recruiter-style reasoning |

**Score range:** 0.6445 → 0.8142  
**Runtime:** Under 60 seconds on CPU after precomputation  
**Validator:** Passes with zero errors  

---

## 🌐 Live Dashboard

The interactive dashboard at **aura-hire.netlify.app** demonstrates the scoring interface with a curated 50-candidate sample set. It includes:

- Job description upload (paste text or .docx file)
- Real-time weight adjustment sliders
- Candidate shortlist with score breakdown
- Anti-fraud honeypot inspector
- AI Matching Rationale per candidate
- Recruiter Copilot assistant
- Developer API documentation

> **Note:** The live dashboard runs on a 50-candidate demo sample due to Render free tier memory limits. The full 100,000-candidate ranking is reproduced via the CLI pipeline above (Steps 1–6).

---

## 🔌 API Reference

**Base URL:** https://aura-hire.onrender.com

| Endpoint | Method | Description |
|---|---|---|
| /health | GET | Check engine status |
| /rank | POST | Score candidates against a JD |

**POST /rank Request:**
```json
{
  "jd_text": "Full job description text here..."
}
```

**POST /rank Response:**
```json
{
  "candidates": [
    {
      "candidate_id": "CAND_0000031",
      "rank": 1,
      "score": 0.8800,
      "reasoning": "..."
    }
  ],
  "total_scored": 50,
  "scored_at": "2026-06-25T09:53:00Z"
}
```

---

## 🛡️ Anti-Fraud Detection

AuraHire automatically identifies honeypot candidates through three natural mechanisms:

1. **Zero-Duration Trap** — Skills with 0 months of usage score exactly zero via log(1+0) = 0
2. **Timeline Verification** — Career dates cross-checked against stated durations; discrepancies over 24 months trigger a 0.5× career score penalty
3. **Concurrent Role Detection** — Candidates claiming simultaneous full-time roles are flagged and removed from the shortlist automatically

---

## 👥 Team Epoch One

Built for the India Runs Hackathon 2026 by Team Epoch One — Redrob × Hack2Skill, Track 1.

| Deliverable | Status |
|---|---|
| GitHub Repository | ✅ |
| submission.csv (100 candidates) | ✅ |
| submission_metadata.yaml | ✅ |
| Live Dashboard | ✅ aura-hire.netlify.app |
| Backend API | ✅ aura-hire.onrender.com |
| PDF Pitch Deck | ✅ |

---

*AuraHire — Making hiring smarter, one signal at a time.*
