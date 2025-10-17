# 🌌 Galaxy System - KI-Navigationsdatenbank

## 🎯 **ÜBERBLICK**

Das Galaxy System ist eine **KI-Navigationsdatenbank** für intelligente Dokumenten-Zuordnung in Paperless NGX. Es ermöglicht der KI, Dokumente basierend auf Inhalten, Adressen, Kontakten und Keywords automatisch den richtigen Galaxien und Projekten zuzuordnen.

---

## 🏗️ **SYSTEM-ARCHITEKTUR**

### **Galaxy → Project → Subfolder Struktur:**
```
Galaxy (Ebene 1): ZEPTA, KÖNIG, BRAIN, etc.
├── Projects (Ebene 2): XFI-FINANZEN, F16-Fontaneallee16, etc.
    ├── Subfolders (Ebene 3): Rechnungseingang, Rechnungsausgang, etc.
```

### **Standard-Projekte (immer vorhanden):**
- **XDB-DATABASE**: Vorlagen, Handbuch/Wiki
- **XFI-FINANZEN**: Rechnungseingang, Rechnungsausgang, Jahresabschluss, BWA, Steuern, Bankunterlagen, Liquidität
- **XKO-KOMMUNIKATION**: Webseite, CI, Präsentation, Reisen, Werbung, Events, Social Media, Leads, Network
- **XOR-ORGANISATION**: Gesellschaftsverträge, Gesellschafterbeschlüsse, Darlehensverträge, Protokolle, Versicherungen, Rechtliches, Inventar, Korrespondenz, Förderung

---

## 🗄️ **DATENBANK-STRUKTUR (SUPABASE)**

### **Haupt-Tabellen:**
- `galaxies`: Galaxy-Definitionen mit Kurz-IDs
- `projects`: Projekt-Definitionen (Standard + Freie Projekte)
- `standard_projects`: X-Projekte mit JSONB-Subfolder-Struktur
- `project_metadata`: **KI-Navigationsdaten** (Adressen, Kontakte, Keywords)
- `system_rules`: Regeln für Dateinamen und Ordnerstruktur

### **Metadaten-Typen für KI:**
- `address`: Straßenadressen
- `postal_code`: Postleitzahlen
- `city`: Städte/Orte
- `contact`: Personen/Firmen
- `email_domain`: E-Mail-Domains
- `keyword`: Suchbegriffe
- `phone`: Telefonnummern
- `company`: Firmen

---

## 🔗 **API-ZUGRIFF**

### **1. Metadata API (JSON):**
```bash
GET https://brain-db-products.vercel.app/api/galaxy-system/metadata
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "galaxy_id": "ZEPTA",
      "projects": [
        {
          "project_id": "F16",
          "name": "Fontaneallee 16 - Zeuthen",
          "metadata": [
            {
              "metadata_type": "address",
              "metadata_value": "Fontaneallee 16",
              "confidence_score": 100
            },
            {
              "metadata_type": "postal_code", 
              "metadata_value": "15738",
              "confidence_score": 95
            }
          ]
        }
      ]
    }
  ]
}
```

### **2. Paperless Prompt API:**
```bash
GET https://brain-db-products.vercel.app/api/galaxy-system/paperless-prompt
```

**Response:** Vollständiger Markdown-Prompt für Paperless NGX AI

---

## 🤖 **CURSOR AI INTEGRATION**

### **Was Cursor AI wissen muss:**

#### **A) System-Verständnis:**
```markdown
Das Galaxy System ist eine hierarchische Dokumentenorganisation:
- Galaxien = Lebensbereiche/Unternehmen (ZEPTA=Architektur, KÖNIG=Privat)
- Projekte = Konkrete Vorhaben (F16=Fontaneallee16, XFI=Finanzen)
- Subfolders = Thematische Unterordner (Rechnungseingang, etc.)
```

#### **B) Datenbank-Zugriff:**
```typescript
// Supabase Client Setup
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jpmhwyjiuodsvjowddsm.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Metadaten abfragen
const { data } = await supabase
  .from('project_metadata')
  .select('project_id, galaxy_id, metadata_type, metadata_value, confidence_score')
  .eq('metadata_type', 'address')
```

#### **C) API-Nutzung:**
```typescript
// Metadata für KI-Navigation laden
const response = await fetch('https://brain-db-products.vercel.app/api/galaxy-system/metadata')
const { data: galaxyData } = await response.json()

// Paperless Prompt generieren
const promptResponse = await fetch('https://brain-db-products.vercel.app/api/galaxy-system/paperless-prompt')
const { prompt } = await promptResponse.json()
```

---

## 📋 **PAPERLESS NGX IMPLEMENTATION**

### **1. AI Prompt Setup:**
```markdown
# In Paperless NGX AI Settings:
1. Gehe zu Settings → AI
2. Füge den Prompt von der API ein:
   GET https://brain-db-products.vercel.app/api/galaxy-system/paperless-prompt
3. Speichere und teste mit Dokumenten
```

### **2. Tags erstellen:**
```markdown
# Galaxy Tags:
- ZEPTA (Architektur)
- KÖNIG (Privat/Immobilien)
- BRAIN (IT-Projekte)

# Projekt Tags:
- F16-Fontaneallee16
- VIC-Victoria
- XFI-FINANZEN
- XKO-KOMMUNIKATION
- XOR-ORGANISATION
- XDB-DATABASE
```

