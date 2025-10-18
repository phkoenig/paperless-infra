# 🔄 TABULA RASA - Vollständiger System-Reset

## 📋 **Übersicht**

Das Tabula Rasa Script setzt das gesamte Paperless-System auf Null zurück. Es löscht alle Daten, Ordner, Logs und Indexe, um einen sauberen Neustart zu ermöglichen.

## 🎯 **Was wird gelöscht:**

### 1. **Supabase Datenbank**
- ✅ `paperless_documents_index` (Deduplication Index)
- ✅ `email_filter_decisions` (Filter-Logs)
- ✅ `email_whitelist` (Whitelist-Regeln)
- ✅ `email_blacklist` (Blacklist-Regeln)

### 2. **Paperless-NGX**
- ✅ Alle Dokumente löschen
- ✅ Alle Tags löschen (außer Standard)
- ✅ Alle Correspondents löschen
- ✅ Alle Document Types löschen

### 3. **Google Drive (beide Accounts)**
- ✅ `Paperless-Emails/` Ordner komplett leeren
- ✅ `Paperless-Attachments/` Ordner komplett leeren

### 4. **Server (Hetzner)**
- ✅ `/opt/paperless/consume/emails/` leeren
- ✅ `/opt/paperless/consume/emails_pdf/` leeren
- ✅ `/opt/paperless/consume/gdrive-office/` leeren
- ✅ `/opt/paperless/consume/gdrive-philip/` leeren

### 5. **Docker System**
- ✅ Docker Logs zurücksetzen
- ✅ Docker System bereinigen
- ✅ Container neu starten

---

## 🛠️ **Verwendung**

### **Python Version (Empfohlen):**
```bash
# Installation der Dependencies
pip install supabase

# Script ausführen
python scripts/tabula-rasa-reset.py --confirm
```

### **Bash Version:**
```bash
# Script ausführen
bash scripts/tabula-rasa-reset.sh --confirm
```

**⚠️ WICHTIG:** Das `--confirm` Flag ist **erforderlich** und verhindert versehentliche Löschung!

---

## 📋 **Manuelle Schritte**

### **1. Supabase Datenbank leeren:**
```sql
DELETE FROM paperless_documents_index;
DELETE FROM email_filter_decisions;
DELETE FROM email_whitelist WHERE id > 0;
DELETE FROM email_blacklist WHERE id > 0;
```

### **2. Google Drive Ordner leeren:**

**Account 1: philip@zepta.com (ZEPTA)**
1. Gehe zu Google Drive
2. Suche nach: `Paperless-Emails`
3. Lösche ALLE Ordner in diesem Ordner
4. Suche nach: `Paperless-Attachments`
5. Lösche ALLE Ordner in diesem Ordner

**Account 2: phkoenig@gmail.com (PRIVAT)**
1. Wechsle zu phkoenig@gmail.com
2. Wiederhole die gleichen Schritte

---

## ✅ **Verification**

Nach dem Reset sollte folgendes der Fall sein:

| **Komponente** | **Erwarteter Status** |
|---|---|
| **Supabase Index** | 0 Einträge |
| **Paperless Dokumente** | 0 Dokumente |
| **Google Drive** | Leere Ordner |
| **Server Ordner** | 0 Dateien |
| **Docker Container** | Alle laufen |

---

## 🚀 **Nach dem Reset**

1. **Apps Script ausführen:**
   - Gehe zu Google Apps Script Console
   - Führe `exportToPaperless` aus
   - Beobachte die Logs

2. **Warten auf Sync:**
   - rclone Sync: ca. 5 Minuten
   - eml2pdf Konvertierung: ca. 2-5 Minuten
   - Paperless Import: automatisch

3. **Überprüfung:**
   - Schaue in Paperless-NGX nach neuen Dokumenten
   - Prüfe die Attachments-Seite bei E-Mails mit Anhängen

---

## ⚠️ **Warnungen**

- **Datenverlust:** Alle Daten werden unwiderruflich gelöscht!
- **Backup:** Erstelle vor dem Reset ein Backup falls nötig
- **Bestätigung:** Das `--confirm` Flag ist zwingend erforderlich
- **Manuelle Schritte:** Google Drive muss manuell geleert werden

---

## 🔧 **Troubleshooting**

### **Problem: "Ordner bereits vorhanden"**
- **Ursache:** Google Drive Ordner nicht vollständig geleert
- **Lösung:** Manuell in Google Drive alle Ordner löschen

### **Problem: "Supabase Connection Error"**
- **Ursache:** Supabase Client nicht installiert
- **Lösung:** `pip install supabase`

### **Problem: "SSH Connection Failed"**
- **Ursache:** SSH-Zugriff zum Server nicht verfügbar
- **Lösung:** SSH-Konfiguration prüfen

---

## 📝 **Changelog**

- **v1.0** - Initiale Version mit Python und Bash Scripts
- **v1.1** - Hinzugefügt: Docker Logs Reset
- **v1.2** - Hinzugefügt: Verification Steps
