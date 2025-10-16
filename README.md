# Paperless-NGX Deployment

Vollautomatische papierlose Dokumentenverwaltung mit Paperless-NGX auf Hetzner Cloud.

## 🎯 Features

- **Dokumentenmanagement:** Automatischer Import, OCR, Suchfunktion
- **E-Mail-Integration:** IMAP-Import von philip@zepta.com und office@zepta.com
- **Nextcloud-Sync:** Hybrid-Speicherstrategie (Hot SSD + Cold HDD)
- **AI-Klassifikation:** Automatische Kategorisierung und Metadaten-Extraktion
- **Multi-Language OCR:** Deutsch, Englisch, Französisch, Spanisch

## 🏗️ Architektur

### Hot Storage (Hetzner Server - SSD):
- Verarbeitete PDFs für schnelle Suche
- Thumbnails und Indizes
- Cache und temporäre Daten

### Cold Storage (Nextcloud - HDD):
- Original-Dateien (nach Verarbeitung)
- Datenbank-Backups
- Langzeitarchiv

## 🚀 Quick Start

1. **Server Setup:**
   ```bash
   # Hetzner CX32 Server erstellen
   hcloud server create --name paperless-archive --type cx32 --image ubuntu-24.04 --location fsn1 --ssh-key id_ed25519
   ```

2. **Deployment:**
   ```bash
   # Repository clonen
   git clone https://github.com/phkoenig/paperless-infra.git
   cd paperless-infra/infra
   
   # Environment konfigurieren
   cp paperless.env.example .env
   # .env mit Secrets ausfüllen
   
   # Stack starten
   docker compose up -d
   ```

3. **Access:**
   - Web-UI: http://91.98.40.206
   - Domain: https://archive.megabrain.cloud (nach DNS-Setup)

## 📁 Projektstruktur

```
paperless/
├── infra/                           # Docker Compose Stack
│   ├── docker-compose.yml          # Haupt-Stack-Definition
│   ├── paperless.env.example       # Environment-Template
│   ├── caddy/Caddyfile             # Reverse Proxy + TLS
│   ├── eml2pdf/                    # E-Mail zu PDF Konverter
│   ├── invoice-ai/                 # AI-Metadaten-Extraktion
│   └── rclone/                     # Nextcloud-Sync Config
│
├── scripts/                         # Automation Scripts
│   └── master-gmail-to-paperless/  # Google Apps Script (v3)
│
├── config/                          # Configuration Files
│   └── categories_mapping.json     # AI Taxonomy
│
├── docs/                            # Dokumentation
│   ├── README_Deploy.md            # Deployment Guide
│   ├── README_Usage.md             # User Guide
│   ├── README_AI_Classifier.md     # AI Integration
│   └── README_Email_Integration.md # Email Workflow
│
├── tests/                           # Test Scripts & Fixtures
├── examples/                        # Code Examples
├── archive/                         # Old/Deprecated Files
├── temp/                            # Temporary Files (gitignored)
│
├── README.md                        # This file
├── GOOGLE_ACCOUNTS_SETUP.md        # Google Accounts Documentation
├── SSH_ACCESS.md                   # SSH Access Guide
├── DEPLOYMENT_STATUS.md            # Current Status
├── cloud-init.yaml                 # Server Provisioning
└── .gitignore                      # Git Ignore Rules
```

## 🔧 Services

- **Paperless-NGX:** Dokumentenmanagement
- **PostgreSQL:** Datenbank
- **Redis:** Task-Queue
- **Gotenberg:** PDF-Konvertierung
- **Caddy:** Reverse Proxy + TLS
- **rclone:** Nextcloud-Sync

## 📚 Dokumentation

### **Setup & Deployment:**
- [Deploy Guide](docs/README_Deploy.md) - Server-Setup und Deployment
- [SSH Access](SSH_ACCESS.md) - SSH-Zugang und Konfiguration
- [Google Accounts Setup](GOOGLE_ACCOUNTS_SETUP.md) - Beide Google Accounts Integration

### **Features & Usage:**
- [Usage Guide](docs/README_Usage.md) - Paperless Web-UI und Workflows
- [Email Integration](docs/README_Email_Integration.md) - E-Mail-Workflow
- [AI Classifier Guide](docs/README_AI_Classifier.md) - AI-Integration

### **Status & Planung:**
- [Deployment Status](DEPLOYMENT_STATUS.md) - Aktueller Stand
- [Project Plan](paperless-ngx-deployment.plan.md) - Projektplan

## 💰 Kostenoptimierung

- **Aktuell:** 160GB SSD (~€50/Monat)
- **Mit 1TB Archiv:** +€5-10/Monat (Nextcloud) statt +€300/Monat (Hetzner SSD)
- **Ersparnis:** ~€240/Monat bei 1TB Archiv

## 🔐 Security

- TLS-Zertifikate via Let's Encrypt
- SSH-Key-Authentication
- Docker-Container-Isolation
- Secrets in .env (git-ignored)

## 📞 Support

Bei Problemen oder Fragen:
1. Logs prüfen: `docker compose logs -f`
2. Dokumentation in `docs/` lesen
3. Issues im GitHub-Repository erstellen
