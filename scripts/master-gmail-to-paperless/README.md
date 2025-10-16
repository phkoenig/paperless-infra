# 📧 Paperless Email Export - Master Script v3

## 🎯 Überblick

Dies ist das **MASTER-SCRIPT** für beide Google Accounts:
- **philip@zepta.com** (ZEPTA Google Workspace)
- **phkoenig@gmail.com** (Privater Account)

Das gleiche Script läuft in beiden Accounts und exportiert E-Mails automatisch zu Paperless-NGX.

---

## 📋 Deployed zu:

### 1. philip@zepta.com (ZEPTA)
- **Script ID:** `1-7xxxihVVq6MCmvMMfJjYdLBRTTuE57JTpu5yg85tE4CVvPH_pJK1p4S`
- **Script Name:** ZeptaMail-to-paperless.js
- **URL:** https://script.google.com/d/1-7xxxihVVq6MCmvMMfJjYdLBRTTuE57JTpu5yg85tE4CVvPH_pJK1p4S/edit
- **Google Drive Ordner:**
  - `Paperless-Attachments/` → Synct via `gdrive-zepta`
  - `Paperless-Emails/` → Synct via `gdrive-zepta`

### 2. phkoenig@gmail.com (Privat)
- **Script ID:** `1OgncdBW_-rbgf_geYu8K9eFHjrl5NjZGcpQKBZaUZurgM5Xi36YS6Hgw`
- **Script Name:** Paperless-Email-Export
- **URL:** https://script.google.com/d/1OgncdBW_-rbgf_geYu8K9eFHjrl5NjZGcpQKBZaUZurgM5Xi36YS6Hgw/edit
- **Google Drive Ordner:**
  - `Paperless-Attachments/` → Synct via `gdrive-philip`
  - `Paperless-Emails/` → Synct via `gdrive-philip`

---

## 🚀 Funktionen

Das Script führt **automatisch alle 5 Minuten** folgende Aufgaben aus:

### **Stufe 1: Alle E-Mail-Anhänge exportieren**
- Durchsucht **alle E-Mails der letzten 7 Tage**
- Filtert **relevante Dateitypen** (PDF, Office-Dokumente, etc.)
- Erstellt für jede E-Mail einen eigenen Ordner in `Paperless-Attachments/`
- Speichert alle Anhänge + Metadaten-JSON

### **Stufe 2: E-Mails mit "Paperless" Label als PDF**
- Exportiert E-Mail-Bodies als PDF
- Speichert in `Paperless-Emails/`
- Entfernt Label nach Export

---

## 🔧 Änderungen deployen

### **Zu BEIDEN Accounts deployen:**

```bash
# 1. Zu ZEPTA Account wechseln
cd B:\Nextcloud\CODE\proj\Paperless\scripts\master-gmail-to-paperless
clasp logout
clasp login  # philip@zepta.com auswählen

# 2. Script bearbeiten (Code.js)
# ... Änderungen machen ...

# 3. Zu ZEPTA deployen
# .clasp.json mit ZEPTA Script-ID erstellen:
echo '{"scriptId":"1-7xxxihVVq6MCmvMMfJjYdLBRTTuE57JTpu5yg85tE4CVvPH_pJK1p4S","rootDir":"."}' > .clasp.json
clasp push --force

# 4. Zu Privat Account wechseln
clasp logout
clasp login  # phkoenig@gmail.com auswählen

# 5. Zu Privat deployen
# .clasp.json mit Privat Script-ID erstellen:
echo '{"scriptId":"1OgncdBW_-rbgf_geYu8K9eFHjrl5NjZGcpQKBZaUZurgM5Xi36YS6Hgw","rootDir":"."}' > .clasp.json
clasp push --force
```

### **Automatisches Deployment-Script (PowerShell):**

```powershell
# deploy-to-both.ps1
cd B:\Nextcloud\CODE\proj\Paperless\scripts\master-gmail-to-paperless

# Deploy zu ZEPTA
clasp logout
clasp login  # philip@zepta.com
'{"scriptId":"1-7xxxihVVq6MCmvMMfJjYdLBRTTTuE57JTpu5yg85tE4CVvPH_pJK1p4S","rootDir":"."}' | Out-File -Encoding utf8 .clasp.json
clasp push --force

# Deploy zu Privat
clasp logout
clasp login  # phkoenig@gmail.com
'{"scriptId":"1OgncdBW_-rbgf_geYu8K9eFHjrl5NjZGcpQKBZaUZurgM5Xi36YS6Hgw","rootDir":"."}' | Out-File -Encoding utf8 .clasp.json
clasp push --force

Write-Host "✅ Master-Script zu beiden Accounts deployed!"
```

---

## 📊 Workflow-Integration

### **rclone Sync (auf Hetzner Server):**

**ZEPTA Account:**
```yaml
gdrive-sync-zepta:
  # Synct von gdrive-zepta:Paperless-Attachments/
  # Nach: /opt/paperless/consume/gdrive-zepta/attachments
```

**Privat Account:**
```yaml
gdrive-sync-philip:
  # Synct von gdrive-philip:Paperless-Attachments/
  # Nach: /opt/paperless/consume/gdrive-philip/attachments
```

---

## 🧪 Testen

### **Manueller Test:**
1. Öffne Google Apps Script Console
2. Führe Funktion `testExport()` aus
3. Prüfe Logs auf Fehler
4. Prüfe Google Drive Ordner auf neue Dateien

### **Debug-Funktion:**
```javascript
// Zeigt E-Mails mit Anhängen der letzten 30 Tage
debugEmailsWithAttachments()
```

---

## 📝 Änderungshistorie

### **v3.0 (16.10.2025) - Master Script**
- ✅ Universelles Script für beide Accounts
- ✅ Deployed zu philip@zepta.com
- ✅ Deployed zu phkoenig@gmail.com
- ✅ Automatische Account-Erkennung via `Session.getActiveUser().getEmail()`
- ✅ Metadata zeigt `exportedFrom` für besseres Tracking

### **v2.0 (15.10.2025)**
- E-Mail-Bodies als PDF export
- Metadata-JSON für jede E-Mail
- Duplikat-Erkennung

### **v1.0 (14.10.2025)**
- Initiale Version
- Nur Anhänge-Export

---

## 🔍 Monitoring

### **Logs prüfen:**
1. Öffne Google Apps Script Console
2. Klicke auf "Ausführungen"
3. Prüfe auf Fehler

### **Erfolgs-Metriken:**
- Anzahl exportierter E-Mails
- Anzahl exportierter Anhänge
- Fehlerrate

---

## 🆘 Troubleshooting

### **Problem: Script läuft nicht automatisch**
- Prüfe Trigger in Apps Script Console
- Sollte alle 5 Minuten laufen

### **Problem: Keine Dateien in Google Drive**
- Prüfe Ordner-Berechtigungen
- Führe `setupPaperlessExport()` aus

### **Problem: rclone synct nicht**
- Prüfe rclone.conf auf korrekte OAuth-Tokens
- Teste manuell: `rclone ls gdrive-zepta:Paperless-Attachments`

---

## 👨‍💻 Entwickler

Philip König (phkoenig@gmail.com)

## 📅 Letztes Update

16.10.2025 - Master Script v3.0 deployed

