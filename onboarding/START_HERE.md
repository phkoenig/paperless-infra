# 🚀 Cursor AI Startup Prompt - Paperless-NGX Projekt

**Kopiere diesen Text zu Beginn jeder neuen Cursor AI Session:**

---

## 📋 Projekt-Onboarding

Hallo! Ich arbeite am **Paperless-NGX Deployment Projekt**. Bitte verschaffe dir einen Überblick:

### **1. Projekt verstehen**
Lies bitte folgende Dateien in dieser Reihenfolge:
1. `README.md` - Projekt-Übersicht
2. `DEPLOYMENT_STATUS.md` - Aktueller Status
3. `GOOGLE_ACCOUNTS_SETUP.md` - E-Mail Integration (2 Accounts)
4. `SSH_ACCESS.md` - Server-Zugang

### **2. MCP-Server Status prüfen**
Bitte prüfe, ob diese MCP-Server funktionieren:
- **Desktop Commander** - Für Server-SSH-Befehle & File Operations
- **GitHub MCP** - Für Git-Operationen
- **Context7** - Für Library-Dokumentation
- **Supabase MCP** - Für Datenbank-Operationen (falls benötigt)

Teste kurz mit:
```bash
# Desktop Commander Test
clasp --version

# GitHub MCP Test
gh --version

# Supabase Test (falls konfiguriert)
# Wird automatisch verfügbar sein wenn benötigt
```

### **3. Codebase-Struktur verstehen**
```
paperless/
├── infra/                    # Docker Compose Stack (Hetzner Server)
├── scripts/                  # Google Apps Script (E-Mail Export)
├── config/                   # AI Taxonomy & Konfigurationen
├── docs/                     # Alle READMEs & Dokumentation
├── onboarding/              # 🆕 Onboarding-Materialien & Startup-Prompts
├── ideas/                    # 🆕 Lose Ideen & Notizen
├── tests/                    # Test-Scripts & Fixtures
├── examples/                 # Code-Beispiele & Referenzen
├── temp/                     # Temporäre Dateien (gitignored)
└── archive/                  # Alte/Veraltete Versionen
```

### **4. Wichtige Technologien**
- **Paperless-NGX** - Dokumentenmanagement (Docker auf Hetzner CX32)
- **Google Apps Script** - E-Mail Export (2 Accounts)
- **rclone** - Google Drive → Hetzner Sync
- **Docker Compose** - Orchestrierung aller Services
- **clasp** - Google Apps Script CLI
- **PostgreSQL** - Datenbank
- **Redis** - Task Queue
- **Supabase** - Für zukünftige Features (optional)

### **5. Google Accounts (WICHTIG!)**
Wir haben **ZWEI Google Accounts**, die beide E-Mails zu Paperless exportieren:
1. **philip@zepta.com** (ZEPTA Google Workspace)
2. **phkoenig@gmail.com** (Privater Account)

Beide verwenden das **gleiche Master-Script** in `scripts/master-gmail-to-paperless/Code.js` (v3)

### **6. Server-Zugang**
- **SSH:** `ssh paperless` (SSH-Key Auth ist eingerichtet)
- **IP:** 91.98.40.206
- **Domain:** archive.megabrain.cloud
- **Web-UI:** http://91.98.40.206

### **7. Ordnerstruktur-Regeln (WICHTIG!)**
**Root-Verzeichnis sauber halten!** Nur wichtigste Dateien im Root:
- ✅ `README.md`, `DEPLOYMENT_STATUS.md`, etc. (Haupt-Docs)
- ✅ `cloud-init.yaml`, `.gitignore` (Konfig)
- ❌ Keine Test-Scripts, Beispiele, temporäre Dateien!

**Verwende IMMER die richtigen Ordner:**
- 📝 **`tests/`** - Für Test-Scripts & Fixtures
- 💡 **`examples/`** - Für Code-Beispiele & Referenzen
- 🗂️ **`temp/`** - Für temporäre/experimentelle Dateien
- 💭 **`ideas/`** - Für lose Ideen & Notizen
- 📦 **`archive/`** - Für alte/veraltete Versionen
- 🚀 **`onboarding/`** - Für Onboarding-Materialien

