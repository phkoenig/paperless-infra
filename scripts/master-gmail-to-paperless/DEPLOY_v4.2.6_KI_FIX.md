# 🚀 Deployment v4.2.6 - KI-Analyse Fix

**Datum:** 18. Oktober 2025  
**Änderungen:** KI-Analyse (Google Gemini) wieder eingebaut

---

## ✅ Was wurde geändert

### 1. **GEMINI_API_KEY** wieder hinzugefügt (Zeile 50-51)
```javascript
// Google Gemini API für KI-Bewertung
const GEMINI_API_KEY = 'AIzaSyCoYAe5YLVvH0KzF9rLXH5xgT8fKm_2Qxw'; // Paperless Filter AI
```

### 2. **evaluateWithAI()** Funktion implementiert (Zeile 588-659)
- Bewertet E-Mails mit Google Gemini
- Score 8-10 → Export
- Score 0-7 → Reject

### 3. **KI-Block in shouldExportEmail()** (Zeile 478-494)
- STUFE 5: KI-Bewertung für Grenzfälle
- Nur wenn E-Mail Anhänge hat, aber keine Whitelist-Treffer
- Bei Score >= 7 wird exportiert

### 4. **Version** → v4.2.6

---

## 📋 Deployment-Anleitung

### **Option 1: Via clasp (empfohlen)**

```bash
cd scripts/master-gmail-to-paperless

# Login (Account auswählen!)
clasp logout
clasp login  # Browser öffnet → philip@zepta.com ODER phkoenig@gmail.com auswählen

# Für ZEPTA Account:
# - Script-ID in .clasp.json: 1bE2lTD9VqFh1YsjkLm8jVm_xKfFUa8Z0E6x8wMj5k9PqVJY0XJdgYqjr

# Für PRIVAT Account:
# - Script-ID in .clasp.json: 1OgncdBW_-rbgf_geYu8K9eFHjrl5NjZGcpQKBZaUZurgM5Xi36YS6Hgw

# Push & Deploy
clasp push
clasp deploy
```

### **Option 2: Manuell kopieren**

1. Öffne: https://script.google.com
2. Wähle den richtigen Account (philip@zepta.com oder phkoenig@gmail.com)
3. Öffne das Script "Gmail to Paperless Export"
4. Kopiere kompletten Inhalt aus `Code.js`
5. Ersetze im Script Editor
6. Speichern (Ctrl+S)
7. Deploy → "New Deployment" → Typ: "Web App"

---

## 🧪 Test nach Deployment

```javascript
// In Apps Script Konsole ausführen:
showVersion()  // Sollte v4.2.6 zeigen

// Filter-Test (ohne echten Export):
const filters = loadFilterLists();
console.log('Whitelist:', filters.whitelist.length, 'Regeln');
console.log('Blacklist:', filters.blacklist.length, 'Regeln');

// EXPORT STARTEN:
exportToPaperless()  // Exportiert E-Mails der letzten 30 Tage
```

---

## ✅ Erwartetes Verhalten

### **KI wird aktiviert wenn:**
- E-Mail hat Anhänge
- ABER: Kein Whitelist-Treffer
- ABER: Kein Blacklist-Treffer
- DANN: KI bewertet und entscheidet

### **KI-Score Bedeutung:**
- **8-10:** Wichtig → Export (Rechnungen, Verträge, Pläne)
- **5-7:** Möglicherweise wichtig → Reject (zu niedrig)
- **0-4:** Unwichtig → Reject (Newsletter, Werbung)

---

## 🚨 WICHTIG

Beide Accounts müssen geupdatet werden:
1. ✅ **philip@zepta.com** (ZEPTA)
2. ✅ **phkoenig@gmail.com** (PRIVAT)

Gleicher Code, andere Script-IDs!

---

**Status:** Lokal fertig, muss deployed werden

