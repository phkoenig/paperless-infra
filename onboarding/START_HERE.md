# 🚀 Cursor AI Startup Prompt - Paperless-NGX Projekt

**Kopiere diesen Text zu Beginn jeder neuen Cursor AI Session:**

---

## 📋 Projekt-Onboarding

Hallo! Ich arbeite am **Paperless-NGX Deployment Projekt**. Bitte verschaffe dir einen Überblick:

### **1. Projekt-Übersicht schnell erfassen**

**Haupt-README lesen:**
```
README.md - Vollständige Projekt-Übersicht
```

**Status & Workflow:**
- [Kompletter Workflow](../docs/README_Complete_Workflow.md) - **START HIER!** Gmail → Paperless (v4.2)
- [DEPLOYMENT_STATUS.md](../DEPLOYMENT_STATUS.md) - Aktueller Status

### **2. Wichtigste Technologien**

- **Paperless-NGX:** Dokumentenmanagement (Docker auf Hetzner CX32)
- **Apps Script v4.2:** E-Mail Export (.eml Format!)
- **eml2pdf:** Konvertiert .eml → PDF (via Gotenberg)
- **rclone:** Google Drive → Hetzner Sync
- **Paperless MCP:** ⚠️ **WICHTIG!** Administration via MCP, NICHT SSH!
- **Supabase:** Filter Whitelist/Blacklist
- **PostgreSQL:** Datenbank
- **Redis:** Task Queue

### **3. Zwei Google Accounts (WICHTIG!)**

Wir haben **ZWEI Google Accounts**, beide exportieren zu Paperless:
1. **philip@zepta.com** (ZEPTA Google Workspace)
2. **phkoenig@gmail.com** (Privater Account)

Beide verwenden das **gleiche Master-Script v4.2** in `scripts/master-gmail-to-paperless/Code.js`

### **4. Der komplette Workflow (v4.2)**

```
1. Gmail (2 Accounts)
   ↓ Apps Script v4.2 (alle 5 Min)
   
2. Google Drive (Strukturiert)
   Paperless-Emails/
   └── [timestamp]_[sender]_[subject]/
       ├── email.eml              ← RAW E-Mail!
       ├── email-metadata.json
       └── attachments...
   ↓ rclone copy (alle 5 Min)
   
3. Hetzner Server
   /opt/paperless/consume/emails/
   └── [strukturiert wie oben]
   ↓ eml2pdf (on-demand)
   
4. PDF Konvertierung
   /opt/paperless/consume/
   └── [timestamp]_[sender]_[subject].pdf  ← FLACH!
   ↓ Paperless Consumer (kontinuierlich)
   
5. Paperless-NGX
   ✅ OCR, durchsuchbar, archiviert
```

**Dauer:** ~5-15 Minuten von Gmail bis Paperless

### **5. Server-Zugang**

- **SSH:** `ssh paperless` (SSH-Key Auth eingerichtet)
- **IP:** 91.98.40.206
- **Domain:** archive.megabrain.cloud (HTTPS aktiv!)
- **Web-UI:** https://archive.megabrain.cloud

### **6. ⚠️ WICHTIG: MCP statt SSH!**

**FÜR PAPERLESS-ADMINISTRATION:**
- ✅ **Nutze Paperless MCP** (in Cursor AI integriert)
- ❌ **NICHT SSH** (nur für Server-Wartung!)

**Warum MCP?**
- 10x schneller
- Type-Safe
- Keine Django Shell Probleme
- Automatisch verfügbar

**MCP Beispiele:**
```javascript
// Dokumente suchen
const docs = await mcp_paperless_list_documents({
  search: "rechnung",
  page_size: 20
});

// Tags auflisten
const tags = await mcp_paperless_list_tags({
  page_size: 100
});

// Dokument aktualisieren
await mcp_paperless_update_document({
  id: 126,
  tags: [1, 5, 10]
});
```

**Mehr Infos:** [docs/README_MCP_Administration.md](../docs/README_MCP_Administration.md)

---

## 🗂️ Codebase-Struktur

