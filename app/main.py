from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

from .routers import grammar, pronunciation, progress
from .routers import asr, phonemes, alignment

app = FastAPI(title="Lets Learn", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="static")

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})

@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.get("/app", response_class=HTMLResponse)
async def app_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# New feature pages
@app.get("/grammar", response_class=HTMLResponse)
async def grammar_page(request: Request):
    return templates.TemplateResponse("grammar.html", {"request": request})

@app.get("/pronunciation", response_class=HTMLResponse)
async def pronunciation_page(request: Request):
    return templates.TemplateResponse("pronunciation.html", {"request": request})

@app.get("/asr", response_class=HTMLResponse)
async def asr_page(request: Request):
    return templates.TemplateResponse("asr.html", {"request": request})

@app.get("/phonemes", response_class=HTMLResponse)
async def phonemes_page(request: Request):
    return templates.TemplateResponse("phonemes.html", {"request": request})

@app.get("/alignment", response_class=HTMLResponse)
async def alignment_page(request: Request):
    return templates.TemplateResponse("align.html", {"request": request})

app.include_router(grammar.router, prefix="/api/grammar", tags=["grammar"]) 
app.include_router(pronunciation.router, prefix="/api/pronunciation", tags=["pronunciation"]) 
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(asr.router, prefix="/api/asr", tags=["asr"]) 
app.include_router(phonemes.router, prefix="/api/phonemes", tags=["phonemes"]) 
app.include_router(alignment.router, prefix="/api/alignment", tags=["alignment"]) 
