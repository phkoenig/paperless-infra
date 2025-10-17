# Paperless-NGX Usage Guide

Benutzerhandbuch für die Paperless-NGX Web-Interface und Workflows.

## 🌐 Web-Interface

### Login
- **URL:** https://archive.megabrain.cloud
- **User:** Superuser (nach `docker compose exec paperless-webserver python manage.py createsuperuser`)

### Dashboard
- **Übersicht:** Aktuelle Statistiken und Upload-Bereich
- **Upload:** Drag & Drop von PDF-Dateien
- **Suchfunktion:** Globale Suche über alle Dokumente

## 📄 Dokumentenmanagement

### Dokument hochladen

**1. Manueller Upload:**
- Dateien in Upload-Bereich ziehen
- Oder "Dokumente hochladen" klicken
- Dateien automatisch verarbeitet (OCR, Indexierung)

**2. Automatischer Import:**
- **Nextcloud:** Dateien in `INBOX` → automatisch importiert
- **E-Mail:** IMAP-Import von philip@zepta.com

### Dokument-Ansicht

**Dokument-Details:**
- **Vorschau:** PDF-Viewer mit Thumbnails
- **Metadaten:** Titel, Datum, Typ, Korrespondent
- **Tags:** Benutzerdefinierte Schlagwörter
- **OCR-Text:** Durchsuchbarer Text-Inhalt

### Bearbeitung

**Metadaten bearbeiten:**
1. Dokument öffnen
2. "Bearbeiten" klicken
3. Felder anpassen:
   - **Titel:** Automatisch oder manuell
   - **Korrespondent:** Absender/Adressat
   - **Dokumenttyp:** Rechnung, Vertrag, etc.
   - **Tags:** Mehrere Tags möglich
   - **Benutzerdefinierte Felder:** Zusätzliche Metadaten

## 🏷️ Organisation

### Korrespondenten

**Verwaltung:** Admin → Korrespondenten

**Verwendung:**
- Automatische Erkennung bei Upload
- Manuelle Zuordnung bei Bearbeitung
- Integration mit Google Contacts (geplant)

**Beispiele:**
- Unternehmen: "ACME Corp", "Microsoft"
- Personen: "Max Mustermann", "Dr. Schmidt"
- Behörden: "Finanzamt", "Versicherung"

### Dokumenttypen

**Standard-Typen:**
- **Rechnung:** Eingangs-/Ausgangsrechnungen
- **Vertrag:** Verträge und Vereinbarungen
- **Brief:** Korrespondenz und Schriftverkehr
- **Quittung:** Belege und Bestätigungen

**Anpassung:** Admin → Dokumenttypen → "Hinzufügen"

### Tags

**Hierarchische Tags:**
```
Finanzen/
├── Rechnungen/
│   ├── Eingangsrechnungen
│   └── Ausgangsrechnungen
├── Steuern/
│   ├── Umsatzsteuer
│   └── Einkommensteuer
└── Versicherungen/
    ├── Haftpflicht
    └── Krankenversicherung
```

**Verwendung:**
- Automatische Zuordnung via AI
- Manuelle Zuordnung bei Upload
- Filterung in Dokumentenliste

## 🔍 Suche und Filter

### Globale Suche

**Suchfeld:** Oben rechts im Header

**Suchtypen:**
- **Volltext:** Durchsucht OCR-Text aller Dokumente
- **Metadaten:** Titel, Korrespondent, Tags
- **Dateibereich:** Erstellungsdatum, Upload-Datum

**Suchoperatoren:**
- `"exakte Phrase"` - Exakte Wortfolge
- `tag:rechnung` - Nach Tags filtern
- `correspondent:ACME` - Nach Korrespondent
- `type:invoice` - Nach Dokumenttyp

### Erweiterte Filter

**Filter-Panel:** Links in der Dokumentenliste

**Filter-Optionen:**
- **Korrespondent:** Dropdown-Auswahl
- **Dokumenttyp:** Multi-Select
- **Tags:** Tag-Cloud mit Häufigkeit
- **Datum:** Von/Bis Datumsauswahl
- **Dateigröße:** Größenbereich

### Gespeicherte Ansichten

**Erstellen:**
1. Filter setzen
2. "Ansicht speichern" klicken
3. Name vergeben

