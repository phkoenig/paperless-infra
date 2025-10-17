# 📧 Kompletter E-Mail zu Paperless Workflow

**Version:** 4.2 mit .eml Export  
**Status:** ✅ Produktiv seit 17.10.2025

---

## 🎯 Übersicht

Dieser komplette Workflow beschreibt, wie E-Mails automatisch von Gmail zu Paperless-NGX gelangen, inklusive:
- ✅ Apps Script v4.2 (.eml Export)
- ✅ Intelligenter Filter (Supabase Whitelist/Blacklist)
- ✅ eml2pdf Konvertierung
- ✅ rclone Synchronisation
- ✅ Paperless Import & OCR

---

## 🚂 Der komplette Workflow (5 Stationen)

```
1. Gmail (2 Accounts)
   ├─ philip@zepta.com (ZEPTA Workspace)
   └─ phkoenig@gmail.com (Privat)
        ↓
   [Apps Script v4.2 - alle 5 Min]
        ↓
2. Google Drive (Strukturiert)
   └─ Paperless-Emails/
      └─ [timestamp]_[sender]_[subject]/
          ├─ email.eml              ← RAW E-Mail
          ├─ email-metadata.json    ← Metadata
          └─ attachment-*.xyz       ← Anhänge (optional)
        ↓
   [rclone copy - alle 5 Min]
        ↓
3. Hetzner Server
   /opt/paperless/consume/emails/
   └─ [timestamp]_[sender]_[subject]/
      ├─ email.eml
      ├─ email-metadata.json
      └─ attachments...
        ↓
   [eml2pdf - on-demand]
        ↓
4. PDF Konvertierung
   /opt/paperless/consume/
   └─ [timestamp]_[sender]_[subject].pdf  ← FLACH
        ↓
   [Paperless Consumer - kontinuierlich]
        ↓
5. Paperless-NGX
   ✅ OCR durchgeführt
   ✅ Volltext-durchsuchbar
   ✅ Tags aus Ordnernamen
   ✅ Archiviert & verfügbar
```

**Dauer:** ~5-15 Minuten von Gmail bis Paperless

---

## 📋 Detaillierte Beschreibung

### Station 1: Gmail & Apps Script v4.2

**Funktion:** `exportFilteredEmails()`  
**Trigger:** Alle 5 Minuten automatisch  
**Script-ID (philip@zepta.com):** `1-7xxxihVVq6MCmvMMfJjYdLBRTTuE57JTpu5yg85tE4CVvPH_pJK1p4S`  
**Script-ID (phkoenig@gmail.com):** `1OgncdBW_-rbgf_geYu8K9eFHjrl5NjZGcpQKBZaUZurgM5Xi36YS6Hgw`

#### Was passiert:
1. **Sucht** alle E-Mails der letzten 7 Tage
2. **Filtert** via Supabase Whitelist/Blacklist + KI-Score
3. **Erstellt** Ordner pro E-Mail: `[timestamp]_[sender]_[subject]/`
4. **Speichert**:
   - `email.eml` - Komplette RAW E-Mail (RFC 2822, alle Header!)
   - `email-metadata.json` - Filter-Entscheidung, SHA-256 Hashes, Links
   - `attachment-*.xyz` - Alle relevanten Anhänge
5. **Prüft** Duplikate via Ordnernamen (verhindert Re-Export)

#### Intelligenter Filter (v4):
```javascript
// 1. User-Label "Paperless" → IMMER EXPORTIEREN
// 2. Blacklist-Check → SOFORT ABLEHNEN
// 3. Whitelist-Check → SOFORT AKZEPTIEREN
// 4. Keine Anhänge → ABLEHNEN
// 5. KI-Bewertung → Bei Grenzfällen
```

**Beispiel Metadata-JSON:**
```json
{
  "exportTimestamp": "2025-10-17T21:46:50Z",
  "exportedBy": "Paperless-Email-Export-Script-v4.2-Master",
  "exportedFrom": "philip@zepta.com",
  "filterDecision": {
    "shouldExport": true,
    "reason": "Whitelist: subject=rechnung",
    "score": 10
  },
  "attachments": [
    {
      "name": "rechnung.pdf",
      "size": 524288,
      "type": "application/pdf",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "hash_algorithm": "SHA-256"
    }
  ],
  "gmailDirectLink": "https://mail.google.com/mail/u/0/#search/rfc822msgid%3A...",
  "note": "All email headers are preserved in the .eml file"
}
```

