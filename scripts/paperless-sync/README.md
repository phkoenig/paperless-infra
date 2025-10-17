# 🔄 Paperless Index Sync & Cleanup Script

Synchronisiert `paperless_documents_index` (Supabase) mit tatsächlich importierten Dokumenten und räumt Duplikate auf.

---

## 🎯 Funktionen

### 1. **Index-Synchronisation**
- Findet Dokumente in Paperless, die im Index ohne `paperless_id` sind
- Matched via Betreff/Content-Similarity
- Aktualisiert `paperless_id` in Supabase

### 2. **Duplikat-Cleanup**
- Prüft `consume/failed/` Ordner
- Vergleicht SHA-256 Hashes mit existierenden Dokumenten
- Löscht bekannte Duplikate automatisch

---

## 📋 Voraussetzungen

```bash
# Python 3.9+
python3 --version

# Dependencies installieren
pip install -r requirements.txt
```

---

## ⚙️ Konfiguration

### Environment Variables:

```bash
# Paperless-NGX
export PAPERLESS_URL="http://localhost:8000"
export PAPERLESS_TOKEN="your_token_here"

# Supabase
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your_anon_key_here"
```

Oder erstelle `.env` Datei:
```env
PAPERLESS_URL=http://localhost:8000
PAPERLESS_TOKEN=your_token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_key
```

---

## 🚀 Verwendung

### Manuell ausführen:

```bash
cd scripts/paperless-sync
python3 sync_index_and_cleanup.py
```

### Via Docker (auf Server):

```bash
docker exec infra-paperless-webserver-1 python3 /path/to/sync_index_and_cleanup.py
```

---

## ⏰ Cron-Job Setup

Läuft täglich um 3:00 Uhr morgens:

### Auf Hetzner Server:

```bash
# Crontab bearbeiten
crontab -e

# Hinzufügen:
0 3 * * * cd /root/paperless/scripts/paperless-sync && python3 sync_index_and_cleanup.py >> /var/log/paperless-sync.log 2>&1
```

### Via Docker Compose (empfohlen):

```yaml
# In infra/docker-compose.yml hinzufügen:
paperless-sync:
  image: python:3.11-slim
  container_name: paperless-sync
  volumes:
    - ./scripts/paperless-sync:/app
    - /usr/src/paperless/consume:/usr/src/paperless/consume
  environment:
    - PAPERLESS_URL=http://paperless-webserver:8000
    - PAPERLESS_TOKEN=${PAPERLESS_TOKEN}
    - SUPABASE_URL=${SUPABASE_URL}
    - SUPABASE_KEY=${SUPABASE_KEY}
  command: >
    sh -c "
      pip install -r /app/requirements.txt &&
      while true; do
        python3 /app/sync_index_and_cleanup.py
        sleep 86400
      done
    "
  restart: unless-stopped
```

---

## 📊 Output-Beispiel

```
============================================================
📊 Paperless-NGX Index Sync & Cleanup Script
============================================================
⏰ Gestartet: 2025-10-17 03:00:00

🔄 SYNC: Index mit Paperless synchronisieren...

📋 15 Index-Einträge ohne Paperless-ID gefunden
📥 Lade alle Paperless-Dokumente...
   Seite 1: 100 Dokumente geladen (Total: 100)
   Seite 2: 45 Dokumente geladen (Total: 145)
✅ 145 Paperless-Dokumente geladen

🔍 Suche Dokument für Message-ID: CABxxxyyyzzz...
   Betreff: Rechnung 2025-001
   ✅ Match gefunden: Paperless-ID 123 - Rechnung 2025-001

✅ Sync abgeschlossen: 12/15 Einträge aktualisiert

🧹 CLEANUP: Fehlgeschlagene Duplikate aufräumen...

📊 145 eindeutige Dokument-Hashes in Paperless
📋 8 fehlgeschlagene Dateien gefunden
   🔁 DUPLIKAT: email_2025-10-15.pdf (Hash existiert in Paperless)
   🗑️  Gelöscht: email_2025-10-15.pdf

✅ Cleanup abgeschlossen:
   🗑️  3 Duplikate gelöscht
   ⏭️  5 Dateien übersprungen (nicht in Paperless)

============================================================
✅ Script erfolgreich abgeschlossen
============================================================
```

---

## 🔧 Troubleshooting

### Problem: "Connection refused" zu Paperless

```bash
# Prüfe ob Paperless läuft
docker ps | grep paperless

# Teste Paperless API
curl -H "Authorization: Token YOUR_TOKEN" http://localhost:8000/api/documents/
```

### Problem: Supabase Connection Fehler

```bash
# Prüfe Supabase-Zugangsdaten
echo $SUPABASE_URL
echo $SUPABASE_KEY

# Teste Supabase Connection
curl "$SUPABASE_URL/rest/v1/paperless_documents_index?select=*&limit=1" \
  -H "apikey: $SUPABASE_KEY"
```

### Problem: Keine Matches gefunden

- **Grund:** Betreff/Content stimmen nicht überein
- **Lösung:** Manuelle Zuordnung in Supabase:
  ```sql
  UPDATE paperless_documents_index
  SET paperless_id = 123, notes = 'Manually matched'
  WHERE rfc_message_id = 'CABxxxyyy...';
  ```

---

## 📈 Monitoring

### Log-Datei ansehen:

```bash
tail -f /var/log/paperless-sync.log
```

### Supabase-Index prüfen:

```sql
-- Einträge ohne Paperless-ID
SELECT COUNT(*) 
FROM paperless_documents_index 
WHERE paperless_id IS NULL;

-- Letzte Synchronisation
SELECT email_subject, paperless_id, updated_at
FROM paperless_documents_index
WHERE paperless_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

---

## 🎓 Best Practices

1. **Täglich laufen lassen** (nachts, wenn wenig los ist)
2. **Logs monitoren** (erste Woche genau beobachten)
3. **Backup vor Cleanup** (erste Male manuell testen)
4. **Failed-Ordner prüfen** (bevor Script läuft)

---

## 📅 Changelog

### v1.0 (17.10.2025)
- ✅ Initiale Version
- ✅ Index-Synchronisation
- ✅ Duplikat-Cleanup
- ✅ Cron-Job ready

---

**Erstellt:** 17.10.2025  
**Status:** ✅ Bereit für Deployment

