# AI Language Learning Assistant (MVP)

An MVP that analyzes written text for grammar issues and spoken input for pronunciation feedback (WER), provides corrective suggestions, and tracks progress over time.

## Features

- Grammar checking via LanguageTool (multi-language)
- Pronunciation feedback via WER metrics (jiwer)
- Optional ASR upload API (provider pluggable; placeholder by default)
- Phoneme conversion via phonemizer/eSpeak
- DTW-style alignment on phoneme sequences for error highlighting
- Simple frontend with Web Speech API for recognition
- Progress tracking with SQLite and basic chart

## Prerequisites

- Python 3.10+
- Windows 10/11

## Setup (Windows)

1. Create venv and install deps (run in project root):

```cmd
py -3 -m venv .venv
.venv\Scripts\pip install --upgrade pip
.venv\Scripts\pip install -r requirements.txt
```

2. Run the server:

```cmd
.venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. Open the app:

- Navigate to `http://localhost:8000` in Chrome (for Web Speech API).

## Extra installs for phonemes (Windows)

- Install eSpeak NG and ensure it is on PATH so `phonemizer` backend `espeak` works.
  - Download from `https://github.com/espeak-ng/espeak-ng/releases` and install.

## APIs

- POST `/api/grammar/check` { text, language }
- POST `/api/pronunciation/score` { reference_text, hypothesis_text, language }
- POST `/api/asr/transcribe` multipart form: file, language, provider ("none" placeholder)
- POST `/api/phonemes/to_phonemes` { text, language }
- POST `/api/alignment/align` { reference_phonemes: string[], hypothesis_phonemes: string[], distance? }
- GET `/api/progress/results`
- POST `/api/progress/results`

## Notes

- Language codes: use BCP‑47 like `en-US`, `es`, `fr`. For phonemizer, use lowercased like `en-us`.
- ASR provider is a stub; integrate Google/Azure/AWS or Whisper as needed.
- For real-time phoneme-level scoring, consider: MFCC extraction, VAD, alignment models, or wav2vec2-based mispronunciation detection.
