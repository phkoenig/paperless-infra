# AI Classifier Guide

Anleitung für die AI-gestützte Dokumentenklassifikation und Metadaten-Extraktion.

## 🎯 Übersicht

Das AI-System automatisiert:
- **Dokumentklassifikation:** Rechnung, Vertrag, Brief, etc.
- **Metadaten-Extraktion:** Rechnungsnummer, Betrag, Datum, Absender
- **Tag-Zuordnung:** Automatische Schlagwörter basierend auf Inhalt
- **Korrespondent-Erkennung:** Automatische Zuordnung zu Kontakten

## 🏗️ Architektur

### Komponenten

**1. invoice-ai Service:**
- Überwacht `/opt/paperless/media/documents/`
- Erkennt neue PDF-Dokumente
- Ruft OCR-Text via Paperless API ab
- Sendet an LLM für Analyse
- Aktualisiert Metadaten via API

**2. LLM-Integration:**
- OpenAI GPT-4 oder Anthropic Claude
- Strukturierte Prompt-Engineering
- JSON-Response für Metadaten
- Fallback-Mechanismen

**3. JSON-Taxonomie:**
- Firmen- und Ordnerstruktur-Mapping
- Automatische Tag-Zuordnung
- Korrespondent-Matching

## 📋 Konfiguration

### 1. JSON-Taxonomie erstellen

**Datei:** `config/categories_mapping.json`

```json
{
  "companies": {
    "ACME Corp": {
      "tags": ["finanzen", "rechnungen"],
      "correspondent": "ACME Corporation",
      "document_types": ["invoice", "contract"],
      "custom_fields": {
        "company_type": "supplier",
        "payment_terms": "30_days"
      }
    },
    "Microsoft": {
      "tags": ["software", "lizenzen"],
      "correspondent": "Microsoft Deutschland",
      "document_types": ["invoice", "license"],
      "custom_fields": {
        "company_type": "vendor",
        "category": "software"
      }
    }
  },
  "keywords": {
    "rechnung": {
      "tags": ["finanzen", "rechnungen"],
      "document_type": "invoice",
      "confidence": 0.9
    },
    "vertrag": {
      "tags": ["recht", "verträge"],
      "document_type": "contract",
      "confidence": 0.8
    }
  },
  "patterns": {
    "invoice_number": "Rechnungsnummer:\\s*([A-Z0-9-]+)",
    "amount": "Betrag:\\s*(\\d+[.,]\\d{2})\\s*€",
    "date": "(\\d{1,2}\\.\\d{1,2}\\.\\d{4})"
  }
}
```

### 2. LLM-Konfiguration

**Environment-Variablen:**
```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# Oder Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

### 3. Prompts definieren

**Strukturierte Prompts für verschiedene Dokumenttypen:**

```python
INVOICE_PROMPT = """
Analysiere das folgende Dokument und extrahiere die Metadaten:

OCR-Text: {ocr_text}

Extrahiere folgende Informationen:
1. Dokumenttyp (invoice, contract, letter, receipt)
2. Rechnungsnummer
3. Betrag (in Euro)
4. Datum
5. Absender/Unternehmen
6. Empfänger
7. Fälligkeitsdatum
8. Relevante Tags

Antworte im JSON-Format:
{
  "document_type": "invoice",
  "invoice_number": "RE-2025-001",
  "amount": 1250.00,
  "date": "2025-01-15",
  "sender": "ACME Corp",
  "recipient": "Philip König",
  "due_date": "2025-02-14",
  "tags": ["finanzen", "rechnungen", "eingang"],
  "confidence": 0.95
}
"""
```

## 🔧 Implementation

### 1. invoice-ai Service vervollständigen

**Datei:** `infra/invoice-ai/app.py`

```python
import os
import json
import time
import requests
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import openai  # oder anthropic

class DocumentProcessor(FileSystemEventHandler):
    def __init__(self):
        self.paperless_api = os.getenv('PAPERLESS_API_URL', 'http://paperless-webserver:8000')
        self.api_token = os.getenv('PAPERLESS_API_TOKEN')
        self.taxonomy = self.load_taxonomy()
        self.openai_client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY')
        )
    
    def load_taxonomy(self):
        with open('/config/categories_mapping.json', 'r') as f:
            return json.load(f)
    
    def on_created(self, event):
        if event.is_file and event.src_path.endswith('.pdf'):
            time.sleep(5)  # Warten bis OCR abgeschlossen
            self.process_document(event.src_path)
    
    def process_document(self, file_path):
        # 1. Dokument-ID via API ermitteln
        doc_id = self.get_document_id(file_path)
        if not doc_id:
            return
        
        # 2. OCR-Text abrufen
        ocr_text = self.get_ocr_text(doc_id)
        
        # 3. LLM-Analyse
        metadata = self.analyze_with_llm(ocr_text)
        
        # 4. Taxonomie-Mapping
        metadata = self.apply_taxonomy_mapping(metadata)
        
        # 5. Metadaten aktualisieren
        self.update_document_metadata(doc_id, metadata)
    
    def analyze_with_llm(self, ocr_text):
        response = self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": INVOICE_PROMPT},
                {"role": "user", "content": f"OCR-Text: {ocr_text}"}
            ],
            temperature=0.1
        )
        
        return json.loads(response.choices[0].message.content)
    
    def apply_taxonomy_mapping(self, metadata):
        # Firmen-Matching
        sender = metadata.get('sender', '')
        for company, config in self.taxonomy['companies'].items():
            if company.lower() in sender.lower():
                metadata['tags'].extend(config['tags'])
                metadata['correspondent'] = config['correspondent']
                metadata.update(config['custom_fields'])
                break
        
        return metadata
    
    def update_document_metadata(self, doc_id, metadata):
        headers = {'Authorization': f'Token {self.api_token}'}
        
        # Korrespondent aktualisieren
        if metadata.get('correspondent'):
            self.create_or_update_correspondent(metadata['correspondent'])
        
        # Dokument aktualisieren
        update_data = {
            'title': metadata.get('title'),
            'tags': metadata.get('tags', []),
            'document_type': metadata.get('document_type'),
            'custom_fields': metadata.get('custom_fields', {})
        }
        
        response = requests.patch(
            f"{self.paperless_api}/api/documents/{doc_id}/",
            json=update_data,
            headers=headers
        )
        
        if response.status_code == 200:
            print(f"✅ Document {doc_id} updated successfully")
        else:
            print(f"❌ Failed to update document {doc_id}: {response.text}")

