# 📋 PAPERLESS-NGX PROJEKT - QUICK START

**Kurzer Onboarding-Prompt für schnelle Sessions**

---

## 1️⃣ LIES DIESE DATEIEN (in Reihenfolge):
- `README.md` (Projekt-Übersicht)
- `DEPLOYMENT_STATUS.md` (Status)
- `GOOGLE_ACCOUNTS_SETUP.md` (2 Google Accounts!)
- `SSH_ACCESS.md` (Server-Zugang)

---

## 2️⃣ PRÜFE MCP-SERVER:
- ✅ Desktop Commander (`clasp --version`)
- ✅ GitHub MCP (`gh --version`)
- ✅ Context7
- ✅ Supabase MCP

---

## 3️⃣ WICHTIGSTE INFO:
- ✅ Paperless-NGX auf Hetzner CX32 (Docker)
- ✅ **2 Google Accounts** exportieren E-Mails:
  - `philip@zepta.com` (ZEPTA Workspace)
  - `phkoenig@gmail.com` (Privat)
- ✅ Master-Script: `scripts/master-gmail-to-paperless/Code.js` (v3)
- ✅ SSH-Zugang: `ssh paperless` (Key-Auth aktiv)
- ✅ Server: 91.98.40.206 / archive.megabrain.cloud

---

## 4️⃣ USER-PRÄFERENZEN:
- Deutsch/Englisch gemischt, "Du" verwenden
- **NIEMALS ohne Erlaubnis committen!**
- Nur eine Änderung auf einmal
- Nach Änderungen testen
- **Root-Verzeichnis sauber halten!**

---

## 5️⃣ ORDNERSTRUKTUR (WICHTIG!):
**Root sauber halten! Verwende immer die richtigen Ordner:**

```
paperless/
├── infra/          → Docker Stack (Hetzner)
├── scripts/        → Google Apps Script
├── docs/           → Dokumentation
├── config/         → AI Taxonomy
├── onboarding/     → Startup-Prompts (dieser Ordner)
├── ideas/          → Lose Ideen & Notizen
├── tests/          → Test-Scripts & Fixtures
├── examples/       → Code-Beispiele
├── temp/           → Temporäre Dateien (gitignored)
└── archive/        → Alte Versionen
```

**Wo was hingehört:**
- 📝 Tests → `tests/`
- 💡 Beispiele → `examples/`
- 🗂️ Temporäres → `temp/`
- 💭 Ideen → `ideas/`
- 📦 Altes → `archive/`

---

## 6️⃣ OFFENE TODOS:
- ⏳ AI-Klassifikation (`infra/invoice-ai/app.py`)
- ⏳ TLS aktivieren (Caddyfile)
- ⏳ Workflows einrichten

---

## ✅ NACH DEM LESEN:

Antworte mit:
> "✅ Bereit!
> - Projekt verstanden (Paperless-NGX + 2 Google Accounts)
> - MCP-Server: Desktop Commander ✅, GitHub ✅, Context7 ✅, Supabase ✅
> - Ordnerstruktur verstanden (Root sauber halten!)
> 
> Was möchtest du heute arbeiten?"

---

**Für Details:** Siehe `onboarding/START_HERE.md`