```
paperless/
├── infra/                    # Docker Compose Stack (Hetzner Server)
│   ├── docker-compose.yml    # Alle Services
│   ├── eml2pdf/              # .eml → PDF Konverter
│   ├── invoice-ai/           # AI Classifier (in Planung)
│   ├── caddy/                # Reverse Proxy + TLS
│   └── rclone/               # Google Drive Sync Konfig
│
├── scripts/                  # Scripts & Automation
│   ├── master-gmail-to-paperless/  # Apps Script v4.2 (MASTER!)
│   ├── paperless-mcp/        # Python MCP Server
│   └── paperless-mcp-nloui/  # Node.js MCP Server
│
├── config/                   # Konfigurationen
│   └── categories_mapping.json     # AI Taxonomy (für später)
│
├── docs/                     # 📚 Dokumentation (START HIER!)
│   ├── README_Complete_Workflow.md  # ⭐ Kompletter Workflow
│   ├── README_MCP_Administration.md # ⭐ MCP Admin Guide
│   ├── README_Deduplication.md      # Message-ID & SHA-256
│   ├── README_Email_Filter.md       # Intelligenter Filter
│   ├── README_GALAXY_SYSTEM_KI_NAVIGATION.md  # Für später
│   ├── README_Deploy.md             # Server Setup
│   └── README_Usage.md              # Paperless Web-UI
│
├── onboarding/               # 🆕 Onboarding-Materialien
│   ├── START_HERE.md         # Diese Datei!
│   ├── QUICK_START.md        # Kurz-Version
│   └── README.md             # Onboarding-Übersicht
│
├── ideas/                    # 💭 Ideen & Planungen
│   └── README_AI_Classifier_PLAN.md  # AI Classifier (nicht implementiert)
│
├── temp/                     # Temporäre Dateien (gitignored)
├── archive/                  # Alte/Veraltete Versionen
├── tests/                    # Test-Scripts & Fixtures
└── examples/                 # Code-Beispiele & Referenzen
```

---

## 📋 Ordnerstruktur-Regeln (WICHTIG!)

**Root-Verzeichnis sauber halten!** Nur wichtigste Dateien im Root:
- ✅ `README.md`, `DEPLOYMENT_STATUS.md`, etc. (Haupt-Docs)
- ✅ `cloud-init.yaml`, `.gitignore` (Konfig)
- ❌ Keine Test-Scripts, Beispiele, temporäre Dateien!

**Verwende IMMER die richtigen Ordner:**
- 📝 **`tests/`** - Für Test-Scripts & Fixtures
- 💡 **`examples/`** - Für Code-Beispiele & Referenzen
- 🗂️ **`temp/`** - Für temporäre/experimentelle Dateien (gitignored)
- 💭 **`ideas/`** - Für Ideen & Planungen
- 📦 **`archive/`** - Für alte/veraltete Versionen
- 🚀 **`onboarding/`** - Für Onboarding-Materialien

---

## 🔑 Wichtige Features & Konzepte

### **1. Intelligenter E-Mail-Filter (v4)**
- Supabase Whitelist/Blacklist (25 Blacklist, 45 Whitelist Regeln)
- User-Label "Paperless" → IMMER EXPORTIEREN
- KI-Bewertung für Grenzfälle (Google Gemini - optional)
- Logging aller Entscheidungen

### **2. Duplikaterkennung (3 Ebenen)**
- **Apps Script:** Ordner-basiert (verhindert Re-Export)
- **eml2pdf:** Prüft ob PDF existiert
- **Paperless:** Content-Hash (native Duplikaterkennung)

**Wichtig:** "Fehlgeschlagene Importe" sind oft erfolgreich erkannte Duplikate!

### **3. Message-ID & SHA-256 (v4.1)**
- RFC Message-ID (weltweit eindeutig)
- SHA-256 Hashes für Anhänge
- Metadata-JSON für Debugging & Referenz

### **4. Galaxy System (in Planung)**
- KI-Navigationsdatenbank für Projekt-Zuordnung
- Siehe: [docs/README_GALAXY_SYSTEM_KI_NAVIGATION.md](../docs/README_GALAXY_SYSTEM_KI_NAVIGATION.md)
- Wird noch wichtig!

---

## 🎨 User-Präferenzen (aus Rules)

- Deutsch/Englisch gemischt (wie es passt)
- "Du" verwenden (Philip)
- Immer `uv` statt `pip` für Python
- `edit_file` bevorzugen (nicht `search_replace` für große Änderungen)
- Nach Änderungen: Testen oder `git commit`
- **Nur eine Änderung auf einmal**
- **NIEMALS ohne Erlaubnis committen**
- **Root-Verzeichnis sauber halten** - richtige Ordner verwenden!
- **MCP statt SSH für Paperless!**

---

## ✅ Quick-Check Checklist

Bitte bestätige kurz:
- [ ] README.md gelesen
- [ ] Kompletter Workflow verstanden (v4.2 + eml2pdf)
- [ ] MCP-Zugriff klar (KEIN SSH für Paperless!)
- [ ] 2 Google Accounts verstanden
- [ ] Ordnerstruktur-Regeln verstanden
- [ ] eml2pdf Konzept klar

---

## 🎯 Aktuelle Arbeit / Status

### **✅ Was funktioniert:**
- Gmail → Apps Script v4.2 → Google Drive ✅
- rclone Sync (alle 5 Min) ✅
- eml2pdf Konvertierung ✅
- Paperless Import & OCR ✅
- MCP-Administration ✅
- HTTPS/TLS (archive.megabrain.cloud) ✅

