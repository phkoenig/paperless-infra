# 🔁 Duplikaterkennung v4.2 - Präventiv + Reaktiv

**Version:** 4.2 (mit präventivem Duplikat-Check)  
**Status:** ✅ Aktiv  
**Datum:** 17.10.2025

---

## 🎯 Problem gelöst

**Vorher (v4.1):**
- Duplikate wurden erkannt, aber trotzdem hochgeladen
- Paperless lehnte sie ab → `failed imports` sammeln sich an
- Speicherplatz verschwendet, Rechenzeit verschwendet

**Jetzt (v4.2):**
- ✅ Duplikate werden **VOR** dem Upload erkannt
- ✅ Keine unnötigen Uploads mehr
- ✅ Keine "failed imports" mehr
- ✅ Automatisches Cleanup als Sicherheitsnetz

---

## 🏗️ 4-Ebenen-Deduplication

```
┌─────────────────────────────────────────────────────────┐
│ EBENE 1: Apps Script - Lokaler Ordner-Check            │
│ ✅ Verhindert Re-Export im gleichen Script-Lauf        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ EBENE 2: Apps Script - Supabase Index-Check  🆕        │
│ ✅ Prüft RFC Message-ID gegen paperless_documents_index│
│ ✅ Verhindert Upload von bekannten Duplikaten          │
│ ✅ PRÄVENTIV - Spart Speicher & Rechenzeit             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ EBENE 3: Paperless - Content-Hash Deduplication        │
│ ✅ Native Paperless Duplikaterkennung                  │
│ ✅ Falls Ebene 2 fehlschlägt (Fallback)                │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ EBENE 4: Sync & Cleanup Script  🆕                      │
│ ✅ Räumt "failed" Duplikate automatisch auf            │
│ ✅ Synchronisiert Index mit Paperless                  │
│ ✅ Läuft täglich via Cron                              │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Supabase Index-Tabelle (NEU!)

### **`paperless_documents_index`**

Zentrale Datenbank für alle exportierten Dokumente:

```sql
CREATE TABLE paperless_documents_index (
  id BIGSERIAL PRIMARY KEY,
  rfc_message_id TEXT UNIQUE NOT NULL,     -- RFC 2822 Message-ID (weltweit eindeutig)
  gmail_message_id TEXT,                   -- Gmail-interne ID (Backup)
  gmail_thread_id TEXT,                    -- Thread-ID für Konversationen
  sha256_hashes JSONB,                     -- Array von SHA-256 Hashes (Anhänge)
  paperless_id INTEGER,                    -- Paperless Document ID (NULL bis importiert)
  email_from TEXT,                         -- Absender
  email_subject TEXT,                      -- Betreff
  has_attachments BOOLEAN DEFAULT FALSE,   -- Hat Anhänge?
  attachment_count INTEGER DEFAULT 0,      -- Anzahl Anhänge
  imported_at TIMESTAMP DEFAULT NOW(),     -- Wann registriert
  source_account TEXT,                     -- philip@zepta.com oder phkoenig@gmail.com
  google_drive_folder_id TEXT,             -- Google Drive Ordner-ID
  notes TEXT,                              -- Zusätzliche Notizen
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Zweck:**
- 🚫 **Präventiv:** Verhindert Re-Upload von bekannten E-Mails
- 🔗 **Tracking:** Verknüpft Gmail → Google Drive → Paperless
- 📊 **Monitoring:** Übersicht aller exportierten Dokumente

---

## 🔄 Workflow (End-to-End)

### **Schritt 1: E-Mail-Export (Apps Script)**

```javascript
// 1. Filter-Check (wie bisher)
const filterDecision = shouldExportEmail(message, filterLists);
if (!filterDecision.shouldExport) {
  return; // ← Gefiltert
}

// 2. 🆕 DUPLIKAT-CHECK gegen Supabase
const duplicateCheck = isDuplicateInPaperless(message);
if (duplicateCheck.isDuplicate) {
  console.log("🔁 DUPLIKAT übersprungen");
  return; // ← Verhindert Upload!
}

// 3. Upload zu Google Drive
// ... E-Mail + Anhänge hochladen ...

// 4. 🆕 IN INDEX REGISTRIEREN
registerInPaperlessIndex(message, attachments, folderId);
// → Paperless-ID bleibt NULL (wird später aktualisiert)
```

### **Schritt 2: Server-Sync (rclone)**

```bash
# rclone kopiert neue Dateien von Google Drive → Server
rclone copy 'gdrive-philip:Paperless-Emails' /data/emails/
```

### **Schritt 3: PDF-Konvertierung (eml2pdf)**

```python
# eml2pdf konvertiert .eml → PDF via Gotenberg
# PDF wird nach /usr/src/paperless/consume/ verschoben
```

### **Schritt 4: Paperless Import**

```
# Paperless-NGX importiert PDF
# - Bei Duplikat: Import wird abgelehnt → "failed"
# - Bei Erfolg: Dokument bekommt ID (z.B. 123)
```

### **Schritt 5: Index-Synchronisation (Sync Script - täglich)**

```python
# 🆕 Sync & Cleanup Script läuft täglich (3:00 Uhr)

# 1. Synchronisiere Index mit Paperless
#    - Finde Dokumente mit paperless_id = NULL
#    - Suche in Paperless nach Betreff/Content
#    - Update paperless_id in Index

# 2. Räume "failed" Duplikate auf
#    - Prüfe failed/ Ordner
#    - Vergleiche SHA-256 mit existierenden Dokumenten
#    - Lösche bekannte Duplikate
```

---

## 🆕 Neue Funktionen (v4.2)

### **1. Präventiver Duplikat-Check (Apps Script)**

```javascript
function isDuplicateInPaperless(message) {
  const rfcMessageId = extractRFCMessageID(message);
  
  // Query Supabase
  const url = `${SUPABASE_URL}/rest/v1/paperless_documents_index?rfc_message_id=eq.${rfcMessageId}`;
  const response = UrlFetchApp.fetch(url, options);
  const results = JSON.parse(response.getContentText());
  
  if (results.length > 0) {
    return { isDuplicate: true, reason: 'message_id_exists' };
  }
  
  return { isDuplicate: false };
}
```

**Effekt:**
- ✅ Spart Speicherplatz (keine unnötigen Uploads)
- ✅ Spart Rechenzeit (kein PDF-Rendering)
- ✅ Verhindert "failed imports"

### **2. Index-Registrierung (Apps Script)**

```javascript
function registerInPaperlessIndex(message, attachments, folderId) {
  const indexEntry = {
    rfc_message_id: extractRFCMessageID(message),
    gmail_message_id: message.getId(),
    gmail_thread_id: message.getThread().getId(),
    sha256_hashes: attachments.map(att => att.sha256),
    paperless_id: null, // ← Wird später aktualisiert
    email_from: message.getFrom(),
    email_subject: message.getSubject(),
    has_attachments: attachments.length > 0,
    attachment_count: attachments.length,
    source_account: Session.getActiveUser().getEmail(),
    google_drive_folder_id: folderId
  };
  
  // POST zu Supabase
  UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/paperless_documents_index`, {
    method: 'post',
    payload: JSON.stringify(indexEntry)
  });
}
```

### **3. Sync & Cleanup Script (Python)**

**Location:** `scripts/paperless-sync/sync_index_and_cleanup.py`

**Aufgaben:**
1. **Index-Sync:** Aktualisiert `paperless_id` für erfolgreich importierte Dokumente
2. **Cleanup:** Löscht "failed" Duplikate aus `consume/failed/`

**Läuft:** Täglich um 3:00 Uhr (Cron-Job)

```python
# 1. Sync
pending_entries = get_index_entries_without_paperless_id()
all_docs = get_all_paperless_documents()

