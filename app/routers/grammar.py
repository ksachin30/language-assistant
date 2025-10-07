from fastapi import APIRouter
import language_tool_python
from typing import List

from ..schemas import GrammarRequest, GrammarResponse, GrammarIssue

router = APIRouter()

@router.post("/check", response_model=GrammarResponse)
async def check_grammar(payload: GrammarRequest) -> GrammarResponse:
    tool = language_tool_python.LanguageTool(payload.language)
    matches = tool.check(payload.text)
    issues: List[GrammarIssue] = []
    for m in matches:
        issues.append(
            GrammarIssue(
                message=m.message,
                offset=m.offset,
                length=m.errorLength,
                replacements=list(m.replacements)[:5],
                rule_id=getattr(m, "ruleId", None),
            )
        )
    return GrammarResponse(issues=issues)
