import hashlib
import hmac
import os
import secrets
import smtplib
import time
from email.message import EmailMessage
from threading import Lock

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"], supports_credentials=True)
SESSION_SECRET = os.getenv("SOZO_SESSION_SECRET", "sozo-dev-session-secret-change-me")
CODE_TTL_SECONDS = 10 * 60
users = {
    "lecteur@sozo.fr": {
        "email": "lecteur@sozo.fr",
        "password_hash": generate_password_hash("Lecteur123!"),
        "role": "reader",
        "name": "Lecteur Sozo",
    },
    "auteur@sozo.fr": {
        "email": "auteur@sozo.fr",
        "password_hash": generate_password_hash("Auteur123!"),
        "role": "author",
        "name": "Auteur Sozo",
    },
}
sessions: dict[str, tuple[str, float]] = {}
verification_codes: dict[str, dict[str, float | int | str]] = {}
state_lock = Lock()


def public_user(user: dict) -> dict:
    return {"email": user["email"], "role": user["role"], "name": user["name"]}


def session_cookie(email: str) -> str:
    expires = int(time.time() + 8 * 60 * 60)
    raw = f"{email}:{expires}"
    signature = hmac.new(SESSION_SECRET.encode(), raw.encode(), hashlib.sha256).hexdigest()
    token = f"{raw}:{signature}"
    with state_lock:
        sessions[token] = (email, expires)
    return token


def current_user() -> dict | None:
    token = request.cookies.get("sozo_session")
    if not token:
        return None
    with state_lock:
        session = sessions.get(token)
    if not session or session[1] < time.time():
        return None
    return users.get(session[0])


def send_code(email: str, code: str) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    if not smtp_host:
        app.logger.warning("[DEV] Code de connexion pour %s: %s", email, code)
        return

    message = EmailMessage()
    message["Subject"] = "Votre code de connexion Sozo"
    message["From"] = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "no-reply@sozo.fr"))
    message["To"] = email
    message.set_content(f"Votre code de connexion Sozo est {code}. Il expire dans 10 minutes.")
    with smtplib.SMTP(smtp_host, int(os.getenv("SMTP_PORT", "587"))) as smtp:
        if os.getenv("SMTP_SECURE", "false").lower() == "true":
            smtp.starttls()
        smtp.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
        smtp.send_message(message)


def set_session(response, email: str):
    response.set_cookie("sozo_session", session_cookie(email), httponly=True, samesite="Lax", max_age=8 * 60 * 60)
    return response


@app.get("/api/me")
def me():
    user = current_user()
    return jsonify(user=public_user(user) if user else None)


@app.post("/api/auth/request-code")
def request_code():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    user = users.get(email)
    if not user or not check_password_hash(user["password_hash"], str(data.get("password", ""))):
        return jsonify(error="Adresse e-mail ou mot de passe incorrect."), 401
    if data.get("role") and data["role"] != user["role"]:
        return jsonify(error="Ce compte ne possède pas les droits demandés."), 403

    code = f"{secrets.randbelow(900000) + 100000}"
    with state_lock:
        verification_codes[email] = {
            "hash": hashlib.sha256(code.encode()).hexdigest(),
            "expires": time.time() + CODE_TTL_SECONDS,
            "attempts": 0,
        }
    try:
        send_code(email, code)
    except (OSError, smtplib.SMTPException, KeyError):
        with state_lock:
            verification_codes.pop(email, None)
        return jsonify(error="L'e-mail n'a pas pu être envoyé. Vérifiez la configuration SMTP."), 502
    return jsonify(message=f"Un code a été envoyé à {email}.")


@app.post("/api/auth/verify-code")
def verify_code():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    with state_lock:
        pending = verification_codes.get(email)
        if pending:
            pending["attempts"] = int(pending["attempts"]) + 1
    if not pending or pending["expires"] < time.time() or int(pending["attempts"]) > 5:
        return jsonify(error="Code invalide ou expiré."), 401
    received_hash = hashlib.sha256(str(data.get("code", "")).encode()).hexdigest()
    if not hmac.compare_digest(received_hash, str(pending["hash"])):
        return jsonify(error="Code invalide ou expiré."), 401
    with state_lock:
        verification_codes.pop(email, None)
    response = jsonify(user=public_user(users[email]))
    return set_session(response, email)


@app.post("/api/auth/signup")
def signup():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    if not email or not data.get("password") or not data.get("name"):
        return jsonify(error="Tous les champs sont obligatoires."), 400
    if email in users:
        return jsonify(error="Cette adresse e-mail est déjà utilisée."), 409
    role = "author" if data.get("role") == "author" else "reader"
    users[email] = {
        "email": email,
        "password_hash": generate_password_hash(str(data["password"])),
        "role": role,
        "name": str(data["name"]),
    }
    response = jsonify(user=public_user(users[email]))
    response.status_code = 201
    return set_session(response, email)


@app.post("/api/auth/logout")
def logout():
    response = jsonify(user=None)
    response.set_cookie("sozo_session", "", expires=0, httponly=True, samesite="Lax")
    return response


@app.get("/api/author")
def author_studio():
    user = current_user()
    if not user:
        return jsonify(error="Connexion auteur requise."), 401
    if user["role"] != "author":
        return jsonify(error="Accès réservé aux auteurs."), 403
    return jsonify(studio={"published": 3, "readers": 1420, "followers": 310})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "3001")), debug=True)
