from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..db import get_db, Base, engine
from .. import models
from ..schemas import ResultCreate, ResultOut

router = APIRouter()

# Ensure tables exist on first import
Base.metadata.create_all(bind=engine)

@router.post("/results", response_model=ResultOut)
async def create_result(payload: ResultCreate, db: Session = Depends(get_db)) -> ResultOut:
    user = db.query(models.User).filter(models.User.name == payload.user_name).first()
    if user is None:
        user = models.User(name=payload.user_name)
        db.add(user)
        db.flush()

    result = models.ExerciseResult(
        user_id=user.id,
        language=payload.language,
        input_text=payload.input_text,
        grammar_issues_count=payload.grammar_issues_count,
        wer=payload.wer,
        substitutions=payload.substitutions,
        deletions=payload.deletions,
        insertions=payload.insertions,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return ResultOut.model_validate(result)

@router.get("/results", response_model=List[ResultOut])
async def list_results(user_name: Optional[str] = Query(default=None), db: Session = Depends(get_db)) -> List[ResultOut]:
    q = db.query(models.ExerciseResult)
    if user_name:
        user = db.query(models.User).filter(models.User.name == user_name).first()
        if user is None:
            return []
        q = q.filter(models.ExerciseResult.user_id == user.id)
    results = q.order_by(models.ExerciseResult.created_at.desc()).limit(200).all()
    return [ResultOut.model_validate(r) for r in results]
