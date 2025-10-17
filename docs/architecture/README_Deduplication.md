# 🔍 Duplikaterk

ennung & Message-IDs

## 🎯 Übersicht

Das Paperless-System nutzt mehrere Mechanismen zur Verhinderung von Duplikaten auf verschiedenen Ebenen:

1. **Google Apps Script**: Ordner-basierte Duplikaterkennung
2. **Metadata-JSON**: Message-ID + SHA-256 Hashes für Referenz
3. **Paperless**: Native Duplikaterkennung via Content-Hash

---

## 📧 Message-ID & Thread-ID (RFC 2822)

### RFC Message-ID
**Was ist das?**
- Weltweit eindeutige ID für jede E-Mail (RFC 2822 Standard)
- Format: `<unique-string@domain.com>`
- Wird vom absendenden Mail-Server generiert
- Bleibt über alle Systeme hinweg gleich

**Implementierung (Code.js Zeile 673-691):**
```javascript
function extractRFCMessageID(message) {
  const rawContent = message.getRawContent();
  const messageIdMatch = rawContent.match(/^Message-ID:\s*<(.+?)>/im);
  
  if (messageIdMatch && messageIdMatch[1]) {
    return messageIdMatch[1];  // ← RFC Message-ID
  }
  
  // Fallback: Gmail-interne ID
  return 'gmail-' + message.getId();
}
```

**In Metadata gespeichert:**
```json
{
  "messageId": "CABtSZ6Y1234567890@mail.gmail.com",
  "messageIdType": "rfc2822",
  "gmailDirectLink": "https://mail.google.com/mail/u/0/#search/rfc822msgid%3ACAB..."
}
```

### Gmail Thread-ID
**Was ist das?**
- Gmail-interne ID für E-Mail-Konversationen
- Mehrere E-Mails in einem Thread haben gleiche Thread-ID
- Nur in Gmail gültig

**In Metadata gespeichert:**
```json
{
  "gmailThreadId": "18b9c2a1234abcde",
  "gmailDeepLink": "https://mail.google.com/mail/u/0/#inbox/18b9c2a1234abcde"
}
```

---

## 🔐 SHA-256 Hashes für Anhänge

### Zweck
- **Duplikaterkennung**: Gleicher Hash = gleiches File
- **Integrität**: Prüfung ob Datei korrekt übertragen wurde
- **Referenz**: Für spätere AI-gestützte Metadaten-Extraktion

### Implementierung (Code.js Zeile 696-729)
```javascript
function calculateSHA256(blob) {
  const bytes = blob.getBytes();
  const hashBytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, 
    bytes
  );
  
  // Konvertiere zu Hex-String
  return hashBytes.map(function(byte) {
    const hex = (byte & 0xFF).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function createAttachmentMetadata(attachment) {
  const sha256 = calculateSHA256(attachment);
  
  return {
    name: attachment.getName(),
    size: attachment.getSize(),
    type: attachment.getContentType(),
    sha256: sha256,
    hash_algorithm: 'SHA-256'
  };
}
```

### In Metadata gespeichert
```json
{
  "attachments": [
    {
      "name": "Rechnung_2025.pdf",
      "size": 524288,
      "type": "application/pdf",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "hash_algorithm": "SHA-256"
    }
  ]
}
```

---

## 🛡️ Duplikaterk

ennung auf verschiedenen Ebenen

### 1. Google Apps Script (Ordner-basiert)

**Mechanismus:**
```javascript
// Ordner-ID aus Timestamp + Sender + Subject
const timestamp = Utilities.formatDate(date, 'GMT+1', 'yyyy-MM-dd_HH-mm-ss');
const fromShort = cleanString(from.split('<')[0].trim()).substring(0, 20);
const subjectShort = cleanString(subject).substring(0, 30);
const emailFolderId = `${timestamp}_${fromShort}_${subjectShort}`;

// Prüfen ob Ordner bereits existiert
if (folderExists(emailsRootFolder, emailFolderId)) {
  console.log(`⏭️ Ordner bereits vorhanden: ${emailFolderId}`);
  return;  // ← Wird NICHT nochmal exportiert
}
```

**Vorteil:**
- ✅ Schnell (keine Hash-Berechnung nötig)
- ✅ Verhindert Re-Export bei Script-Fehler

**Nachteil:**
- ⚠️ Identische E-Mails zu verschiedenen Zeiten werden als unterschiedlich erkannt
- ⚠️ Nur auf Google Drive Ebene

### 2. Paperless (Content-basiert)