### **3. Correspondents filtern:**
```markdown
# E-Mail-Domains nach Projekten:
- @mustermann-zeuthen.de → F16-Projekt
- @bauherr-schmidt.de → entsprechendes Projekt
- @architekt-mueller.de → ZEPTA Galaxy
```

---

## 🔍 **KI-ZUORDNUNGSREGELN**

### **1. Adressen & Orte:**
```markdown
- "Fontaneallee 16, Zeuthen" → F16-Fontaneallee16 (ZEPTA)
- "Berliner Straße 83" → B83-BerlinerStraße83 (ZEPTA)
- PLZ "15738" → Zeuthen → F16-Projekt
```

### **2. Kontakte & Personen:**
```markdown
- "Bauherr Mustermann" → F16-Projekt
- "Eigentümer Schmidt" → VIC-Projekt
- "Architekt Müller" → ZEPTA Galaxy
```

### **3. Keywords & Kontext:**
```markdown
- Architektur: "Bau", "Planung", "Grundriss", "Statik" → ZEPTA
- Immobilien: "WEG", "Eigentum", "Wohnung", "Miete" → KÖNIG
- Finanzen: "Rechnung", "Zahlung", "Kredit" → XFI-FINANZEN
```

### **4. E-Mail-Analyse:**
```markdown
- Absender-Domain → entsprechendes Projekt
- Betreff-Zeilen nach Projekt-Kürzeln durchsuchen
- Anhänge nach Adressen/Projektnamen analysieren
```

### **5. Fallback-Strategie:**
```markdown
Keine direkte Zuordnung → Standard-Projekte:
- Rechnungen → XFI-FINANZEN
- Verträge → XOR-ORGANISATION
- Kommunikation → XKO-KOMMUNIKATION
- Unbekannt → XDB-DATABASE
```

---

## 🛠️ **ENTWICKLUNG & WARTUNG**

### **Metadaten hinzufügen:**
```sql
INSERT INTO project_metadata (project_id, galaxy_id, metadata_type, metadata_value, confidence_score, description) 
VALUES ('F16', 'ZEPTA', 'address', 'Fontaneallee 16', 100, 'Hauptadresse des Projekts');
```

### **Neue Projekte anlegen:**
```sql
INSERT INTO projects (project_id, name, galaxy_id, project_type) 
VALUES ('NEW', 'Neues Projekt', 'ZEPTA', 'Run');
```

### **System Rules erweitern:**
```sql
INSERT INTO system_rules (rule_type, category, rule_key, rule_value, description) 
VALUES ('naming', 'files', 'new_rule', '{"pattern": "..."}', 'Neue Benennungsregel');
```

---

## 🧪 **TESTING & DEBUGGING**

### **API testen:**
```bash
# Metadata API
curl https://brain-db-products.vercel.app/api/galaxy-system/metadata

# Paperless Prompt
curl https://brain-db-products.vercel.app/api/galaxy-system/paperless-prompt
```

### **Datenbank prüfen:**
```sql
-- Alle Metadaten anzeigen
SELECT p.project_id, p.name, pm.metadata_type, pm.metadata_value, pm.confidence_score
FROM projects p
JOIN project_metadata pm ON p.project_id = pm.project_id AND p.galaxy_id = pm.galaxy_id
ORDER BY p.galaxy_id, p.project_id, pm.confidence_score DESC;
```

### **Paperless NGX testen:**
1. Test-Dokument hochladen
2. AI-Zuordnung prüfen
3. Bei Fehlzuordnung: Metadaten erweitern
4. Confidence-Scores anpassen

---

## 📊 **BEISPIEL-ZUORDNUNGEN**

| Dokument | Inhalt | KI-Erkennung | Zuordnung |
|----------|--------|--------------|-----------|
| E-Mail | "Rechnung Fontaneallee 16, Zeuthen" | Adresse "Fontaneallee 16" | F16-Fontaneallee16 (ZEPTA) |
| Rechnung | "Mustermann Zeuthen" | Kontakt + PLZ-Bereich | F16-Fontaneallee16 (ZEPTA) |
| WEG-Protokoll | "Victoria Street WEG" | Keyword "WEG" + "Victoria" | VIC-Victoria (KÖNIG) |
| Rechnung | "Rechnung vom 15.01.2025" | Rechnungstyp | XFI-FINANZEN (Standard) |
| Architekturplan | "Grundriss Erdgeschoss" | Keyword "Grundriss" | ZEPTA Galaxy |

---

## 🚀 **NÄCHSTE SCHRITTE**

### **1. Metadaten erweitern:**
- Weitere Projekte mit Adressen versehen
- E-Mail-Domains hinzufügen
- Keywords verfeinern

### **2. Paperless NGX optimieren:**
- AI Prompt testen und anpassen
- Tags und Correspondents verfeinern
- Confidence-Scores optimieren

### **3. Automatisierung:**
- Batch-Import für Metadaten
- Automatische Tag-Erstellung
- Monitoring der Zuordnungsqualität

---

## 📞 **SUPPORT & KONTAKT**

- **Datenbank:** Supabase Dashboard
- **API-Docs:** `/api/galaxy-system/metadata`
- **Web-Interface:** https://brain-db-products.vercel.app/galaxy-system
- **Entwicklung:** Cursor AI mit diesem README

---

**Letzte Aktualisierung:** $(date)  
**Version:** 1.0  
**Status:** Produktiv einsatzbereit