for entry in pending_entries:
    # Finde Match in Paperless (via Betreff/Content)
    matched_doc = find_matching_document(entry, all_docs)
    if matched_doc:
        update_index_paperless_id(entry['rfc_message_id'], matched_doc['id'])

# 2. Cleanup
failed_files = list(Path("/usr/src/paperless/consume/failed").glob("*"))
for file in failed_files:
    file_hash = calculate_sha256(file)
    if file_hash in existing_paperless_hashes:
        file.unlink()  # ← Lösche Duplikat
```

---

## 📊 Monitoring

### **1. Supabase Dashboard**

```sql
-- Wie viele Dokumente ohne Paperless-ID?
SELECT COUNT(*) 
FROM paperless_documents_index 
WHERE paperless_id IS NULL;

-- Letzte Importe
SELECT email_subject, paperless_id, imported_at
FROM paperless_documents_index
WHERE paperless_id IS NOT NULL
ORDER BY imported_at DESC
LIMIT 10;

-- Duplikaterkennung-Rate
SELECT 
  COUNT(*) FILTER (WHERE paperless_id IS NOT NULL) as imported,
  COUNT(*) FILTER (WHERE paperless_id IS NULL) as pending
FROM paperless_documents_index;
```

### **2. Sync-Script Logs**

```bash
# Log-Datei
tail -f /var/log/paperless-sync.log

