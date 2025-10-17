# 🚀 Deployment Guide - Script v4.2 (.eml Export)

## Was ist neu?

**v4.2 speichert E-Mails als .eml Dateien** statt als PDFs!
- ✅ Alle E-Mail-Header bleiben erhalten (Message-ID, Thread-ID, etc.)
- ✅ Server konvertiert .eml → PDF via eml2pdf + Gotenberg
- ✅ Vereinfachte Metadaten (nur Paperless-spezifische Daten)
- ✅ Performance-Optimierung (Filter nur einmal laden)

---

## Deployment Schritte

### 1. Script zu **philip@zepta.com** deployen:

```bash
cd scripts/master-gmail-to-paperless

# Logout (falls noch eingeloggt)
clasp logout

# Login als philip@zepta.com
clasp login
# → Wähle philip@zepta.com im Browser

# Script ID setzen
echo '{"scriptId":"1-7xxxihVVq6MCmvMMfJjYdLBRTTuE57JTpu5yg85tE4CVvPH_pJK1p4S","rootDir":"."}' > .clasp.json

# Deployen
clasp push --force
```

---

### 2. Script zu **phkoenig@gmail.com** deployen:

```bash
# Logout
clasp logout

# Login als phkoenig@gmail.com
clasp login
# → Wähle phkoenig@gmail.com im Browser

# Script ID setzen
echo '{"scriptId":"1OgncdBW_-rbgf_geYu8K9eFHjrl5NjZGcpQKBZaUZurgM5Xi36YS6Hgw","rootDir":"."}' > .clasp.json

# Deployen
clasp push --force
```

---

## Testing

### In Google Apps Script Console:

1. **Setup testen:**
   ```javascript
   setupPaperlessExport()
   ```
   Erwartete Ausgabe:
   ```
   🔧 Setup Paperless Export v4.2 Master...
   ✅ Supabase verbunden: 25 Blacklist, 45 Whitelist
   ✅ Setup v4.2 Master abgeschlossen (.eml Export aktiviert)
   ```

2. **Debug .eml Export:**
   ```javascript
   debugEMLExport()
   ```
   Sollte eine .eml Datei in Google Drive erstellen.

3. **Vollständiger Test:**
   ```javascript
   testExport()
   ```

---

## Was passiert jetzt?

### Workflow:
```
Gmail
  ↓ getRawContent() - Vollständiges .eml Format
Google Drive (.eml Dateien)
  ↓ rclone sync
Server: /opt/paperless/consume/emails/*.eml
  ↓ eml2pdf Service (bereits vorhanden!)
Server: /opt/paperless/consume/*.pdf
  ↓ Paperless Consumer
Paperless-NGX (durchsuchbar, OCR)
```

---

## Neue Ordnerstruktur

```
Google Drive/Paperless-Emails/
└── 2025-10-17_15-30-00_sender_subject/
    ├── 2025-10-17_15-30-00_subject.eml    # RAW E-Mail
    ├── email-metadata.json                 # Metadaten
    └── invoice.pdf                         # Anhang (falls vorhanden)
```

---

## Berechtigungen

**Script benötigt folgende OAuth Scopes:**
- `https://www.googleapis.com/auth/gmail.readonly` - E-Mails lesen
- `https://www.googleapis.com/auth/gmail.modify` - Labels verwalten
- `https://www.googleapis.com/auth/drive.file` - .eml Dateien erstellen

Falls neue Berechtigungen abgefragt werden → Akzeptieren!

---

## Trigger (bereits konfiguriert)

Der Trigger sollte bereits laufen:
- **Funktion:** `exportToPaperless`
- **Frequenz:** Alle 5 Minuten
- **Type:** Time-based trigger

Falls nicht → Manuell erstellen in Google Apps Script Console.

---

## Monitoring

### Google Apps Script Logs:
https://script.google.com → Ausführungen

### Erwartete Log-Ausgabe:
```
🚀 Paperless Export v4.2 gestartet für philip@zepta.com...
📋 Filter geladen: 25 Blacklist, 45 Whitelist
📧 Exportiere alle E-Mails der letzten 7 Tage...
🔍 45 E-Mail-Threads gefunden
✅ Export: Invoice from Company (Whitelist: rechnung)
📧 EML gespeichert: 2025-10-17_15-30-00_subject.eml
📎 Anhang gespeichert: invoice.pdf
✅ E-Mail exportiert: 2025-10-17_15-30-00_Company_Invoice/ (.eml + 1 Anhänge)
✅ 12 E-Mails exportiert, 33 gefiltert
✅ Paperless Export abgeschlossen in 8.5s
```

---

## Troubleshooting

### Problem: "getRawContent is not a function"
- Script nicht vollständig deployed
- Lösung: `clasp push --force` wiederholen

### Problem: ".eml Dateien werden nicht erstellt"
- Google Drive Berechtigungen fehlen
- Lösung: OAuth-Scopes neu autorisieren

### Problem: "Keine E-Mails gefunden"
- Search Query zu restriktiv
- Lösung: In Code.js schaue ob `newer_than:7d` korrekt ist

---

## Erfolg prüfen

1. **Google Drive:** Prüfe `Paperless-Emails/` Ordner → Sollte neue Unterordner mit .eml Dateien haben
2. **rclone:** Warte 5 Min → Prüfe ob .eml Dateien auf Server syncen
3. **eml2pdf:** Prüfe Server-Logs → Sollte .eml → PDF konvertieren
4. **Paperless:** Warte weitere 5 Min → Prüfe ob neue Dokumente erscheinen

---

**Deployment am:** $(date)
**Version:** v4.2
**Status:** Ready to Deploy ✅

