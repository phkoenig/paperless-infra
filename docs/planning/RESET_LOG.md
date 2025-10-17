# 🔄 Paperless-NGX Reset Log

**Datum:** 17.10.2025, 02:30 Uhr  
**Grund:** Frischer Start mit neuem intelligentem E-Mail-Filter (v4)

---

## ✅ Durchgeführte Schritte

### **1. Backup-Check** ✅
- Google Drive: Alle Original-E-Mails vorhanden
- Nextcloud: rclone Backup läuft
- **Status:** Alle Daten sind sicher

### **2. Services gestoppt** ✅
```bash
docker compose stop paperless-webserver paperless-worker paperless-consumer
```

### **3. PostgreSQL Datenbank geleert** ✅
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
- **Gelöscht:** 67 Tabellen
- **Ergebnis:** Komplett leere Datenbank

### **4. Media-Ordner geleert** ✅
```bash
rm -rf /opt/paperless/media/*
```
- **Gelöscht:** Alle verarbeiteten Dokumente

### **5. Consume-Ordner geleert** ✅
```bash
rm -rf /opt/paperless/consume/*
```
- **Gelöscht:** Alle Import-Queues (inkl. alte fehlgeschlagene Dateien)

### **6. Services neu gestartet** ✅
```bash
docker compose up -d
```
- Paperless führt automatisch Datenbank-Migrationen aus
- Neue frische Datenbank-Struktur erstellt

### **7. Superuser erstellt** ✅
```bash
python manage.py createsuperuser --username admin --email philip@zepta.com
```

---

## 🎯 Warum dieser Reset?

### **Problem vorher:**
- 501 fehlgeschlagene Imports
- Viele unnötige E-Mails importiert (kein Filter)
- Unübersichtlich

### **Lösung jetzt:**
- ✅ **Intelligenter Filter (v4)** mit Supabase
- ✅ **Whitelist/Blacklist** zentral verwaltet
- ✅ **KI-Unterstützung** (optional)
- ✅ **Nur wichtige E-Mails** werden importiert

**Erwartung:** 70-80% weniger Dokumente, nur relevante Inhalte!

---

## 📊 Status nach Reset

### **Paperless-NGX:**
- **Dokumente:** 0 (frischer Start)
- **Dateiaufgaben:** 0 fehlgeschlagene
- **Datenbank:** Leer, frisch migriert
- **Media:** Leer
- **Consume:** Leer

### **Web-UI:**
- **URL:** https://archive.megabrain.cloud
- **Login:** admin / (Passwort setzen beim ersten Login)
- **Status:** ✅ Online und bereit

### **E-Mail-Export:**
- **Apps Script v4:** ✅ Deployed zu beiden Accounts
- **Intelligenter Filter:** ✅ Aktiv
- **Supabase-Listen:** ✅ Konfiguriert (27 Blacklist, 38 Whitelist)

---

## 🚀 Was passiert als Nächstes?

### **Automatischer Ablauf:**

```
1. Apps Script läuft alle 5 Minuten
   ↓
2. Prüft E-Mails mit intelligentem Filter
   ↓
3. Exportiert NUR wichtige E-Mails zu Google Drive
   ↓
4. rclone synct zu Hetzner (alle 5 Min)
   ↓
5. Paperless importiert (ab jetzt nur Qualität!)
```

### **Erste Dokumente erwartet:**
- In ~10-15 Minuten sollten erste gefilterte E-Mails ankommen
- Nur wichtige (Rechnungen, Verträge, Behördenpost)
- Keine Newsletter, kein Spam!

---

## 📈 Monitoring

### **Filter-Entscheidungen prüfen:**
```sql
-- In Cursor (Supabase MCP):
SELECT 
  email_subject, 
  decision, 
  reason,
  ai_score,
  created_at
FROM email_filter_decisions
ORDER BY created_at DESC
LIMIT 20;
```

### **Paperless Web-UI:**
```
https://archive.megabrain.cloud
→ Dashboard sollte bei 0 Dokumenten starten
→ Dann langsam ansteigen (nur Qualität!)
```

---

## 🎓 Lessons Learned

### **Was haben wir gelernt:**
1. ✅ Filter VORHER implementieren (nicht nachträglich)
2. ✅ Zentrale Verwaltung (Supabase) spart Zeit
3. ✅ Monitoring wichtig (email_filter_decisions)
4. ✅ Backup immer vor Reset prüfen

---

## 📝 Nächste Schritte

### **In 24 Stunden:**
- [ ] Prüfe wie viele Dokumente importiert wurden
- [ ] Schaue Filter-Entscheidungen in Supabase
- [ ] Optimiere Whitelist/Blacklist falls nötig

### **In 1 Woche:**
- [ ] Statistik: Wie viel % werden gefiltert?
- [ ] Falsch-Positive? (Wichtige E-Mails gefiltert?)
- [ ] Falsch-Negative? (Spam durchgekommen?)
- [ ] Filter-Listen anpassen

---

**Reset abgeschlossen:** 17.10.2025, 02:36 Uhr  
**Nächster Check:** 18.10.2025 (nach 24h)  
**Status:** ✅ Sauberer Neustart erfolgreich!