---

### Station 2: Google Drive (Zwischenlager)

**Ordner:** `Paperless-Emails/`  
**Struktur:** Pro E-Mail ein Unterordner

**Warum Zwischenlager?**
- ✅ **Backup!** Falls Server down ist
- ✅ **Fehlertoleranz:** Jeder Schritt unabhängig
- ✅ **Debugging:** Klare Struktur zum Nachvollziehen
- ✅ **Duplikaterkennung:** Apps Script prüft ob Ordner existiert

**Beispiel:**
```
Paperless-Emails/
├── 2025-10-17_10-30-45_John_Rechnung/
│   ├── email.eml
│   ├── email-metadata.json
│   └── rechnung-2025.pdf
└── 2025-10-17_11-15-20_Jane_Vertrag/
    ├── email.eml
    ├── email-metadata.json
    └── vertrag.pdf
```

---

### Station 3: rclone Synchronisation

**Service:** `gdrive-sync-philip` & `gdrive-sync-office`  
**Frequenz:** Alle 5 Minuten  
**Befehl:** `rclone copy 'gdrive-philip:Paperless-Emails' /data/emails/`

#### Verhalten:
- ✅ **Rekursiv:** Kopiert komplette Ordnerstruktur
- ✅ **Behält Struktur bei:** Unterordner bleiben erhalten
- ✅ **Inkrementell:** Nur neue/geänderte Dateien
- ✅ **Kein Löschen:** Backup bleibt auf Google Drive

**Ziel auf Server:**
```
/opt/paperless/consume/emails/
├── 2025-10-17_10-30-45_John_Rechnung/
│   ├── email.eml
│   ├── email-metadata.json
│   └── rechnung-2025.pdf
```

**Docker-Konfiguration:**
```yaml
gdrive-sync-philip:
  image: alpine:latest
  restart: unless-stopped
  volumes:
    - ./rclone:/config/rclone
    - /opt/paperless/consume:/data
  command:
    - -c
    - |
      apk add --no-cache rclone
      while true; do
        rclone copy 'gdrive-philip:Paperless-Emails' /data/emails/ --config /config/rclone/rclone.conf --log-level INFO
        sleep 300
      done
```

---

### Station 4: eml2pdf Konvertierung

**Service:** `eml2pdf`  
**Trigger:** On-Demand (läuft wenn nötig)  
**Input:** `/opt/paperless/consume/emails/` (mit Unterordnern)  
**Output:** `/opt/paperless/consume/` (FLACH)

#### Was passiert:
1. **Scannt rekursiv** nach `.eml` Dateien
2. **Extrahiert** E-Mail-Body (HTML > Text)
3. **Konvertiert** zu PDF via Gotenberg
4. **Speichert** FLACH im consume Ordner (ohne Unterordner!)
5. **Prüft** Duplikate (überspringt wenn PDF existiert)

**Beispiel:**
```python
# Input:
/opt/paperless/consume/emails/2025-10-17_John_Rechnung/email.eml

# Output:
/opt/paperless/consume/2025-10-17_John_Rechnung.pdf  ← FLACH!
```

**Warum flache Struktur?**
- Paperless nutzt Tags statt Ordner
- `PAPERLESS_CONSUMER_SUBDIRS_AS_TAGS=true` wandelt Ordnernamen in Tags um
- Einfacher für Paperless Consumer
- Performance-Optimierung

**Docker-Konfiguration:**
```yaml
eml2pdf:
  build:
    context: ./eml2pdf
  restart: "no"  # On-Demand
  depends_on:
    - gotenberg
  environment:
    EML_INPUT_DIR: /usr/src/paperless/consume/emails
    EML_OUTPUT_DIR: /usr/src/paperless/consume
    GOTENBERG_URL: http://gotenberg:3000
  volumes:
    - /opt/paperless/consume:/usr/src/paperless/consume
```

