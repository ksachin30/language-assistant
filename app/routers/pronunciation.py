from fastapi import APIRouter
from jiwer import wer, compute_measures

from ..schemas import PronunciationRequest, PronunciationResponse

router = APIRouter()

@router.post("/score", response_model=PronunciationResponse)
async def score_pronunciation(payload: PronunciationRequest) -> PronunciationResponse:
    measures = compute_measures(payload.reference_text, payload.hypothesis_text)
    return PronunciationResponse(
        wer=measures["wer"],
        substitutions=measures["substitutions"],
        deletions=measures["deletions"],
        insertions=measures["insertions"],
    )