# Letzter Lauf
grep "Script erfolgreich" /var/log/paperless-sync.log | tail -1
```

### **3. Failed-Ordner Größe**

```bash
# Anzahl Dateien in failed/
ls -1 /usr/src/paperless/consume/failed/ | wc -l

# Größe des failed/ Ordners
du -sh /usr/src/paperless/consume/failed/
```

---

## 🎯 Vorteile der neuen Lösung

| Feature | v4.1 (Alt) | v4.2 (Neu) |
|---------|-----------|-----------|
| **Duplikaterkennung** | ✅ Nach Upload | ✅ VOR Upload (präventiv) |
| **Failed Imports** | ❌ Sammeln sich an | ✅ Automatisch aufgeräumt |
| **Speicherplatz** | ❌ Verschwendet | ✅ Optimal genutzt |
| **Rechenzeit** | ❌ Verschwendet | ✅ Gespart |
| **Tracking** | ❌ Nur in Metadata | ✅ Zentrale Datenbank |
| **Sync-Status** | ❌ Unbekannt | ✅ Transparent |

---

## 🚀 Deployment

### **Schritt 1: Supabase-Tabelle**
✅ Bereits erstellt (automatisch via MCP)

### **Schritt 2: Apps Script Deploy**
```bash
cd scripts/master-gmail-to-paperless
clasp push
clasp deploy --description "v4.2 mit präventivem Duplikat-Check"
```

### **Schritt 3: Sync-Script Setup**
```bash
# Auf Hetzner Server
cd /root/paperless/scripts/paperless-sync
pip install -r requirements.txt

# Test-Lauf
python3 sync_index_and_cleanup.py

# Cron-Job einrichten
crontab -e
# Hinzufügen: 0 3 * * * cd /root/paperless/scripts/paperless-sync && python3 sync_index_and_cleanup.py >> /var/log/paperless-sync.log 2>&1
```

---

## 📅 Changelog

### **v4.2 (17.10.2025) - Präventive Deduplication**
- 🆕 Supabase `paperless_documents_index` Tabelle
- 🆕 Apps Script: Duplikat-Check VOR Upload
- 🆕 Apps Script: Index-Registrierung NACH Upload
- 🆕 Sync & Cleanup Script (Python)
- 🆕 Cron-Job für tägliche Synchronisation
- ✅ Keine "failed imports" mehr
- ✅ Optimale Speicher- & Rechenzeit-Nutzung

### **v4.1 (16.10.2025)**
- RFC Message-ID Extraktion
- SHA-256 Hashes für Anhänge
- Erweiterte Metadata-Struktur

### **v4.0 (15.10.2025)**
- Intelligenter Filter mit Supabase
- KI-gestützte Bewertung (optional)

---

**Erstellt:** 17.10.2025  
**Status:** ✅ Aktiv und funktionsfähig  
**Nächster Schritt:** Monitoring nach 1 Woche