**Manuelle Ausführung:**
```bash
docker compose up eml2pdf
```

---

### Station 5: Paperless Consumer

**Service:** `paperless-consumer`  
**Trigger:** Kontinuierlich (überwacht `/usr/src/paperless/consume/`)  
**Frequenz:** Prüft alle paar Sekunden

#### Was passiert:
1. **Findet** neue PDF-Dateien
2. **Berechnet** Content-Hash (für Duplikaterkennung)
3. **Prüft** ob Hash bereits existiert
   - Falls ja: ⏭️ Überspringt (kein Fehler! Normal!)
   - Falls nein: ✅ Importiert
4. **Führt OCR durch** (Tesseract)
5. **Extrahiert** Text & Metadaten
6. **Erstellt** Thumbnail
7. **Indexiert** für Volltext-Suche
8. **Speichert** in PostgreSQL
9. **Verschiebt** Original nach `/opt/paperless/media/`

**Duplikaterkennung:**
- Paperless berechnet Content-Hash
- Vergleicht mit existierenden Dokumenten
- Überspringt Duplikate OHNE Fehlermeldung
- **Wichtig:** "Fehlgeschlagene Importe" sind oft erfolgreiche Duplikaterkennungen!

**Paperless-Konfiguration:**
```env
PAPERLESS_CONSUMER_RECURSIVE=true            # Unterordner scannen
PAPERLESS_CONSUMER_SUBDIRS_AS_TAGS=true      # Ordnernamen → Tags
PAPERLESS_CONSUMER_IGNORE_PATTERN=^~$.*|.*\.tmp$|.*\.part$|.*\.json$  # JSON ignorieren
```

---

## 🔍 Duplikaterkennung auf 3 Ebenen

### 1. Apps Script (Google Drive)
```javascript
// Prüft ob E-Mail-Ordner bereits existiert
if (folderExists(emailsRootFolder, emailFolderId)) {
  console.log(`⏭️ Ordner bereits vorhanden: ${emailFolderId}`);
  return;  // Wird NICHT nochmal exportiert
}
```

**Vorteil:** Verhindert Re-Export bei Script-Fehler

### 2. eml2pdf (Server)
```python
# Prüft ob PDF bereits existiert
if os.path.exists(dest):
    print(f"⏭️  PDF already exists: {base}.pdf")
    continue
```

**Vorteil:** Spart Konvertierungszeit

### 3. Paperless (Content-Hash)
```python
# Paperless berechnet SHA-256 Hash des Inhalts
content_hash = calculate_hash(pdf_content)

# Vergleicht mit existierenden Dokumenten
if Document.objects.filter(content_hash=content_hash).exists():
    # Überspringt OHNE Fehlermeldung
    return
```

**Vorteil:** Erkennt auch leicht modifizierte Duplikate

---

## 🎓 Erklärt für Dummies (ELI5)

Stell dir vor, deine E-Mails sind wie **Pakete** die durch verschiedene Stationen reisen:

1. **📮 Postamt (Gmail):** Hier kommen alle Pakete an
2. **🤖 Sortierer (Apps Script):** Ein Roboter sortiert alle 5 Minuten und entscheidet: "Wichtig? → Weiter!"
3. **📦 Zwischenlager (Google Drive):** Pakete werden ordentlich gelagert (Backup!)
4. **🚚 Lieferwagen (rclone):** Holt alle 5 Minuten neue Pakete ab
5. **🏭 Fabrik (eml2pdf):** Wandelt Pakete in Standard-Format um
6. **📚 Bibliothek (Paperless):** Katalogisiert alles durchsuchbar

**Wie lange dauert's?** 5-15 Minuten von "E-Mail empfangen" bis "Dokument durchsuchbar"

---

## 🧪 Testen & Debugging

### Test 1: Apps Script
```javascript
// In Google Apps Script ausführen
function testExport() {
  console.log('🧪 Test-Modus aktiviert');
  exportToPaperless();
}
```

**Prüfen:**
1. Google Apps Script Console → Ausführungen
2. Grüne Haken? ✅ Läuft!
3. Google Drive → Paperless-Emails → Neue Ordner?