if __name__ == "__main__":
    processor = DocumentProcessor()
    observer = Observer()
    observer.schedule(processor, '/usr/src/paperless/media/documents', recursive=True)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
```

### 2. Dockerfile aktualisieren

**Datei:** `infra/invoice-ai/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install requests openai anthropic watchdog pathlib

# Copy application
COPY app.py /app/
COPY config/ /config/

# Run application
CMD ["python", "app.py"]
```

### 3. Environment-Konfiguration

**Hinzufügen zu `infra/.env`:**

```bash
# AI Classifier
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
PAPERLESS_API_TOKEN=your-paperless-api-token

# AI Settings
AI_CONFIDENCE_THRESHOLD=0.8
AI_PROCESSING_DELAY=5
```

## 🧪 Testing

### 1. Test-Dokumente

**Test-Szenarien:**
- **Rechnung:** Standard-Rechnung mit Rechnungsnummer, Betrag, Datum
- **Vertrag:** Vertragsdokument mit Parteien und Laufzeit
- **Brief:** Standard-Korrespondenz
- **Quittung:** Einfacher Beleg

### 2. API-Testing

```bash
# Paperless API-Token erstellen
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'

# Test-Dokument hochladen
curl -X POST http://localhost:8000/api/documents/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "document=@test_invoice.pdf"
```

### 3. LLM-Testing

```python
# Test-Prompt
test_ocr = """
ACME Corporation
Rechnung
Rechnungsnummer: RE-2025-001
Datum: 15.01.2025
Betrag: 1.250,00 €
Fällig: 14.02.2025
"""

# LLM-Antwort prüfen
response = analyze_with_llm(test_ocr)
print(json.dumps(response, indent=2))
```

## 📊 Monitoring

### 1. Logs überwachen

```bash
# AI-Service Logs
docker compose logs invoice-ai -f

# Paperless Worker Logs
docker compose logs paperless-worker -f
```

### 2. Erfolgsrate messen

```python
# Metriken sammeln
{
  "total_documents": 100,
  "ai_processed": 95,
  "success_rate": 0.95,
  "average_confidence": 0.87,
  "errors": 5
}
```

### 3. Performance-Optimierung

**Bottlenecks identifizieren:**
- LLM-API-Latenz
- OCR-Verarbeitungszeit
- Taxonomie-Matching-Performance

**Optimierungen:**
- Batch-Processing für mehrere Dokumente
- Caching von Taxonomie-Matches
- Async-Processing für LLM-Calls

## 🔄 Wartung

### 1. Taxonomie-Updates

**Regelmäßige Updates:**
- Neue Firmen hinzufügen
- Keyword-Patterns verfeinern
- Confidence-Thresholds anpassen

### 2. Prompt-Optimierung

**A/B-Testing:**
- Verschiedene Prompt-Varianten testen
- Response-Qualität vergleichen
- Beste Prompts in Produktion

### 3. Model-Updates

**LLM-Model-Upgrades:**
- Neue Modelle testen
- Performance-Vergleiche
- Kosten-Nutzen-Analyse

## 🆘 Troubleshooting

### Häufige Probleme

**1. LLM-API-Fehler:**
- API-Key prüfen
- Rate-Limits beachten
- Fallback-Mechanismen implementieren

**2. Taxonomie-Matching:**
- Firmen-Namen aktualisieren
- Fuzzy-Matching implementieren
- Manual-Override-Optionen

**3. Performance-Probleme:**
- Batch-Processing aktivieren
- Caching implementieren
- Async-Processing verwenden

### Debug-Modus

```python
# Debug-Logging aktivieren
import logging
logging.basicConfig(level=logging.DEBUG)

# Zwischenergebnisse loggen
print(f"OCR Text: {ocr_text[:200]}...")
print(f"LLM Response: {response}")
print(f"Final Metadata: {metadata}")
```
