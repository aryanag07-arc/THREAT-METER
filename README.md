# Threat Meter

For a strict 4-hour build, UPI-Shield: Contextual Digital Payment Scam & Coercion Detector [CC-GFG-02] is your best bet. Here's why it beats the others for this specific constraint:

Why this one wins on feasibility:

Explicitly rated "Very High" feasibility (~2 hrs build, 2 hrs polish) — the most generous time buffer of any problem statement in the doc.

Beginner difficulty, accessible even to a solo dev or small team of 2.

No heavy infra: no computer vision pipelines (unlike CivicEye/PhishLens which need YOLOv8/OpenCV tuning), no AST parsing edge cases (CodeSanitizer), no live PyPI/API dependency risk during a demo.

Core logic is just rule-based/keyword-weighted urgency detection + a zero-shot classifier — you can even ship a strong MVP with pure keyword/regex heuristics scored against a rubric (though avoid trivial string matching since judges explicitly reject that — use a small weighted-scoring system instead).

The demo is simple, visual, and impressive: paste a scam SMS → get a "Threat Meter" + Hindi translation. Judges can see the value in 30 seconds.

Suggested 4-hour build plan:

Hour 1: Streamlit UI — text input box, "Analyze" button, threat meter (progress bar/gauge).

Hour 1.5: Detection engine — combine a curated list of urgency/authority-claim phrases (weighted scoring) + Hugging Face zero-shot-classification pipeline (facebook/bart-large-mnli) to classify intent categories like "urgency," "authority impersonation," "financial request."

Hour 0.5: Google Translate API (or googletrans free lib) for Hindi output.

Hour 1: Polish UI (color-coded risk levels, sample scam messages as quick-test buttons).

Last hour: Test edge cases, prep the 60–90 sec demo script exactly as described (paste "refund verification" scam → High Risk + Hindi warning).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0212b14f-9ba0-4e36-8971-6b31c5be8c81).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
