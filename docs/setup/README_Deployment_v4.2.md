# 🚀 Deployment Guide v4.2 - Komplettlösung

**Präventive Duplikaterkennung + Automatisches Cleanup**

---

## 📋 Deployment Checklist

### ✅ Phase 1: Supabase Setup
- [x] Tabelle `paperless_documents_index` erstellt
- [ ] Tabelle in Supabase Dashboard verifizieren
- [ ] Indizes prüfen (sollten automatisch erstellt sein)

### ✅ Phase 2: Apps Script Update (v4.2)
- [ ] Code.js mit neuen Funktionen deployen
- [ ] Zu **beiden** Accounts deployen
- [ ] Test-Lauf durchführen
- [ ] Logs prüfen

### ✅ Phase 3: Sync & Cleanup Script
- [ ] Script auf Server kopieren
- [ ] Dependencies installieren
- [ ] Test-Lauf durchführen
- [ ] Cron-Job einrichten

### ✅ Phase 4: Testing & Monitoring
- [ ] End-to-End Test durchführen
- [ ] 24h Monitoring
- [ ] Logs prüfen
- [ ] Supabase-Index prüfen

---

## 🎯 Phase 1: Supabase Setup

### **Schritt 1.1: Tabelle prüfen**

```sql
-- In Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'paperless_documents_index';

-- Sollte 1 Zeile zurückgeben
```

### **Schritt 1.2: Indizes prüfen**

```sql
-- Prüfe alle Indizes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'paperless_documents_index';

-- Erwartete Indizes:
-- - idx_rfc_message_id
-- - idx_gmail_message_id
-- - idx_paperless_id
-- - idx_source_account
-- - idx_imported_at
-- - idx_sha256_hashes (GIN)
```

### **Schritt 1.3: Test-Insert**

```sql
-- Test-Eintrag
INSERT INTO paperless_documents_index (
  rfc_message_id,
  email_from,
  email_subject,
  source_account
) VALUES (
  'test-message-id-123',
  'test@example.com',
  'Test Email',
  'philip@zepta.com'
);

-- Prüfen
SELECT * FROM paperless_documents_index WHERE rfc_message_id = 'test-message-id-123';

-- Löschen
DELETE FROM paperless_documents_index WHERE rfc_message_id = 'test-message-id-123';
```

✅ **Phase 1 abgeschlossen** wenn Tabelle existiert und Indizes erstellt sind.

---

## 🎯 Phase 2: Apps Script Deployment

### **Schritt 2.1: Code prüfen**

```bash
cd B:\Nextcloud\CODE\proj\Paperless\scripts\master-gmail-to-paperless

# Prüfe ob neue Funktionen vorhanden:
grep -n "isDuplicateInPaperless" Code.js
grep -n "registerInPaperlessIndex" Code.js

# Sollte Zeilen zurückgeben!
```

### **Schritt 2.2: Deploy zu philip@zepta.com (MASTER)**

```bash
# Sicherstellen dass .clasp.json auf ZEPTA zeigt
cat .clasp.json

# Should show:
# {"scriptId":"AKfycbxJvcGPbHvs... (ZEPTA)","projectId":"paperless-email-export-master"}

# Deploy
clasp push
clasp deploy --description "v4.2: Präventive Duplikaterkennung mit Supabase"
```

### **Schritt 2.3: Deploy zu phkoenig@gmail.com (OFFICE)**

```bash
# .clasp.json auf OFFICE ändern (temporär)
# Oder separates Verzeichnis nutzen

clasp push
clasp deploy --description "v4.2: Präventive Duplikaterkennung mit Supabase"
```

### **Schritt 2.4: Test-Lauf (Apps Script Console)**

```javascript
// In Google Apps Script Console ausführen:

// 1. Test Duplikat-Check
function testDuplicateCheck() {
  const threads = GmailApp.search('newer_than:1d', 0, 1);
  if (threads.length > 0) {
    const message = threads[0].getMessages()[0];
    const result = isDuplicateInPaperless(message);
    console.log('Duplikat-Check Result:', JSON.stringify(result));
  }
}

// 2. Test vollständiger Export
function testExport() {
  const filterLists = loadFilterLists();
  exportFilteredEmails(filterLists);
}
```

