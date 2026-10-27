"""Тесты API Контура 1: заглушка Контура 2 поднимается локально."""
import json, threading, sys
from http.server import BaseHTTPRequestHandler, HTTPServer
sys.path.insert(0, ".")

class Stub(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps([{"id": 99, "title": "Тестовое мероприятие", "date": "2026-12-01",
                            "type_name": "Вебинар", "color": "#06b6d4", "place": "Онлайн",
                            "registered": 5, "capacity": 10, "status": "open"}]).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json")
        self.end_headers(); self.wfile.write(body)
    def log_message(self, *a): pass

stub = HTTPServer(("127.0.0.1", 8099), Stub)
threading.Thread(target=stub.serve_forever, daemon=True).start()

import os
os.environ["SITE_API_URL"] = "http://127.0.0.1:8099/events.json"
from fastapi.testclient import TestClient
import app.main as m

c = TestClient(m.app)
r = c.get("/api/events?refresh=1")
assert r.status_code == 200, r.status_code
d = r.json()
assert d["live"] is True and len(d["items"]) == 1 and d["items"][0]["id"] == 99, d
# кэш: второй запрос без refresh должен вернуть тот же payload быстро
d2 = c.get("/api/events").json()
assert d2["items"][0]["id"] == 99
# fallback при недоступном источнике
m.SITE_API_URL = "http://127.0.0.1:1/nothing"
m._EVENTS_CACHE = None
d3 = c.get("/api/events?refresh=1").json()
assert d3["live"] is False and len(d3["items"]) == 4, d3
assert c.get("/health").json()["contour"] == 1
print("ALL TESTS PASSED")
