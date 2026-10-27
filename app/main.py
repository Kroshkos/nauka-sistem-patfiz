"""Контур 1 — nauka-sistem-patfiz.

Система учета и ведения научной работы на кафедрах и подразделениях.
Пока отдаёт демо-версию (app/static/index.html) + JSON API для интеграции
с Контуром 2 (мероприятия: https://github.com/Kroshkos/nauka-site-patfiz).
"""
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse

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
        {"id": 1, "name": "Кафедра патологической физиологии", "short": "ПатФиз"},
        {"id": 2, "name": "Кафедра нормальной физиологии", "short": "НормФиз"},
        {"id": 3, "name": "Кафедра биоорганической химии", "short": "БОХ"},
    ])


@app.get("/api/works")
def works():
    """Реестр научных работ."""
    return JSONResponse([])


@app.get("/api/events")
def events_from_contour2():
    """Мероприятия из Контура 2 (для отчетов). Заменит proxy на nauka-site API."""
    return JSONResponse({
        "source": "nauka-site-patfiz.waw0.amvera.tech",
        "items": [],
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
