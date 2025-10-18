# 🔤 Umlaute in Ordnernamen

## Problem

**Philip's Name wird falsch geschrieben!** 😤

Die Google Drive Ordner-Namen sanitisieren/entfernen Umlaute:
- `Philip_Knig_ZEPTA` statt `Philip_König_ZEPTA`
- `Goldstrae_13` statt `Goldstraße_13`
- `bersendung` statt `Übersendung`
- `Grundstcksgesellschaft` statt `Grundstücksgesellschaft`

**Beispiel aus Logs:**
```
2025-10-15_14-28-56_Philip_Knig_ZEPTA_F16_-_Elektroplanung_und_Rechn
                        ^^^^
                      König!
```

---

## Aktueller Code (Code.js)

**Location:** `scripts/master-gmail-to-paperless/Code.js`

**Funktion:** `sanitizeForFolderName(str)`

```javascript
function sanitizeForFolderName(str) {
  return str
    .replace(/[^\w\s-äöüßÄÖÜ]/g, '_')  // Erlaubt Umlaute!
    .replace(/\s+/g, '_')
    .substring(0, 50);
}
```

**Aber:** Google Drive API könnte Umlaute trotzdem encodieren/entfernen! 🤔

---

## Mögliche Lösungen

### Option A: Google Drive API Check
- Prüfen ob `DriveApp.createFolder()` Umlaute korrekt speichert
- Evtl. URL-Encoding Problem?

### Option B: UTF-8 Encoding explizit setzen
```javascript
function sanitizeForFolderName(str) {
  // Umlaute EXPLIZIT erlauben
  return str
    .normalize('NFC')  // Unicode normalisieren
    .replace(/[<>:"/\\|?*]/g, '_')  // Nur illegale Zeichen ersetzen
    .replace(/\s+/g, '_')
    .substring(0, 50);
}
```

### Option C: Umlaut-Mapping (Fallback)
```javascript
function sanitizeForFolderName(str) {
  // Nur als LETZTER Fallback - wenn Google Drive Umlaute nicht mag
  const umlautMap = {
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue',
    'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue',
    'ß': 'ss'
  };
  
  // Erst versuchen MIT Umlauten...
  // Falls Google Drive meckert: Mapping nutzen
}
```

---

## Nächste Schritte

1. **Test:** Ordner manuell mit Umlauten in Google Drive erstellen
2. **Prüfen:** Bleibt "König" oder wird es zu "Knig"?
3. **Fix:** Entsprechende Lösung implementieren
4. **Deploy:** Neue Version testen

---

## Priorität

🟡 **MITTEL** - Funktional unwichtig, aber nervt Philip! 😄

---

## Status

⏳ **OFFEN** - Noch nicht untersucht

---

_Erstellt: 18.10.2025, 04:21 Uhr_
_Grund: Philip möchte seinen Namen korrekt geschrieben sehen!_