### **Schritt 2.5: Logs prüfen**

```
Google Apps Script → Ausführungen → Logs

Erwartete Log-Einträge:
✅ "Paperless Export v4.2 gestartet"
✅ "🔁 DUPLIKAT übersprungen" (bei bekannten E-Mails)
✅ "✅ In Paperless-Index registriert" (bei neuen E-Mails)
```

✅ **Phase 2 abgeschlossen** wenn Deployment erfolgreich und Logs korrekt.

---

## 🎯 Phase 3: Sync & Cleanup Script

### **Schritt 3.1: Script auf Server kopieren**

```bash
# Lokal (von Projekt-Root)
scp -r scripts/paperless-sync paperless:/root/paperless/scripts/

# Oder via Git
ssh paperless
cd /root/paperless
git pull origin master
```

### **Schritt 3.2: Dependencies installieren**

```bash
ssh paperless

cd /root/paperless/scripts/paperless-sync

# Python & pip prüfen
python3 --version  # Sollte 3.9+ sein
pip3 --version

# Dependencies installieren
pip3 install -r requirements.txt

# Verify
python3 -c "import requests, supabase; print('✅ Dependencies OK')"
```

### **Schritt 3.3: Environment Variables setzen**

```bash
# Erstelle .env Datei
nano /root/paperless/scripts/paperless-sync/.env

# Inhalt:
PAPERLESS_URL=http://localhost:8000
PAPERLESS_TOKEN=08303a894fc26772730f3f5f8802b70837ca48c3
SUPABASE_URL=https://jpmhwyjiuodsvjowddsm.supabase.co
SUPABASE_KEY=eyJhbGci...

# Oder exportiere direkt:
export PAPERLESS_URL="http://localhost:8000"
export PAPERLESS_TOKEN="08303a894fc26772730f3f5f8802b70837ca48c3"
export SUPABASE_URL="https://jpmhwyjiuodsvjowddsm.supabase.co"
export SUPABASE_KEY="eyJhbGci..."
```

### **Schritt 3.4: Test-Lauf (manuell)**

```bash
cd /root/paperless/scripts/paperless-sync

# Ersten Test-Lauf (trocken)
python3 sync_index_and_cleanup.py

# Output prüfen:
# ============================================================
# 📊 Paperless-NGX Index Sync & Cleanup Script
# ============================================================
# ...
# ✅ Script erfolgreich abgeschlossen
```

### **Schritt 3.5: Cron-Job einrichten**

```bash
# Crontab bearbeiten
crontab -e

# Hinzufügen (täglich um 3:00 Uhr):
0 3 * * * cd /root/paperless/scripts/paperless-sync && /usr/bin/python3 sync_index_and_cleanup.py >> /var/log/paperless-sync.log 2>&1

# Cron-Job prüfen
crontab -l | grep paperless-sync
```

### **Schritt 3.6: Log-Rotation einrichten (optional)**

```bash
# Erstelle logrotate Config
sudo nano /etc/logrotate.d/paperless-sync

# Inhalt:
/var/log/paperless-sync.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

✅ **Phase 3 abgeschlossen** wenn Script läuft und Cron-Job aktiv ist.

---

## 🎯 Phase 4: Testing & Monitoring

### **Test 1: End-to-End Duplikat-Test**

```bash
# 1. Sende Test-E-Mail an dich selbst
# Betreff: "Test Duplikat v4.2"

# 2. Warte 5 Minuten (Apps Script Trigger)

# 3. Prüfe Supabase
SELECT * FROM paperless_documents_index 
WHERE email_subject LIKE '%Test Duplikat%'
ORDER BY created_at DESC LIMIT 1;

# 4. Sende GLEICHE E-Mail nochmal

# 5. Warte 5 Minuten

# 6. Prüfe Apps Script Logs
# Erwartung: "🔁 DUPLIKAT übersprungen"