**Mechanismus:**
- Paperless berechnet Content-Hash für jedes Dokument
- Bei Import wird geprüft ob Hash bereits existiert
- Falls ja: Dokument wird übersprungen (silently)

**Verhalten:**
```
1. PDF wird im consume Ordner gefunden
2. Paperless berechnet Hash (SHA-256 des Inhalts)
3. Vergleich mit existierenden Dokumenten
4. Falls identisch: Überspringen (kein Fehler!)
5. Datei bleibt im consume Ordner ODER wird gelöscht (je nach Config)
```

**In Logs:**
- Paperless loggt KEINE expliziten Duplikat-Meldungen
- Import wird einfach übersprungen
- Daher: "Fehlgeschlagene Importe" sind oft erfolgreiche Duplikaterkennungen!

### 3. Metadata-JSON (Referenz-basiert)

**Zweck:**
- Nicht für automatische Duplikaterkennung
- Für manuelles Debugging
- Für spätere AI-gestützte Analysen
- Für Rückverfolgbarkeit zu Original-E-Mail

**Nutzung:**
```bash
# SHA-256 eines Attachments finden
cat email-metadata.json | jq '.attachments[].sha256'

# Message-ID für Suche in Gmail
cat email-metadata.json | jq -r '.gmailDirectLink'
```

---

## 📊 Workflow

### Szenario: E-Mail wird zweimal exportiert

```
1. Google Apps Script (Export #1)
   ├─ Ordner: 2025-10-17_10-30-45_John_Rechnung/
   ├─ Erstellt: email.eml, metadata.json
   └─ ✅ Erfolgreich exportiert

2. Google Apps Script (Export #2 - z.B. nach Script-Restart)
   ├─ Prüft: folderExists('2025-10-17_10-30-45_John_Rechnung')
   ├─ Ergebnis: true
   └─ ⏭️ Überspringt Export (kein Duplikat)

3. rclone sync (nur falls #1 erfolgreich war)
   ├─ Kopiert zu Server: /opt/paperless/consume/emails/...
   └─ ✅ Einmal synchronisiert

4. eml2pdf (nur falls noch nicht konvertiert)
   ├─ Prüft: PDF exists?
   ├─ Falls nein: Konvertiert .eml → PDF
   └─ Falls ja: ⏭️ Überspringt (bereits konvertiert)

5. Paperless Consumer
   ├─ Findet: 2025-10-17_10-30-45_John_Rechnung.pdf
   ├─ Berechnet: Content-Hash
   ├─ Prüft: Hash in Datenbank?
   ├─ Falls nein: ✅ Import + OCR
   └─ Falls ja: ⏭️ Überspringt (Duplikat)
```

---

## 🔍 Debugging: Ist ein Import fehlgeschlagen?

### "Fehlgeschlagene Importe" sind oft Duplikate!

**Prüfen mit MCP:**
```javascript
// Dokument mit Titel suchen
const docs = await mcp_paperless_list_documents({
  search: "2025-10-17_10-30-45_John_Rechnung",
  page_size: 10
});

// Falls gefunden: War kein Fehler, sondern Duplikat!
console.log(docs.results.length > 0 ? "✅ Duplikat" : "❌ Echter Fehler");
```

**Prüfen via SSH (alt):**
```bash
# Dokument in Paperless suchen
ssh paperless
docker compose exec paperless-webserver python manage.py shell

from documents.models import Document
doc = Document.objects.filter(title__icontains="2025-10-17_10-30-45").first()
print(f"Gefunden: {doc.title if doc else 'Nicht gefunden'}")
```

---

## 💡 Best Practices

### Für Entwickler
1. **Nutze Message-ID** für eindeutige Referenzen
2. **Nutze SHA-256** für Attachment-Vergleiche
3. **Prüfe metadata.json** bei Debugging
4. **Verwende MCP** statt SSH für Abfragen

### Für Wartung
1. "Fehlgeschlagene Importe" sind meist Duplikate (kein Fehler!)
2. Paperless loggt Duplikate nicht explizit
3. Ordner-Namen sind bereits Duplikatschutz
4. Bei Problemen: Metadata-JSON anschauen

---

## 📚 Referenzen

- **Code**: `scripts/master-gmail-to-paperless/Code.js`
- **Message-ID Extraktion**: Zeile 673-691
- **SHA-256 Berechnung**: Zeile 696-729
- **Duplikatprüfung**: Zeile 293, 169
- **RFC 2822**: https://www.rfc-editor.org/rfc/rfc2822#section-3.6.4

---

**Status:** Implementiert in v4.1, dokumentiert 17.10.2025

