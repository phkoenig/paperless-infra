# 🎯 Intelligenter E-Mail-Filter für Paperless-NGX

**Version 4.0** - Mit Supabase-Integration und KI-Unterstützung

---

## 🎯 Ziel

**Nur wichtige E-Mails** werden zu Paperless exportiert. Der Rest wird automatisch gefiltert.

**Warum?**
- ✅ Paperless bleibt sauber (keine Newsletter, kein Spam)
- ✅ Schnellere Suche (nur relevante Dokumente)
- ✅ Weniger Speicherplatz
- ✅ Bessere Übersichtlichkeit

---

## 🧠 Wie funktioniert der Filter?

### **5-Stufen-Filterung:**

```
E-Mail kommt rein
    ↓
┌─────────────────────────────────────────┐
│ STUFE 1: User-Label "Paperless"?       │
│ ✅ JA → SOFORT EXPORTIEREN              │
└─────────────────────────────────────────┘
    ↓ NEIN
┌─────────────────────────────────────────┐
│ STUFE 2: Blacklist-Check                │
│ (Newsletter, Spam, Social Media)        │
│ ✅ MATCH → SOFORT ABLEHNEN              │
└─────────────────────────────────────────┘
    ↓ NEIN
┌─────────────────────────────────────────┐
│ STUFE 3: Whitelist-Check                │
│ (Wichtige Domains, Keywords, Anhänge)   │
│ ✅ MATCH → SOFORT EXPORTIEREN           │
└─────────────────────────────────────────┘
    ↓ NEIN
┌─────────────────────────────────────────┐
│ STUFE 4: Hat Anhänge?                   │
│ ❌ NEIN → ABLEHNEN                      │
└─────────────────────────────────────────┘
    ↓ JA
┌─────────────────────────────────────────┐
│ STUFE 5: KI-Bewertung (optional)        │
│ Score >= 7 → EXPORTIEREN                │
│ Score < 7 → ABLEHNEN                    │
└─────────────────────────────────────────┘
```

---

## 📊 **Filter-Listen in Supabase**

### **Blacklist** (27 Einträge)
**Kategorien:**
- `sender` (12) - noreply@, newsletter@, notification@, etc.
- `subject` (15) - unsubscribe, sale, rabatt, etc.

**Beispiele:**
```
❌ noreply@firma.de
❌ newsletter@marketing.com
❌ notification@linkedin.com
❌ Betreff: "Unsubscribe from..."
❌ Betreff: "Limited offer!"
```

---

### **Whitelist** (38 Einträge)
**Kategorien:**
- `attachment` (14) - rechnung, vertrag, bauplan, etc.
- `domain` (12) - @finanzamt, @notar, @bank, etc.
- `subject` (9) - rechnung, mahnung, genehmigung, etc.
- `sender` (3) - bauamt@, buchhaltung@, etc.

**Beispiele:**
```
✅ Von: rechnung@lieferant.de
✅ Von: info@finanzamt.de
✅ Anhang: rechnung-2025.pdf
✅ Betreff: "Baugenehmigung erteilt"
✅ Betreff: "Vertrag zur Unterschrift"
```

**Prioritäten** (1-10):
- **10** - Höchste (Behörden, Rechnungen, Verträge)
- **9** - Sehr wichtig (Bauamt, Banken, Angebote)
- **8** - Wichtig (Versicherungen, Aufträge)
- **7** - Normal (Projekte, Fristen)

---

## 🔧 **Zentrale Verwaltung**

### **Whitelist/Blacklist verwalten:**

#### **Via Supabase Dashboard:**
```
https://supabase.com/dashboard/project/jpmhwyjiuodsvjowddsm

Tabellen:
├─ email_filter_blacklist
└─ email_filter_whitelist
```