### Test 2: rclone Sync
```bash
ssh paperless
docker compose logs gdrive-sync-philip --tail 20

# Sollte zeigen: "copied X files"
```

### Test 3: eml2pdf
```bash
ssh paperless
docker compose up eml2pdf

# Sollte zeigen: "✅ Success: email.eml → email.pdf"
```

### Test 4: Paperless via MCP
```javascript
// In Cursor AI
const docs = await mcp_paperless_list_documents({
  page_size: 10,
  ordering: "-added"
});

console.log(`Letzte ${docs.results.length} Dokumente importiert`);
```

---

## 🛠️ Administration mit MCP (WICHTIG!)

### ⚠️ NUTZE MCP, NICHT SSH!

**Warum MCP?**
- ✅ 10x schneller als SSH
- ✅ Type-Safe & Fehler-sicher
- ✅ Automatisch in Cursor AI
- ✅ Keine Django Shell Probleme

**SSH nur für:**
- Server-Wartung (Docker Logs, etc.)
- NICHT für Paperless-Administration!

**Beispiele:**
```javascript
// Dokumente suchen (MCP)
const docs = await mcp_paperless_list_documents({
  search: "rechnung",
  page_size: 20
});

// Tags auflisten (MCP)
const tags = await mcp_paperless_list_tags({
  page_size: 100
});

// Dokument aktualisieren (MCP)
await mcp_paperless_update_document({
  id: 126,
  title: "Neue Titel",
  tags: [1, 5, 10]
});
```

**Mehr Infos:** [README_MCP_Administration.md](README_MCP_Administration.md)

---

## 📊 Monitoring

### Erfolgsmetriken prüfen:
```bash
# rclone Sync Status
docker compose logs gdrive-sync-philip --tail 20

# eml2pdf Status (wenn gelaufen)
docker compose logs eml2pdf --tail 20

# Paperless Consumer
docker compose logs paperless-consumer --tail 50
```

### Via MCP (empfohlen):
```javascript
// Letzte Importe
const recent = await mcp_paperless_list_documents({
  page_size: 10,
  ordering: "-added"
});

console.log(`Letzter Import: ${recent.results[0].added}`);
console.log(`Total Dokumente: ${recent.count}`);
```

---

## 🆘 Troubleshooting

### Problem: Keine neuen Dokumente in Paperless

**Checkliste:**
1. ✅ Apps Script läuft? (Google Apps Script → Ausführungen)
2. ✅ Dateien in Google Drive? (Paperless-Emails Ordner)
3. ✅ rclone synct? (`docker compose logs gdrive-sync-philip`)
4. ✅ eml2pdf konvertiert? (`docker compose up eml2pdf`)
5. ✅ Paperless Consumer läuft? (`docker compose ps`)

### Problem: "Fehlgeschlagene Importe"

**Das ist meist KEIN Fehler!**
- Paperless erkennt Duplikate über Content-Hash
- Überspringt sie OHNE Fehlermeldung
- Normal und korrekt!

**Prüfen via MCP:**
```javascript
const docs = await mcp_paperless_list_documents({
  search: "2025-10-17",  // Datum der E-Mail
  page_size: 10
});

// Falls gefunden: War kein Fehler, sondern Duplikat!
```

### Problem: Ordnerstruktur auf Server falsch

**Das ist ABSICHTLICH so!**
- Google Drive: Strukturiert (pro E-Mail)
- Server: Strukturiert (rclone behält bei)
- Paperless consume: FLACH (eml2pdf wandelt um)

Siehe: `temp/ordnerstruktur_analyse.md`

---

## 📚 Weitere Dokumentation

- **Duplikaterkennung:** [README_Deduplication.md](README_Deduplication.md)
- **MCP Administration:** [README_MCP_Administration.md](README_MCP_Administration.md)
- **Email Filter:** [README_Email_Filter.md](README_Email_Filter.md)
- **Deployment:** [README_Deploy.md](README_Deploy.md)

---

**Version:** 4.2 mit .eml Export  
**Letzte Aktualisierung:** 17.10.2025  
**Status:** ✅ Produktiv & getestet

