"""Точка входа для Amvera (run.path: app.py).

Amvera запускает файл, указанный в amvera.yml как python-скрипт из корня /app.
Мы поднимаем FastAPI-приложение из пакета backend/ через uvicorn на порту из
переменной окружения PORT (по умолчанию 8080).
"""
import os

from backend.main import app  # noqa: F401  (повторно экспортируем объект приложения)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
