"""Контур 1 — nauka-sistem-patfiz.

Система учёта и ведения научной работы на кафедрах и подразделениях:
SPA-интерфейс (app/static) + JSON API для интеграции с Контуром 2
(мероприятия: https://github.com/Kroshkos/nauka-site-patfiz).
"""
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

APP_TITLE = os.getenv("APP_TITLE", "Наука · Контур 1")
PORT = int(os.getenv("PORT", "8080"))
STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(title=APP_TITLE)


@app.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
def health():
    return {"status": "ok", "app": APP_TITLE, "contour": 1}


# --- Демо-API (заглушки до реализации реальной БД) ---

@app.get("/api/departments")
def departments():
    """Кафедры и подразделения."""
    return JSONResponse([
        {"id": "d1", "name": "Кафедра терапии", "short": "Терапия"},
        {"id": "d2", "name": "Кафедра патологической физиологии", "short": "Пат. физиол."},
        {"id": "d3", "name": "Кафедра оперативной хирургии", "short": "Опер. хир."},
        {"id": "d4", "name": "Кафедра фармакологии", "short": "Фармакология"},
        {"id": "d5", "name": "НИЛ биомедицинской инженерии", "short": "НИЛ БМЕ"},
        {"id": "d6", "name": "Кафедра микробиологии", "short": "Микробиол."},
    ])


@app.get("/api/works")
def works():
    """Реестр научных работ (демо-набор совпадает с интерфейсом)."""
    return JSONResponse([
        {"id": "w1", "title": "Механизмы ремоделирования миокарда", "type": "article",
         "department_id": "d2", "status": "progress", "year": 2026},
        {"id": "w2", "title": "Грант РНФ №23-15-00412", "type": "grant",
         "department_id": "d6", "status": "review", "year": 2026},
        {"id": "w9", "title": "Модели резистентности к антибиотикам", "type": "article",
         "department_id": "d6", "status": "done", "year": 2025},
    ])


@app.get("/api/stats")
def stats():
    """Сводные метрики для дашбордов и виджетов Контура 2."""
    return JSONResponse({
        "works_total": 12, "publications": 4, "grants_active": 3,
        "patents": 2, "reports_on_review": 2, "year": 2026,
    })


@app.get("/api/events")
def events_from_contour2():
    """Мероприятия из Контура 2 (для отчётов). Заменит proxy на nauka-site API."""
    return JSONResponse({
        "source": "nauka-site-patfiz.waw0.amvera.tech",
        "items": [],
    })


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
