# Running the Full Ranking Pipeline

This guide explains how to reproduce the full 100,000-candidate ranking from scratch on your local machine.

## System Requirements

| Requirement | Minimum |
|---|---|
| Python | 3.10 or higher |
| RAM | 16GB |
| Storage | 2GB free (for dataset + embeddings) |
| CPU | Any modern CPU (no GPU needed) |
| OS | Windows / macOS / Linux |
| Network | Not required during ranking |

## Time Estimates

| Step | Time |
|---|---|
| pip install | ~2 minutes |
| precompute.py (one time) | ~8 minutes |
| rank.py (ranking step) | ~60 seconds |
| validate_submission.py | ~5 seconds |

## Step-by-Step Instructions

### 1. Clone and Navigate
```bash
git clone https://github.com/abi131205/aura-hire-platform.git
cd aura-hire-platform/epoch-one-track1
```

### 2. Create Virtual Environment (Recommended)
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### 3. Install All Dependencies
```bash
pip install -r requirements.txt
```

### 4. Place the Dataset
Download candidates.jsonl from the hackathon-provided Google Drive link and place it here:
`epoch-one-track1/data/candidates.jsonl`

### 5. Run Precomputation
Generates the TF-IDF + SVD embedding cache. Run this once. Output saved to `artifacts/embeddings.pkl`
```bash
python precompute.py \
  --candidates ./data/candidates.jsonl \
  --out ./artifacts/embeddings.pkl
```
Expected output:
```text
[1/3] Loading candidates... 100000 loaded
[2/3] Building TF-IDF + SVD embeddings...
      Explained variance: 99.52%
[3/3] Saving cache to artifacts/embeddings.pkl
      Cache size: 153.4 MB
Precomputation complete in 7m 52s
```

### 6. Generate the Ranking
Scores all 100,000 candidates and outputs top 100. Must complete in under 5 minutes (actual: ~60 seconds).
```bash
python rank.py \
  --candidates ./data/candidates.jsonl \
  --out ./submission.csv
```
Expected output:
```text
[1/7] Loading JD configuration...        done
[2/7] Loading embeddings cache...        153.4 MB loaded
[3/7] Loading 100,000 candidates...      done in 9.2s
[4/7] Computing semantic scores...       done in 0.5s
[5/7] Computing skills + career + signals... done in 21.3s
[6/7] Combining scores, selecting top 100... done
[7/7] Generating reasoning, writing CSV...  done
Ranking complete in 32.1 seconds
Output: submission.csv (100 candidates)
```

### 7. Validate the Output
```bash
python validate_submission.py submission.csv
```
Expected output:
```text
Submission is valid.
```

### 8. View the Results
Open `submission.csv` to see the ranked candidates:
```bash
# Windows
type submission.csv

# macOS / Linux
cat submission.csv
```

## Troubleshooting

* **Issue**: `ModuleNotFoundError`
  * **Solution**: Make sure your virtual environment is activated and run `pip install -r requirements.txt` again.
* **Issue**: `MemoryError` during precompute
  * **Solution**: Close other applications to free RAM. The embedding step needs ~4GB of free memory.
* **Issue**: `candidates.jsonl` not found
  * **Solution**: Make sure the file is placed at `epoch-one-track1/data/candidates.jsonl` exactly.
* **Issue**: `validate_submission.py` fails
  * **Solution**: Do not manually edit `submission.csv`. Always regenerate it using `rank.py`.

## What the Output Looks Like

`submission.csv` contains 100 rows:
```text
candidate_id,rank,score,reasoning
CAND_0000031,1,0.8800,"Solid match: Recommendation Systems Engineer with 6.0 years; expert Pinecone (88m duration)..."
CAND_0000001,2,0.7830,"Relevant profile: Backend Engineer with 6.9 years; strong data engineering background..."
```

## Live Dashboard

While the CLI pipeline produces the official submission, you can also explore results interactively at:
https://aura-hire.netlify.app

The dashboard runs a 50-candidate demo due to Render free tier memory limits. For full 100K results, use the CLI pipeline above.
