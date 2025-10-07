from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=True)

    results = relationship("ExerciseResult", back_populates="user", cascade="all, delete-orphan")

class ExerciseResult(Base):
    __tablename__ = "exercise_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    language = Column(String(10), nullable=False)
    input_text = Column(Text, nullable=True)
    grammar_issues_count = Column(Integer, nullable=False, default=0)
    wer = Column(Float, nullable=True)
    substitutions = Column(Integer, nullable=True)
    deletions = Column(Integer, nullable=True)
    insertions = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="results")
