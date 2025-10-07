from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class GrammarIssue(BaseModel):
    message: str
    offset: int
    length: int
    replacements: List[str] = Field(default_factory=list)
    rule_id: Optional[str] = None

class GrammarRequest(BaseModel):
    text: str
    language: str = Field(description="BCP-47 code, e.g., en-US, es, fr")

class GrammarResponse(BaseModel):
    issues: List[GrammarIssue]

class PronunciationRequest(BaseModel):
    reference_text: str
    hypothesis_text: str
    language: str = Field(description="BCP-47 code, e.g., en-US, es, fr")

class PronunciationResponse(BaseModel):
    wer: float
    substitutions: int
    deletions: int
    insertions: int

class ResultCreate(BaseModel):
    user_name: str
    language: str
    input_text: Optional[str] = None
    grammar_issues_count: int = 0
    wer: Optional[float] = None
    substitutions: Optional[int] = None
    deletions: Optional[int] = None
    insertions: Optional[int] = None

class ResultOut(BaseModel):
    id: int
    user_id: int
    language: str
    input_text: Optional[str]
    grammar_issues_count: int
    wer: Optional[float]
    substitutions: Optional[int]
    deletions: Optional[int]
    insertions: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
