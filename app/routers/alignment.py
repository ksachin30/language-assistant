from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Literal
from fastdtw import fastdtw
from math import inf

router = APIRouter()

class AlignmentRequest(BaseModel):
	reference_phonemes: List[str]
	hypothesis_phonemes: List[str]
	distance: Literal["levenshtein", "binary"] = "levenshtein"

class AlignedItem(BaseModel):
	ref: str | None
	hyp: str | None
	error: Literal["ok", "sub", "ins", "del"]

class AlignmentResponse(BaseModel):
	aligned: List[AlignedItem]
	cost: float


def _lev(a: str, b: str) -> int:
	if a == b:
		return 0
	return 1

@router.post("/align", response_model=AlignmentResponse)
async def align_phonemes(payload: AlignmentRequest) -> AlignmentResponse:
	ref = payload.reference_phonemes
	hyp = payload.hypothesis_phonemes
	# Define distance function
	def dist(i: int, j: int) -> float:
		return float(_lev(ref[i], hyp[j]))
	# Use fastdtw over indices; reconstruct alignment path using classic DP for clarity
	# Fallback simple DP alignment for small sequences to label errors precisely
	n = len(ref)
	m = len(hyp)
	dp = [[0]*(m+1) for _ in range(n+1)]
	for i in range(1, n+1): dp[i][0] = i
	for j in range(1, m+1): dp[0][j] = j
	for i in range(1, n+1):
		for j in range(1, m+1):
			cost = 0 if ref[i-1] == hyp[j-1] else 1
			dp[i][j] = min(
				dp[i-1][j] + 1,        # deletion
				dp[i][j-1] + 1,        # insertion
				dp[i-1][j-1] + cost    # substitution/match
			)
	# backtrack
	aligned: List[AlignedItem] = []
	i, j = n, m
	while i > 0 or j > 0:
		if i > 0 and j > 0 and dp[i][j] == dp[i-1][j-1] + (0 if ref[i-1]==hyp[j-1] else 1):
			error = "ok" if ref[i-1]==hyp[j-1] else "sub"
			aligned.append(AlignedItem(ref=ref[i-1], hyp=hyp[j-1], error=error))
			i -= 1; j -= 1
		elif i > 0 and dp[i][j] == dp[i-1][j] + 1:
			aligned.append(AlignedItem(ref=ref[i-1], hyp=None, error="del"))
			i -= 1
		else:
			aligned.append(AlignedItem(ref=None, hyp=hyp[j-1], error="ins"))
			j -= 1
	aligned.reverse()
	return AlignmentResponse(aligned=aligned, cost=float(dp[n][m]))
