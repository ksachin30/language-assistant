from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter()

class PhonemeRequest(BaseModel):
	text: str
	language: str  # e.g., en-us, es, fr

class PhonemeResponse(BaseModel):
	phonemes: List[str]

def _phonemize(text: str, language: str) -> List[str]:
	try:
		from phonemizer import phonemize
		phon_str = phonemize(text, language=language, backend="espeak", strip=True, preserve_punctuation=False, with_stress=True)
		# Simple tokenization by space
		return phon_str.split()
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Phonemizer error: {e}")

@router.post("/to_phonemes", response_model=PhonemeResponse)
async def to_phonemes(payload: PhonemeRequest) -> PhonemeResponse:
	phon = _phonemize(payload.text, payload.language)
	return PhonemeResponse(phonemes=phon)