### **📊 Aktueller Stand:**
- **Dokumente:** 1+ (System läuft produktiv!)
- **Tags:** 49+ (automatisch aus Ordnernamen)
- **Apps Script:** v4.2 (deployed zu beiden Accounts)
- **Server:** Hetzner CX32 (Docker Stack)

### **💡 Nächste Schritte (optional):**
- Document Types & Correspondents konfigurieren (via MCP)
- Galaxy System Integration (für Projekt-Zuordnung)
- AI-Klassifikation aktivieren (invoice-ai)
- Workflows einrichten

---

## 🔧 Häufige Befehle

### **Server-Wartung (SSH - nur für Server, nicht Paperless!):**
```bash
# Server-Logs prüfen
ssh paperless "docker compose -f /home/ubuntu/paperless-infra/infra/docker-compose.yml logs paperless-consumer --tail 50"

# Docker Status
ssh paperless "docker compose -f /home/ubuntu/paperless-infra/infra/docker-compose.yml ps"

# eml2pdf manuell ausführen
ssh paperless "docker compose -f /home/ubuntu/paperless-infra/infra/docker-compose.yml up eml2pdf"
```

### **Paperless-Administration (MCP - EMPFOHLEN!):**
```javascript
// In Cursor AI - direkt verwendbar!
const docs = await mcp_paperless_list_documents({ page_size: 10 });
const tags = await mcp_paperless_list_tags({ page_size: 50 });
```

### **Apps Script deployen:**
```bash
cd scripts/master-gmail-to-paperless
clasp logout && clasp login  # Account wählen
clasp push --force
```

### **Git Status:**
```bash
git status
git log --oneline -5
```

---

## ⚠️ Wichtige Hinweise & Warnungen

1. **NIEMALS committen ohne explizite Erlaubnis!**
2. **Zwei Google Accounts** - nicht vergessen!
3. **MCP statt SSH** für Paperless-Administration!
4. **eml2pdf ist KERN** von v4.2 - nicht vergessen!
5. **"Fehlgeschlagene Importe"** sind meist Duplikate (normal!)
6. **Ordnerstruktur** ist unterschiedlich (Google Drive strukturiert, Paperless flach) - **ABSICHTLICH SO!**
7. **Root-Verzeichnis sauber halten!** - Verwende richtige Ordner
8. **Galaxy System** wird noch wichtig - nicht löschen!

---

## 📚 Wichtigste Dokumentation (Reihenfolge!)

1. **[README_Complete_Workflow.md](../docs/README_Complete_Workflow.md)** - ⭐ START HIER!
2. **[README_MCP_Administration.md](../docs/README_MCP_Administration.md)** - ⭐ Für Administration
3. [README_Deduplication.md](../docs/README_Deduplication.md) - Message-ID & SHA-256
4. [README_Email_Filter.md](../docs/README_Email_Filter.md) - Intelligenter Filter
5. [GOOGLE_ACCOUNTS_SETUP.md](../GOOGLE_ACCOUNTS_SETUP.md) - 2 Accounts Details
6. [README_Deploy.md](../docs/README_Deploy.md) - Server Setup
7. [README_GALAXY_SYSTEM_KI_NAVIGATION.md](../docs/README_GALAXY_SYSTEM_KI_NAVIGATION.md) - Für später

---

## 🎉 Bereit für Arbeit!

Nach dem Lesen sag mir kurz:
1. **Was du verstanden hast** (kurze Zusammenfassung)
2. **Ob MCP-Zugriff klar ist** (kein SSH für Paperless!)
3. **Ob Fragen bestehen**
4. **Dann:** "Bereit! Was möchtest du heute am Projekt arbeiten?"

---

## 📝 Beispiel-Antwort von dir:

> "✅ Projekt verstanden:
> - Paperless-NGX auf Hetzner (Docker)
> - Apps Script v4.2 mit .eml Export
> - eml2pdf konvertiert zu PDF
> - 2 Google Accounts (philip@zepta.com + phkoenig@gmail.com)
> - MCP für Paperless (NICHT SSH!)
> - System läuft produktiv
> 
> ✅ MCP-Zugriff klar:
> - mcp_paperless_list_documents()
> - mcp_paperless_list_tags()
> - Kein SSH für Paperless!
> 
> ✅ Ordnerstruktur verstanden:
> - Google Drive: Strukturiert
> - eml2pdf: Wandelt zu flach
> - Paperless: Flach mit Tags
> 
> 🚀 Bereit! Was möchtest du heute am Projekt arbeiten?"

---

**Ende des Startup-Prompts** - Jetzt bist du bereit! 🚀
