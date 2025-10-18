# 🗑️ Google Drive Cleanup - Legacy Attachments Ordner

## 📋 **Hintergrund**

**Vor v4.2 (veraltet):**
```
Paperless-Attachments/    ← SEPARATE Attachments
Paperless-Emails/          ← Nur E-Mails
```

**Ab v4.2+ (aktuell):**
```
Paperless-Emails/
└── [timestamp]_[sender]_[subject]/
    ├── email.eml          ← E-Mail
    └── attachment-*.xyz   ← Anhänge IM GLEICHEN Ordner! ✅
```

**Problem:** Der alte `Paperless-Attachments` Ordner wird nicht mehr benötigt und belegt unnötig Speicher.

---

## 🚀 **Verwendung**

### **Schritt 1: Status prüfen**

1. Öffne **Google Apps Script Editor**
   - Gehe zu `script.google.com`
   - Oder über Google Drive → Neues Apps Script

2. Kopiere `cleanup-google-drive-attachments.js` Code

3. Führe aus: **`checkCleanupStatus()`**
   - Zeigt ob Legacy-Ordner vorhanden sind
   - **Safe**: Ändert nichts, nur Status-Check

**Beispiel-Output:**
```
🔍 GOOGLE DRIVE ORDNER STATUS
✅ "Paperless-Emails" (AKTUELL)
   E-Mail Ordner: 142
   
⚠️  "Paperless-Attachments" (VERALTET!)
   Attachment Ordner: 89
   → Sollte gelöscht werden!
```

---

### **Schritt 2: Legacy-Ordner löschen**

Führe aus: **`cleanupLegacyAttachmentsFolder()`**

**Was passiert:**
- ✅ `Paperless-Attachments` wird in **Papierkorb** verschoben
- ✅ **NICHT permanent gelöscht!** → 30 Tage wiederherstellbar
- ✅ `Paperless-Emails` wird **NICHT angerührt**

**Beispiel-Output:**
```
📂 Gefunden: "Paperless-Attachments"
   Unterordner: 89
   Dateien (rekursiv): 247
   
✅ Ordner in Papierkorb verschoben!
   Wiederherstellung: Google Drive → Papierkorb
```

---

### **Schritt 3: Verifizieren**

1. Öffne **Google Drive**
2. Prüfe ob nur `Paperless-Emails` vorhanden ist
3. Optional: Prüfe **Papierkorb** ob gelöschter Ordner dort liegt

---

## 🔄 **Wiederherstellung (Falls versehentlich gelöscht)**

**Manuell:**
1. Öffne [Google Drive](https://drive.google.com)
2. Klicke links auf **"Papierkorb"**
3. Suche nach `Paperless-Attachments`
4. Rechtsklick → **"Wiederherstellen"**

**⏰ Zeitlimit:** 30 Tage, danach permanent gelöscht!

---

## 📊 **Erwartete Speicherersparnis**

Pro 100 E-Mails mit Anhängen:
- **Vor Cleanup:** ~200 Ordner (100 Emails + 100 Attachments)
- **Nach Cleanup:** ~100 Ordner (nur Emails mit Attachments drin)

**Speicher:** Keine Einsparung (Dateien sind nur anders organisiert)  
**Übersichtlichkeit:** ⭐⭐⭐⭐⭐ Deutlich besser!

---

## ⚠️ **Sicherheitshinweise**

1. **Backup prüfen:** Stelle sicher, dass Paperless alle Dokumente hat
2. **Test-Account zuerst:** Teste erst mit `phkoenig@gmail.com`, dann `philip@zepta.com`
3. **Papierkorb-Wiederherstellung:** 30 Tage Zeit zum Rückgängig machen
4. **Keine Panik:** Alles ist wiederherstellbar!

---

## 📝 **Für beide Google Accounts ausführen**

Cleanup sollte für **BEIDE** Accounts durchgeführt werden:

1. **`philip@zepta.com`** (ZEPTA Workspace)
2. **`phkoenig@gmail.com`** (Privat)

**Pro Account:**
- Script in Google Apps Script Editor öffnen
- `checkCleanupStatus()` → Status prüfen
- `cleanupLegacyAttachmentsFolder()` → Aufräumen
- Google Drive prüfen

---

## 🎯 **Erfolgs-Kriterien**

✅ Nur noch `Paperless-Emails` Ordner vorhanden  
✅ Alle Anhänge sind IN den E-Mail-Ordnern  
✅ Apps Script v4.2.8+ deployed  
✅ Keine Fehlermeldungen in Logs  
✅ Paperless importiert weiterhin korrekt

---

_Erstellt: 18. Oktober 2025_  
_Version: 1.0_  
_Autor: Philip König_