### **8. User-Präferenzen (aus Rules)**
- Deutsch/Englisch gemischt (wie es passt)
- "Du" verwenden (Philip)
- Immer `uv` statt `pip` für Python
- `edit_file` bevorzugen (nicht `search_replace` für große Änderungen)
- Nach Änderungen: Testen oder `git commit`
- **Nur eine Änderung auf einmal**
- **NIEMALS ohne Erlaubnis committen**
- **Root-Verzeichnis sauber halten** - richtige Ordner verwenden!

### **9. Aktuelle Arbeit / Offene TODOs**
Prüfe `paperless-ngx-deployment.plan.md` für:
- ⏳ AI-Klassifikation implementieren (`infra/invoice-ai/app.py`)
- ⏳ TLS aktivieren (Caddyfile auf HTTPS umstellen)
- ⏳ Workflows in Paperless einrichten

---

## ✅ Quick-Check Checklist

Bitte bestätige kurz:
- [ ] READMEs gelesen und verstanden
- [ ] MCP-Server getestet (Desktop Commander, GitHub, Context7, Supabase)
- [ ] Ordnerstruktur verstanden
- [ ] **Ordnerstruktur-Regeln** verstanden (Root sauber halten!)
- [ ] Google Accounts Setup verstanden (2 Accounts!)
- [ ] SSH-Zugang klar
- [ ] User-Präferenzen notiert

---

## 🎯 Bereit für Arbeit!

Nachdem du alles gelesen hast, sag mir kurz:
1. Was du verstanden hast (kurze Zusammenfassung)
2. Ob MCP-Server funktionieren
3. Ob du Fragen hast
4. Dann sag mir: "Bereit! Was möchtest du heute am Projekt arbeiten?"

---

## 📝 Beispiel-Antwort von dir:

> "✅ Projekt verstanden:
> - Paperless-NGX auf Hetzner CX32 (Docker Stack)
> - 2 Google Accounts (philip@zepta.com + phkoenig@gmail.com)
> - Master-Script (v3) exportiert E-Mails → Google Drive → rclone → Paperless
> - SSH-Key Auth eingerichtet (`ssh paperless`)
> - **Root-Verzeichnis sauber halten** - richtige Ordner verwenden!
> 
> ✅ MCP-Server:
> - Desktop Commander: ✅ Funktioniert (clasp gefunden)
> - GitHub MCP: ✅ Funktioniert (gh gefunden)
> - Context7: ✅ Verfügbar
> - Supabase MCP: ✅ Verfügbar
> 
> ✅ Ordnerstruktur verstanden:
> - tests/ für Tests
> - examples/ für Beispiele
> - temp/ für Temporäres
> - ideas/ für Ideen
> - onboarding/ für Startup-Prompts
> 
> ✅ Offene TODOs gesehen:
> - AI-Klassifikation (invoice-ai)
> - TLS aktivieren
> - Workflows einrichten
> 
> 🚀 Bereit! Was möchtest du heute am Projekt arbeiten?"

---

## 🔧 Häufige Befehle (für dich)

### **Google Apps Script deployen:**
```bash
cd scripts/master-gmail-to-paperless
clasp logout && clasp login  # Passenden Account wählen
clasp push --force
```

### **Server-Logs prüfen:**
```bash
ssh paperless
docker compose -f /opt/paperless/infra/docker-compose.yml logs -f paperless-consumer
```

### **Git Status:**
```bash
git status
git log --oneline -5
```

---

## ⚠️ Wichtige Hinweise

1. **NIEMALS committen ohne explizite Erlaubnis!**
2. **Zwei Google Accounts** - nicht vergessen!
3. **SSH-Key Auth** ist aktiv - kein Passwort nötig
4. **Master-Script** ist in `scripts/master-gmail-to-paperless/`
5. **Alte Scripts** sind in `archive/` (nicht mehr verwenden)
6. **Sensible Daten** (rclone.conf, .env) sind in `.gitignore`
7. **Root-Verzeichnis sauber halten!** - Verwende richtige Ordner:
   - `tests/` für Tests
   - `examples/` für Beispiele
   - `temp/` für Temporäres (gitignored)
   - `ideas/` für Ideen
   - `archive/` für Altes

---

**Ende des Startup-Prompts** - Jetzt bist du bereit! 🚀