#### **Via SQL (direkt in Cursor):**
```sql
-- Neuen Blacklist-Eintrag hinzufügen
INSERT INTO email_filter_blacklist (keyword, category, description)
VALUES ('spam@firma.de', 'sender', 'Bekannter Spammer');

-- Neuen Whitelist-Eintrag hinzufügen
INSERT INTO email_filter_whitelist (keyword, category, priority, description)
VALUES ('wichtig@kunde.de', 'sender', 10, 'Wichtiger Kunde');

-- Eintrag deaktivieren (statt löschen)
UPDATE email_filter_blacklist 
SET active = FALSE 
WHERE keyword = 'newsletter@';

-- Alle aktiven Einträge anzeigen
SELECT * FROM email_filter_whitelist WHERE active = TRUE ORDER BY priority DESC;
```

---

## 📈 **Monitoring & Statistiken**

### **Filter-Entscheidungen anschauen:**

```sql
-- Letzte 50 Entscheidungen
SELECT 
  created_at,
  email_from,
  email_subject,
  decision,
  reason,
  ai_score
FROM email_filter_decisions
ORDER BY created_at DESC
LIMIT 50;

-- Statistiken der letzten 7 Tage
SELECT 
  decision,
  COUNT(*) as anzahl,
  ROUND(AVG(ai_score), 2) as avg_score
FROM email_filter_decisions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY decision;

-- Häufigste Blacklist-Treffer
SELECT 
  matched_rules,
  COUNT(*) as anzahl
FROM email_filter_decisions
WHERE decision = 'skip'
GROUP BY matched_rules
ORDER BY anzahl DESC
LIMIT 10;
```

---

## 🧪 **Testen**

### **Test-Funktion im Apps Script:**
```javascript
// Öffne Google Apps Script Console
// Führe aus: testFilter()

// Zeigt für letzte 10 E-Mails:
// ✅ Exportiert: Rechnung.pdf (Whitelist: rechnung)
// 🚫 Gefiltert: Newsletter (Blacklist: newsletter@)
```

### **Manueller Test:**
1. Sende dir selbst eine Test-E-Mail
2. Warte 5 Minuten (Apps Script Trigger)
3. Schaue in Google Apps Script → Ausführungen → Logs
4. Prüfe Supabase → `email_filter_decisions` Tabelle

---

## 🤖 **KI-Integration (Optional)**

### **Google Gemini API aktivieren:**

1. Gehe zu: https://makersuite.google.com/app/apikey
2. Erstelle API-Key
3. Füge in Apps Script ein:
```javascript
const GEMINI_API_KEY = 'DEIN_API_KEY_HIER';
```
4. Deploy erneut zu beiden Accounts

### **Kosten:**
- ~$0.001 pro E-Mail
- Bei 1000 E-Mails/Monat = ~$1-5/Monat
- Nur für Grenzfälle (meiste werden schon durch Regeln entschieden)

---

## 📊 **Erwartete Filterrate:**

### **Ohne Filter (v3):**
```
1000 E-Mails/Monat
→ ALLE 1000 werden exportiert
→ Paperless voll mit Müll
```

### **Mit Filter (v4):**
```
1000 E-Mails/Monat
├─ 200-300 werden exportiert ✅ (Wichtige!)
└─ 700-800 werden gefiltert 🚫 (Newsletter, Notifications, etc.)

Ergebnis:
✅ 70-80% weniger Dokumente
✅ Nur relevante Inhalte
✅ Schnellere Suche
```

---

## 🎯 **Filter-Beispiele**

### **Wird EXPORTIERT:** ✅

| E-Mail | Grund |
|--------|-------|
| Rechnung von Lieferant (PDF-Anhang) | Whitelist: attachment="rechnung" |
| Brief vom Finanzamt | Whitelist: domain="@finanzamt" |
| Bauantrag mit Plänen | Whitelist: subject="bauantrag" |
| Vertrag zur Unterschrift | Whitelist: attachment="vertrag" |
| Kunde mit "Paperless" Label | User-Label (höchste Priorität) |

### **Wird GEFILTERT:** 🚫

