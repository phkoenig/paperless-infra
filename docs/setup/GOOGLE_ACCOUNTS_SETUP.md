# 📧 Google Accounts Integration - Paperless-NGX

## 🎯 Überblick

Dieses Paperless-NGX Deployment integriert **ZWEI separate Google Accounts**, die beide automatisch E-Mails und Anhänge zu Paperless exportieren.

---

## 👥 Google Accounts

### **1. philip@zepta.com (ZEPTA Google Workspace)**
- **Typ:** Google Workspace Account (Hauptgeschäft)
- **Organisation:** ZEPTA Architekturbüro
- **Verwendung:** Geschäftliche E-Mails, Projekte, Rechnungen
- **Google Apps Script:**
  - Script ID: `1-7xxxihVVq6MCmvMMfJjYdLBRTTuE57JTpu5yg85tE4CVvPH_pJK1p4S`
  - Script Name: "ZeptaMail-to-paperless.js"
  - URL: https://script.google.com/d/1-7xxxihVVq6MCmvMMfJjYdLBRTTuE57JTpu5yg85tE4CVvPH_pJK1p4S/edit
- **Google Drive Ordner:**
  - `Paperless-Attachments/` (E-Mail-Anhänge)
  - `Paperless-Emails/` (E-Mail-Bodies als PDF)
- **rclone Remote:** `gdrive-zepta` (wird in `infra/rclone/rclone.conf` konfiguriert)
- **Sync auf Server:** `/opt/paperless/consume/gdrive-office/` (im Docker Stack: `gdrive-sync-office`)

---

### **2. phkoenig@gmail.com (Privater Gmail Account)**
- **Typ:** Standard Gmail Account
- **Organisation:** Persönlich + Vermögensverwaltung GmbH
- **Verwendung:** Private E-Mails, weitere Firmen (Vermögensverwaltung, etc.)
- **Google Apps Script:**
  - Script ID: `1OgncdBW_-rbgf_geYu8K9eFHjrl5NjZGcpQKBZaUZurgM5Xi36YS6Hgw`
  - Script Name: "Paperless-Email-Export"
  - URL: https://script.google.com/d/1OgncdBW_-rbgf_geYu8K9eFHjrl5NjZGcpQKBZaUZurgM5Xi36YS6Hgw/edit
- **Google Drive Ordner:**
  - `Paperless-Attachments/` (E-Mail-Anhänge)
  - `Paperless-Emails/` (E-Mail-Bodies als PDF)
- **rclone Remote:** `gdrive-philip` (wird in `infra/rclone/rclone.conf` konfiguriert)
- **Sync auf Server:** `/opt/paperless/consume/gdrive-philip/` (im Docker Stack: `gdrive-sync-philip`)

---

## 🔄 Workflow-Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE APPS SCRIPT LAYER                     │
├─────────────────────────────────────────────────────────────────┤
│  Gmail (philip@zepta.com)          Gmail (phkoenig@gmail.com)   │
│         ↓                                   ↓                    │
│  [Apps Script v3]                   [Apps Script v3]            │
│  (alle 5 Minuten)                   (alle 5 Minuten)            │
│         ↓                                   ↓                    │
│  Google Drive                       Google Drive                │
│  - Paperless-Attachments/          - Paperless-Attachments/    │
│  - Paperless-Emails/                - Paperless-Emails/         │
└─────────────────────────────────────────────────────────────────┘
                     ↓                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    HETZNER SERVER (CX32)                        │
├─────────────────────────────────────────────────────────────────┤
│  rclone-sync (Docker Services)                                  │
│  ┌─────────────────────────┐  ┌───────────────────────────┐   │
│  │ gdrive-sync-office      │  │ gdrive-sync-philip        │   │
│  │ (philip@zepta.com)      │  │ (phkoenig@gmail.com)      │   │
│  │ Remote: gdrive-zepta    │  │ Remote: gdrive-philip     │   │
│  │ Sync: alle 5 Minuten    │  │ Sync: alle 5 Minuten      │   │
│  └─────────────────────────┘  └───────────────────────────┘   │
│           ↓                              ↓                      │
│  /opt/paperless/consume/gdrive-office/                         │
│  /opt/paperless/consume/gdrive-philip/                         │
│           ↓                              ↓                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │          Paperless-NGX Consumer                          │ │
│  │  - OCR (Tesseract)                                       │ │
│  │  - AI Classification (invoice-ai sidecar)                │ │
│  │  - Metadata Extraction                                   │ │
│  │  - Tagging & Correspondents                              │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technische Details

### **Google Apps Script (Master v3)**
- **Quellcode:** `scripts/master-gmail-to-paperless/Code.js`
- **Deployment:** Identisches Script für beide Accounts
- **Automatische Account-Erkennung:** Via `Session.getActiveUser().getEmail()`
- **Trigger:** Zeitbasiert, alle 5 Minuten
- **Funktionen:**
  1. Exportiert ALLE E-Mail-Anhänge der letzten 7 Tage
  2. Exportiert E-Mails mit "Paperless" Label als PDF
  3. Erstellt JSON-Metadaten für jede E-Mail
  4. Verhindert Duplikate durch Ordner-Check

### **rclone Sync (Docker Services)**
- **Konfiguration:** `infra/rclone/rclone.conf`
- **OAuth2 Tokens:** Für beide Accounts im rclone.conf gespeichert
- **Sync-Interval:** Alle 5 Minuten (via `sleep 300` Loop in Docker)
- **Read-Write Mount:** Volume-Mount ist jetzt RW (nicht RO), damit rclone OAuth-Tokens updaten kann

