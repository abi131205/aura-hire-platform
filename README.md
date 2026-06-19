# AuraHire // Enterprise Candidate Scoring & AI Console

AuraHire is an enterprise candidate ranking platform built for the India Runs Hackathon. It combines vector semantic similarity, canonical skill alias matching, career tenure metrics, and recruitment timeline risk indicators to rank resumes in seconds with absolute mathematical precision.

This repository contains two main components:
1. **`/epoch-one-track1`**: The core candidate scoring engine (CLI pipeline) that generates and validates the final submission file.
2. **`/candidate-dashboard`**: The interactive web dashboard styled with a premium Sage & Terracotta palette, featuring real-time weight tuning sliders, candidate profile inspectors, and a Recruiter AI Copilot chat assistant.

---

## 📦 Dataset Download (Google Drive)

Because the full candidate dataset exceeds GitHub's size limits, please download the files below and place them in the correct directory:

* **Full Candidate Dataset (`candidates.jsonl`)**: [[DOWNLOAD HERE - GOOGLE DRIVE LINK](https://drive.google.com/drive/folders/1297tljn-qwgI0j8ct3JU42-VLtIwo0HL?usp=drive_link)]
* **Precomputed Embeddings Cache (`embeddings.pkl`)**: Already included in `epoch-one-track1/artifacts/` (14MB) for instant execution.

**Setup Location**: 
Place the downloaded `candidates.jsonl` file inside the `epoch-one-track1/data/` folder on your computer.

---

## 🚀 How to Run the Scorer (CLI Pipeline)

1. Navigate to the scorer directory:
   ```bash
   cd epoch-one-track1
   ```
2. Activate virtual environment and install dependencies:
   ```bash
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Run the scoring engine to generate the submission CSV:
   ```bash
   python rank.py --candidates ./data/candidates.jsonl --out ./submission.csv
   ```
4. Validate compliance:
   ```bash
   python validate_submission.py submission.csv
   ```

---

## 🖥️ How to Run the Web Dashboard locally

1. Navigate to the dashboard directory:
   ```bash
   cd candidate-dashboard
   ```
2. Run the server using the existing Python virtual environment:
   ```bash
   ..\epoch-one-track1\.venv\Scripts\python server.py
   ```
3. Open **`http://localhost:8000`** in your browser.