**Verwendung:**
- Schneller Zugriff auf häufige Filter
- Persönliche Ansichten
- Team-Ansichten (geplant)

## 📧 E-Mail-Integration

### IMAP-Konfiguration

**Admin → E-Mail → E-Mail-Konto hinzufügen:**

```
Name: philip@zepta.com
IMAP-Server: imap.gmail.com
Port: 993
Sicherheit: SSL
Benutzername: philip@zepta.com
Passwort: [App-Passwort]
Kennwort ist Token: ✅
```

**Funktionen:**
- Automatischer Import alle 10 Minuten
- E-Mail-Body → PDF-Konvertierung
- Anhänge automatisch verarbeitet
- Original-E-Mail gespeichert (optional)

### E-Mail-Workflow

1. **E-Mail empfangen** → philip@zepta.com
2. **Automatischer Import** → Paperless
3. **OCR-Verarbeitung** → Text durchsuchbar
4. **AI-Klassifikation** → Automatische Tags/Kategorien
5. **Benachrichtigung** → Web-Interface oder E-Mail

## 🤖 AI-Klassifikation

### Automatische Erkennung

**Rechnungen:**
- Rechnungsnummer extrahiert
- Betrag erkannt
- Datum geparst
- Absender zugeordnet

**Verträge:**
- Vertragsnummer
- Laufzeit
- Vertragsparteien

### Benutzerdefinierte Felder

**Setup:** Admin → Benutzerdefinierte Felder

**Beispiele:**
- **Rechnungsnummer:** Text-Feld
- **Betrag:** Dezimal-Feld
- **Fälligkeitsdatum:** Datums-Feld
- **Status:** Auswahl-Feld (Offen, Bezahlt, Storniert)

## 📊 Workflows

### Automatisierung

**Dokument-Workflows:** Admin → Arbeitsabläufe

**Beispiel-Workflow:**
1. **Trigger:** Neues Dokument mit Tag "Rechnung"
2. **Aktion:** Benutzerdefinierte Felder ausfüllen
3. **Aktion:** Korrespondent zuordnen
4. **Aktion:** E-Mail-Benachrichtigung senden

### Regeln

**Automatische Regeln:**
- **Dateiname:** Automatische Metadaten-Extraktion
- **Korrespondent:** Automatische Zuordnung
- **Tags:** Automatische Schlagwort-Zuordnung

## 💾 Backup und Sync

### Nextcloud-Integration

**Automatische Backups:**
- **Originals:** Alle Original-Dateien → Nextcloud
- **Datenbank:** Tägliche PostgreSQL-Dumps
- **Konfiguration:** Settings und Workflows

**Manuelle Backups:**
```bash
# Auf Server ausführen
./backup_to_nextcloud.sh
```

### Export

**Dokumenten-Export:**
- **Einzeln:** PDF-Download
- **Batch:** ZIP-Archiv mehrerer Dokumente
- **Metadaten:** JSON-Export für Migration

## 🔧 Wartung

### Regelmäßige Aufgaben

**Wöchentlich:**
- Gespeicherte Ansichten prüfen
- Tags bereinigen
- Duplikate suchen

**Monatlich:**
- Backup-Status prüfen
- Speicherplatz überwachen
- Logs analysieren

### Performance-Optimierung

**Suchindex:**
- Automatische Neuindexierung bei Änderungen
- Manuelle Neuindexierung bei Problemen

**Speicherplatz:**
- Originals automatisch zu Nextcloud verschoben
- Thumbnails lokal für schnelle Vorschau
- Alte Backups automatisch bereinigt

## 🆘 Troubleshooting

### Häufige Probleme

**1. Dokument wird nicht durchsuchbar:**
- OCR-Status prüfen
- Neuindexierung starten
- Sprachpakete prüfen

**2. E-Mail-Import funktioniert nicht:**
- IMAP-Einstellungen prüfen
- App-Passwort erneuern
- Firewall-Regeln prüfen

**3. Upload schlägt fehl:**
- Dateiformat prüfen (PDF bevorzugt)
- Dateigröße prüfen (<100MB)
- Berechtigungen prüfen

### Support

Bei Problemen:
1. Logs prüfen: `docker compose logs -f`
2. Dokumentation konsultieren
3. GitHub Issues erstellen
