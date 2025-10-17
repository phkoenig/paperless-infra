# Paperless-NGX Deployment

Vollautomatische papierlose Dokumentenverwaltung mit Paperless-NGX auf Hetzner Cloud.

## 🎯 Features

- **Dokumentenmanagement:** Automatischer Import, OCR, Volltext-Suche
- **E-Mail-Integration:** Apps Script v4.2 + eml2pdf für philip@zepta.com und phkoenig@gmail.com
- **Intelligenter Filter:** Supabase Whitelist/Blacklist + KI-Bewertung (Google Gemini)
- **Duplikaterkennung:** 3-Ebenen (Apps Script, eml2pdf, Paperless Content-Hash)
- **MCP Administration:** Paperless-Verwaltung via Cursor AI (kein SSH nötig!)
- **Multi-Language OCR:** Deutsch, Englisch, Französisch, Spanisch
- **Nextcloud-Sync:** Hybrid-Speicherstrategie (Hot SSD + Cold HDD)

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
├── README.md                        # ⭐ Hauptdokumentation
├── .cursorrules                     # 🆕 Cursor AI Regeln
├── .gitignore                       # Git Ignore Rules
│
├── infra/                           # 🏗️ Infrastruktur & Docker Stack
│   ├── docker-compose.yml          # Haupt-Stack-Definition
│   ├── cloud-init.yaml             # Server Provisioning
│   ├── paperless.env.example       # Environment-Template
│   ├── caddy/Caddyfile             # Reverse Proxy + TLS
│   ├── eml2pdf/                    # E-Mail zu PDF Konverter
│   ├── invoice-ai/                 # AI-Metadaten-Extraktion
│   └── rclone/                     # Nextcloud-Sync Config
│
├── scripts/                         # 🔧 Automation Scripts
│   ├── master-gmail-to-paperless/  # MASTER: Google Apps Script (v4.2)
│   ├── paperless-mcp/              # MCP Server (Python)
│   ├── paperless-mcp-nloui/        # MCP Server (TypeScript)
│   └── paperless-cli/              # CLI Tools
│
├── config/                          # ⚙️ Configuration Files
│   └── categories_mapping.json     # AI Taxonomy
│
├── docs/                            # 📚 Komplette Dokumentation
│   ├── README.md                   # 🗺️ Dokumentations-Navigation
│   ├── setup/                      # Setup & Konfiguration
│   ├── architecture/               # Architektur & Workflow
│   ├── development/                # Entwicklung & Administration
│   └── planning/                   # Planung & Status
│
├── onboarding/                      # 🚀 Onboarding & Startup-Prompts
├── ideas/                           # 💡 Ideen & Future Work
├── tests/                           # 🧪 Test Scripts & Fixtures
├── examples/                        # 📝 Code Examples
├── archive/                         # 📦 Old/Deprecated Files
└── temp/                            # 🗂️ Temporary Files (gitignored)
```

## 🔧 Services

- **Paperless-NGX:** Dokumentenmanagement
- **PostgreSQL:** Datenbank
- **Redis:** Task-Queue
- **Gotenberg:** PDF-Konvertierung
- **Caddy:** Reverse Proxy + TLS
- **rclone:** Nextcloud-Sync

## 📚 Dokumentation

> **🗺️ [Vollständige Dokumentations-Navigation](docs/README.md)** - Alle Docs übersichtlich strukturiert!

### **🚀 Neu hier? Start hier:**
- **[onboarding/START_HERE.md](onboarding/START_HERE.md)** - Umfassender Onboarding-Prompt für neue Cursor AI Sessions
- **[onboarding/QUICK_START.md](onboarding/QUICK_START.md)** - Kurze Version für schnelle Sessions

### **Setup & Deployment:**
- [Deploy Guide](docs/setup/README_Deploy.md) - Server-Setup und Deployment
- [SSH Access](docs/setup/SSH_ACCESS.md) - SSH-Zugang und Konfiguration
- [Google Accounts Setup](docs/setup/GOOGLE_ACCOUNTS_SETUP.md) - Beide Google Accounts Integration

### **Architektur & Workflow:**
- **[Kompletter Workflow v4.2](docs/architecture/README_Complete_Workflow.md)** ⭐ - Gmail → .eml → Paperless
- **[Duplikaterkennung](docs/architecture/README_Deduplication.md)** - 3-Ebenen Deduplication
- **[Galaxy System](docs/architecture/README_GALAXY_SYSTEM_KI_NAVIGATION.md)** 🚧 - KI-Navigation (geplant)

### **Entwicklung & Administration:**
- **[MCP Administration](docs/development/README_MCP_Administration.md)** - 🆕 Paperless via MCP (empfohlen!)
- [Email Filter](docs/development/README_Email_Filter.md) - Intelligenter Filter mit Supabase & KI
- [Usage Guide](docs/development/README_Usage.md) - Paperless Web-UI und Workflows

### **Planung & Status:**
- [Deployment Status](docs/planning/DEPLOYMENT_STATUS.md) - Aktueller Stand
- [Deployment Plan](docs/planning/paperless-ngx-deployment.plan.md) - Infrastruktur-Konzept
- [Reset Log](docs/planning/RESET_LOG.md) - System-Änderungen

### **⚠️ Wichtig:**
- **✅ Verwende Paperless MCP** für alle Paperless-Operationen (in Cursor AI integriert)
- **❌ SSH-Zugriff** nur für Server-Wartung, NICHT für Paperless-Administration!

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
