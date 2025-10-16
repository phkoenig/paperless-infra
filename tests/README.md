# 🧪 Tests

Dieser Ordner ist für Test-Skripte und Test-Daten reserviert.

## 📋 Struktur

```
tests/
├── README.md              # Diese Datei
├── unit/                  # Unit Tests (wenn benötigt)
├── integration/           # Integration Tests (wenn benötigt)
└── fixtures/              # Test-Daten und Fixtures
```

## 🎯 Verwendung

- Unit Tests für einzelne Komponenten
- Integration Tests für End-to-End Workflows
- Test-Fixtures (Mock-Daten, Test-PDFs, etc.)

## 🚀 Beispiele

### **Test-Skript für rclone:**
```bash
# tests/test_rclone_sync.sh
#!/bin/bash
rclone copy test-file.pdf gdrive-philip:Paperless-Attachments/test/
```

### **Test für Paperless Consumer:**
```bash
# tests/test_consumer.sh
#!/bin/bash
docker compose -f infra/docker-compose.yml exec paperless-consumer \
  python manage.py document_consumer --dry-run
```

## 📝 Hinweise

- Verwende keine echten Produktions-Daten in Tests
- Mock-Daten nur in diesem Ordner
- Test-Skripte sollten idempotent sein

