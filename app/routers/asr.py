from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi import Form
from typing import Optional

router = APIRouter()

# Provider can be: 'none' (default), 'whisper' (requires openai-whisper + ffmpeg), etc.
CURRENT_ASR_PROVIDER = "none"

@router.post("/transcribe")
async def transcribe_audio(
	file: UploadFile = File(...),
	language: Optional[str] = Form(default=None),
	provider: Optional[str] = Form(default=None),
):
	prov = provider or CURRENT_ASR_PROVIDER
	if prov == "none":
		raise HTTPException(status_code=503, detail="ASR provider not configured. Configure 'whisper' or cloud provider.")
	# Placeholder path: read bytes to temp and return not implemented
	# In a real setup, route to the configured provider service
	raise HTTPException(status_code=501, detail=f"ASR provider '{prov}' not implemented in this MVP.")