| E-Mail | Grund |
|--------|-------|
| LinkedIn: "Someone viewed your profile" | Blacklist: sender="notification@linkedin.com" |
| Newsletter: "Unsere Angebote" | Blacklist: sender="newsletter@" |
| Facebook Notification | Blacklist: sender="noreply@facebook.com" |
| "Click here for discount!" | Blacklist: subject="click here" |
| Chat-Nachricht ohne Anhang | Keine Anhänge + keine Whitelist |

---

## 🔧 **Anpassen der Filter**

### **1. Zu streng? (Wichtige E-Mails werden gefiltert)**
```sql
-- Whitelist-Einträge hinzufügen
INSERT INTO email_filter_whitelist (keyword, category, priority, description)
VALUES ('wichtiger-kunde@firma.de', 'sender', 9, 'Wichtiger Kunde XYZ');
```

### **2. Zu locker? (Zu viel Müll kommt durch)**
```sql
-- Blacklist-Einträge hinzufügen
INSERT INTO email_filter_blacklist (keyword, category, description)
VALUES ('spam-keyword', 'subject', 'Bekanntes Spam-Keyword');
```

### **3. Eintrag temporär deaktivieren:**
```sql
-- Deaktivieren
UPDATE email_filter_whitelist 
SET active = FALSE 
WHERE keyword = 'test@';

-- Wieder aktivieren
UPDATE email_filter_whitelist 
SET active = TRUE 
WHERE keyword = 'test@';
```

---

## 🆘 **Troubleshooting**

### **Problem: Wichtige E-Mail wurde gefiltert**
1. Schaue in `email_filter_decisions` Tabelle:
```sql
SELECT * FROM email_filter_decisions 
WHERE email_subject LIKE '%Wichtiger Betreff%'
ORDER BY created_at DESC LIMIT 1;
```
2. Füge Sender/Keyword zur Whitelist hinzu
3. Setze manuell "Paperless" Label auf E-Mail (wird sofort exportiert)

### **Problem: Spam kommt durch**
1. Schaue welche Spam-E-Mails exportiert werden
2. Füge Sender/Keywords zur Blacklist hinzu
3. Veraltete Einträge aus Whitelist entfernen

### **Problem: Filter lädt nicht aus Supabase**
1. Prüfe Apps Script Logs auf Fehler
2. Teste Supabase-Verbindung:
```javascript
// Im Apps Script ausführen:
testSupabaseConnection()
```
3. Prüfe API-Key in Script

---

## 📝 **Deployment**

Das Script ist bereits deployed zu:
- ✅ philip@zepta.com (ZEPTA)
- ✅ phkoenig@gmail.com (Privat)

**Bei Änderungen:**
```bash
cd scripts/master-gmail-to-paperless
# Änderungen in Code.js machen
clasp push --force  # (für beide Accounts wiederholen)
```

---

## 🎓 **Best Practices**

1. **Start konservativ:** Lieber zu viel exportieren als zu wenig
2. **Monitore regelmäßig:** Schaue in `email_filter_decisions`
3. **Iterativ anpassen:** Filter nach 1-2 Wochen optimieren
4. **User-Label nutzen:** Bei Unsicherheit manuell "Paperless" Label setzen
5. **Nicht löschen:** Einträge deaktivieren statt löschen (für Historie)

---

## 📅 **Changelog**

### **v4.0 (17.10.2025) - Intelligenter Filter**
- ✅ Supabase-Integration für zentrale Listen
- ✅ 5-Stufen-Filterung (User-Label → Blacklist → Whitelist → Anhänge → KI)
- ✅ Logging aller Entscheidungen
- ✅ 27 Blacklist-Einträge (Newsletter, Spam, Social Media)
- ✅ 38 Whitelist-Einträge (Behörden, Finanzen, Architektur)
- ✅ Google Gemini Integration (optional)
- ✅ Deployed zu beiden Accounts

### **v3.0 (16.10.2025) - Master Script**
- Universal Script für beide Accounts

### **v2.0 (15.10.2025)**
- E-Mail-Bodies als PDF

---

**Erstellt:** 17.10.2025  
**Status:** ✅ Aktiv und funktionsfähig

