"""Контур 1 — nauka-sistem-patfiz.

Система учёта и ведения научной работы на кафедрах и подразделениях:
SPA-интерфейс (backend/static) + JSON API для интеграции с Контуром 2
(мероприятия: https://github.com/Kroshkos/nauka-site-patfiz).
"""
import json
import os
import urllib.request
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

APP_TITLE = os.getenv("APP_TITLE", "Наука · Контур 1")
PORT = int(os.getenv("PORT", "8080"))
SITE_API_URL = os.getenv(
    "SITE_API_URL",
    "https://nauka-site-patfiz.waw0.amvera.tech/events.json",
)
STATIC_DIR = Path(__file__).parent / "static"

app = FastAPI(root_path=os.getenv("ROOT_PATH", ""), title=APP_TITLE)

# CORS: Контур 2 может обращаться к нашему API напрямую
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


# --- Система ролей (RBAC): единая матрица для фронта и API ---
ROLE_PERMS = {
    "admin":  ["see", "edit", "create", "delete", "approve", "export", "manage_users"],
    "science":["see", "edit", "create", "delete", "approve", "export"],
    "head":   ["see", "edit", "create", "approve", "export"],
    "staff":  ["see", "edit", "create", "export"],
    "viewer": ["see"],
}

@app.get("/api/roles")
def roles_matrix():
    """Матрица ролей/прав — используется SPA и внешними системами."""
    return {"roles": ROLE_PERMS}


@app.get("/api/me")
def whoami(x_role: str = Header(default="viewer"), x_dept: str = Header(default="")):
    """Текущая роль запроса + её права (эмуляция токена до подключения auth)."""
    role = x_role if x_role in ROLE_PERMS else "viewer"
    return {"role": role, "dept": x_dept or None, "perms": ROLE_PERMS[role]}


def require_perm(perm: str, role: str):
    if perm not in ROLE_PERMS.get(role, []):
        raise HTTPException(403, detail=f"Роль «{role}» не имеет права «{perm}»")


@app.post("/api/works")
def create_work(payload: dict, x_role: str = Header(default="viewer")):
    """Создание работы (демо-валидация прав; в проде — запись в PostgreSQL)."""
    require_perm("create", x_role)
    if not payload.get("title"):
        raise HTTPException(422, detail="Поле «title» обязательно")
    return {"ok": True, "id": f"w{os.getpid()}{len(payload)}", "role": x_role}


@app.delete("/api/works/{work_id}")
def delete_work(work_id: str, x_role: str = Header(default="viewer")):
    require_perm("delete", x_role)
    return {"ok": True, "deleted": work_id, "role": x_role}


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
def events_from_contour2(refresh: int = 0):
    """Прокси Контура 2: тянем мероприятия из nauka-site (events.json).

    Ответ кэшируется на 5 минут; ?refresh=1 принудительно обновляет кэш.
    При недоступности Контура 2 — fallback-набор, интерфейс не ломается.
    """
    global _EVENTS_CACHE
    now = __import__("time").time()
    if _EVENTS_CACHE and not refresh and now - _EVENTS_CACHE["ts"] < 300:
        return JSONResponse(_EVENTS_CACHE["data"])
    data = None
    try:
        req = urllib.request.Request(
            SITE_API_URL, headers={"User-Agent": "nauka-contour1/1.0"}
        )
        with urllib.request.urlopen(req, timeout=6) as r:
            raw = r.read().decode("utf-8")
        if raw.lstrip().startswith("["):
            items = json.loads(raw)  # events.json Контур 2 задеплоен
        else:
            raise ValueError("Контур 2 ещё не отдаёт events.json (старый билд)")
        data = {
            "source": SITE_API_URL,
            "live": True,
            "cached_at": int(now),
            "items": items,
        }
    except Exception:
        data = {
            "source": "fallback",
            "live": False,
            "cached_at": int(now),
            "items": FALLBACK_EVENTS,
        }
    _EVENTS_CACHE = {"ts": now, "data": data}
    return JSONResponse(data)


FALLBACK_EVENTS = [
    {"id": 1, "title": "Конференция «Актуальные проблемы военной медицины»",
     "date": "2026-11-18", "type_name": "Конференция", "color": "#5b8cff",
     "place": "Главный клинический корпус", "registered": 187, "capacity": 220,
     "status": "open", "organizer": "Отдел научной работы"},
    {"id": 2, "title": "Школа молодого учёного: дизайн исследований",
     "date": "2026-11-05", "type_name": "Школа", "color": "#22c55e",
     "place": "УЛК, ауд. 312", "registered": 58, "capacity": 60,
     "status": "open", "organizer": "НОМИ"},
    {"id": 5, "title": "Конкурс «Наука. Медицина. Инновации»",
     "date": "2026-12-10", "type_name": "Конкурс", "color": "#ef4444",
     "place": "Клуб академии", "registered": 96, "capacity": 150,
     "status": "open", "organizer": "Отдел науки + НОМИ"},
    {"id": 9, "title": "Выставка научных разработок ВМедА",
     "date": "2026-12-15", "type_name": "Выставка", "color": "#14b8a6",
     "place": "Фойе главного корпуса", "registered": 0, "capacity": 400,
     "status": "announce", "organizer": "Отдел научной работы"},
]

_EVENTS_CACHE = None


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