### **Docker Stack Services**
- **gdrive-sync-office:** Synct philip@zepta.com → `/opt/paperless/consume/gdrive-office/`
- **gdrive-sync-philip:** Synct phkoenig@gmail.com → `/opt/paperless/consume/gdrive-philip/`
- **Beide Services:**
  - Image: `alpine:latest`
  - rclone Installation: `apk add --no-cache rclone`
  - Restart: `unless-stopped`

---

## 🛠️ Konfiguration & Setup

### **1. Google Apps Script Setup (bereits erledigt)**
✅ Apps Script API aktiviert für beide Accounts
✅ OAuth2 Scopes konfiguriert (Gmail, Drive, Logging)
✅ Trigger eingerichtet (alle 5 Minuten)
✅ Ordner erstellt: `Paperless-Attachments/`, `Paperless-Emails/`

### **2. rclone OAuth2 Setup (bereits erledigt)**
✅ OAuth2 Tokens für `gdrive-zepta` (philip@zepta.com)
✅ OAuth2 Tokens für `gdrive-philip` (phkoenig@gmail.com)
✅ Konfiguration in `infra/rclone/rclone.conf`
✅ Volume-Mount von RO auf RW geändert (für Token-Updates)

### **3. Docker Stack (bereits deployed)**
✅ `gdrive-sync-office` Service läuft
✅ `gdrive-sync-philip` Service läuft
✅ Beide Services syncen alle 5 Minuten

---

## 📊 Monitoring & Logs

### **Google Apps Script Logs:**
1. Öffne Google Apps Script Console
2. Klicke auf "Ausführungen"
3. Prüfe auf Fehler/Success

### **rclone Logs (auf Hetzner Server):**
```bash
# ZEPTA Account Logs
ssh ubuntu@<HETZNER_IP>
docker compose -f /opt/paperless/infra/docker-compose.yml logs gdrive-sync-office

# Privat Account Logs
docker compose -f /opt/paperless/infra/docker-compose.yml logs gdrive-sync-philip
```

### **Paperless Consumer Logs:**
```bash
docker compose -f /opt/paperless/infra/docker-compose.yml logs paperless-consumer
```

---

## 🔄 Deployment-Workflow (Master Script Änderungen)

Wenn du Änderungen am Google Apps Script machen willst:

```bash
cd B:\Nextcloud\CODE\proj\Paperless\scripts\master-gmail-to-paperless

# 1. Code.js bearbeiten
# ... Änderungen machen ...

# 2. Zu philip@zepta.com deployen
clasp logout
clasp login  # philip@zepta.com wählen
echo '{"scriptId":"1-7xxxihVVq6MCmvMMfJjYdLBRTTuE57JTpu5yg85tE4CVvPH_pJK1p4S","rootDir":"."}' > .clasp.json
clasp push --force

# 3. Zu phkoenig@gmail.com deployen
clasp logout
clasp login  # phkoenig@gmail.com wählen
echo '{"scriptId":"1OgncdBW_-rbgf_geYu8K9eFHjrl5NjZGcpQKBZaUZurgM5Xi36YS6Hgw","rootDir":"."}' > .clasp.json
clasp push --force
```

---

## 🆘 Troubleshooting

### **Problem: Keine neuen E-Mails werden exportiert**
1. Prüfe Google Apps Script Logs auf Fehler
2. Prüfe ob Trigger aktiv ist (sollte alle 5 Min laufen)
3. Teste manuell: Führe `testExport()` in Apps Script Console aus

### **Problem: rclone synct nicht**
1. Prüfe rclone Logs: `docker compose logs gdrive-sync-office`
2. Teste OAuth: `docker compose exec gdrive-sync-office rclone ls gdrive-zepta:Paperless-Attachments`
3. Falls Token abgelaufen: rclone wird automatisch refreshen (RW-Mount!)

### **Problem: Paperless importiert nicht**
1. Prüfe Consumer Logs: `docker compose logs paperless-consumer`
2. Prüfe ob Dateien im consume-Ordner liegen: `ls /opt/paperless/consume/gdrive-office/`
3. Prüfe `PAPERLESS_CONSUMER_IGNORE_PATTERN` in `.env` (sollte `.*\.json$` enthalten)

---

## 📈 Statistiken & Metriken

### **Erwartete Durchsatzraten:**
- **Apps Script:** ~20-100 E-Mails pro Lauf (alle 5 Min)
- **rclone Sync:** ~50-200 Dateien pro Sync (alle 5 Min)
- **Paperless Import:** ~10-50 Dokumente pro Stunde

### **Storage-Anforderungen:**
- **Google Drive:** ~5-20 GB pro Jahr (je nach E-Mail-Volumen)
- **Hetzner Server:** ~10-50 GB pro Jahr (Paperless Media)
- **Nextcloud Backup:** ~15-70 GB pro Jahr (inkl. Archiv)

---

## 🔐 Sicherheit & Berechtigungen

### **OAuth2 Scopes (Google Apps Script):**
- `https://www.googleapis.com/auth/gmail.readonly` - Gmail lesen
- `https://www.googleapis.com/auth/gmail.modify` - Labels verwalten
- `https://www.googleapis.com/auth/drive.file` - Drive-Dateien erstellen
- `https://www.googleapis.com/auth/script.scriptapp` - Script ausführen

### **rclone OAuth2:**
- Read/Write Zugriff auf spezifische Drive-Ordner
- Tokens gespeichert in `infra/rclone/rclone.conf` (nicht im Git!)
- Auto-Refresh aktiviert

---

## 👨‍💻 Maintainer

**Philip König**
- E-Mail: philip@zepta.com (Geschäft)
- E-Mail: phkoenig@gmail.com (Privat)

---

## 📅 Letzte Aktualisierung

**16.10.2025** - Beide Accounts erfolgreich integriert und Master Script v3 deployed.