# 7. Prüfe Google Drive
# Erwartung: Nur EINE E-Mail, nicht zwei!
```

### **Test 2: Sync-Script Test**

```bash
# Manuell ausführen
ssh paperless
cd /root/paperless/scripts/paperless-sync
python3 sync_index_and_cleanup.py

# Logs prüfen
cat /var/log/paperless-sync.log

# Supabase prüfen - wurden paperless_ids aktualisiert?
SELECT COUNT(*) FROM paperless_documents_index WHERE paperless_id IS NOT NULL;
```

### **Test 3: Cleanup Test**

```bash
# Prüfe failed/ Ordner VOR Cleanup
ls -lh /usr/src/paperless/consume/failed/

# Laufe Script
python3 sync_index_and_cleanup.py

# Prüfe failed/ Ordner NACH Cleanup
ls -lh /usr/src/paperless/consume/failed/

# Erwartung: Duplikate wurden gelöscht
```

### **Monitoring (erste 24h)**

```bash
# 1. Apps Script Logs
# Gehe zu: https://script.google.com/home/executions
# Prüfe: Werden Duplikate erkannt?

# 2. Supabase Dashboard
# Prüfe: Wachsen Einträge?
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE paperless_id IS NOT NULL) as synced,
  COUNT(*) FILTER (WHERE paperless_id IS NULL) as pending
FROM paperless_documents_index;

# 3. Paperless Web-UI
# Prüfe: Werden Dokumente importiert?
# URL: https://archive.megabrain.cloud

# 4. Server Logs
tail -f /var/log/paperless-sync.log
```

✅ **Phase 4 abgeschlossen** wenn alle Tests erfolgreich und Monitoring zeigt korrekte Werte.

---

## 📊 Success Metrics

Nach 24h Betrieb solltest du sehen:

| Metrik | Erwartung |
|--------|-----------|
| **Supabase Index** | Einträge wachsen mit jedem Export |
| **Paperless-IDs** | Werden nach Import aktualisiert (täglich) |
| **Failed Ordner** | Leer oder nur wenige Dateien |
| **Duplikaterkennung** | Logs zeigen "🔁 DUPLIKAT übersprungen" |
| **Speicherplatz** | Nicht mehr steigend durch Duplikate |

---

## 🆘 Troubleshooting

### Problem: "Connection refused" zu Supabase (Apps Script)

```javascript
// Test Supabase Connection
function testSupabaseConnection() {
  const url = `${SUPABASE_URL}/rest/v1/paperless_documents_index?select=*&limit=1`;
  const options = {
    method: 'get',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    console.log('✅ Supabase Connection OK:', response.getResponseCode());
  } catch (error) {
    console.error('❌ Supabase Connection Failed:', error);
  }
}
```

### Problem: Script findet keine Duplikate

**Mögliche Ursachen:**
1. **Supabase-Tabelle leer** → Erste E-Mails werden registriert, dann funktioniert es
2. **RFC Message-ID fehlt** → Check Apps Script Logs
3. **API-Key falsch** → Teste mit `testSupabaseConnection()`

### Problem: Sync-Script läuft nicht

```bash
# Prüfe Python-Version
python3 --version

# Prüfe Dependencies
pip3 list | grep -E "requests|supabase"

# Prüfe Environment Variables
echo $PAPERLESS_URL
echo $SUPABASE_URL

# Test-Lauf mit Debug
python3 -u sync_index_and_cleanup.py 2>&1 | tee debug.log
```

---

## 📅 Post-Deployment

### Nach 1 Woche:

- [ ] Supabase-Index Statistiken prüfen
- [ ] Failed-Ordner Größe prüfen
- [ ] Sync-Script Logs analysieren
- [ ] Performance-Metriken dokumentieren

### Nach 1 Monat:

- [ ] Duplikaterkennung-Rate berechnen
- [ ] Speicherplatz-Ersparnis messen
- [ ] Optimierungen identifizieren

---

**Erstellt:** 17.10.2025  
**Status:** ✅ Ready for Deployment  
**Nächster Schritt:** Phase 1 starten

