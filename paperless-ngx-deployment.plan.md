<!-- 83dff100-726b-449f-963b-636f59a09727 7dfaf6b8-9402-4018-9602-43b5c796ea4e -->
# Paperless-NGX Deployment auf Hetzner

## Projektziel

Vollautomatische papierlose Dokumentenverwaltung mit Paperless-NGX. E-Mails (inkl. Body als PDF), Anhänge und Nextcloud-Dokumente werden automatisch importiert, via OCR durchsuchbar gemacht und durch AI kategorisiert.

## Technischer Stack (bereits implementiert)

- Paperless-NGX (Web + Worker)
- PostgreSQL 16 (lokal)
- Redis 7
- Gotenberg 8 (Office/HTML zu PDF)
- Caddy 2 (Reverse Proxy + TLS)
- Rclone (Nextcloud Sync)
- 2 Custom Sidecars: eml2pdf, invoice-ai

## Infrastruktur

- Hetzner Cloud CX32 (8 GB RAM, Ubuntu 24.04)
- Domain: archive.megabrain.cloud
- Nextcloud: hub.zepta.com (WebDAV Ingest + Backup)
- E-Mail: archive@megabrain.cloud (Google Workspace IMAP)

## Speicherstrategie (Hybrid-Architektur)

### Hot Storage (Hetzner Server - SSD):
- `/opt/paperless/media/documents/archive/` - Verarbeitete PDFs (für schnelle Suche)
- `/opt/paperless/media/documents/thumbnails/` - Vorschau-Bilder
- `/opt/paperless/data/` - Indizes, Cache, temporäre Daten

### Cold Storage (Nextcloud - HDD):
- `Paperless/originals/` - Alle Original-Dateien (nach Verarbeitung)
- `Paperless/backups/` - Datenbank-Backups (täglich)
- `Paperless/archive/` - Langzeitarchiv (optional, nach 1 Jahr)

### Kostenoptimierung:
- **Aktuell:** 160GB SSD (~€50/Monat)
- **Mit 1TB Archiv:** +€5-10/Monat (Nextcloud) statt +€300/Monat (Hetzner SSD)
- **Ersparnis:** ~€240/Monat bei 1TB Archiv

## Status: Was bereits existiert

Code in infra/:

- `docker-compose.yml`: Core-Stack (Caddy, Postgres, Redis, Gotenberg, Paperless web/worker, rclone-ingest, rclone-backup) - 129 Zeilen
- `paperless.env.example`: Environment-Template mit Platzhaltern für Secrets
- `caddy/Caddyfile`: Reverse Proxy (noch HTTP-only, TLS wartet auf DNS)
- `rclone/rclone.conf`: WebDAV-Configs für hub.zepta.com (Ingest + Backup)
- `rclone/ingest.cron`: Alle 5 Min Nextcloud INBOX → consume/nextcloud
- `rclone/backup.cron`: Stündlich media → Nextcloud + täglich DB-Backup
- `eml2pdf/Dockerfile` + `app.py`: Watchdog für .eml → PDF via Gotenberg
- `invoice-ai/Dockerfile` + `app.py`: Skeleton für AI-Metadaten-Extraktion

Git-Repo: phkoenig/paperless-infra (bereits gepusht)

## Was noch fehlt

### 1. Server Provisioning (Hetzner)

- CX32 Server erstellen (Ubuntu 24.04, fsn1/nbg1)
- Firewall: 22, 80, 443 inbound
- SSH-Key: id_ed25519 (lokal bereits generiert)
- Docker + Docker Compose installieren
- Verzeichnisse anlegen: /opt/paperless/{data,media,consume,export,db,backups}

Wahl: hcloud CLI oder Web-Console

### 2. DNS & TLS aktivieren

- IONOS A-Record: archive.megabrain.cloud → Server-IP
- Optional AAAA + CNAME www.archive.megabrain.cloud
- `infra/caddy/Caddyfile` umstellen von :80 auf TLS-Hosts
- Caddy neu starten → Let's Encrypt Zertifikat

### 3. Sidecars in docker-compose integrieren

- `eml2pdf` Service hinzufügen (build context, volumes, depends_on gotenberg)
- `invoice-ai` Service hinzufügen (build context, volumes, env PAPERLESS_API)
- `rclone-backup` Service hinzufügen (analog zu rclone-ingest mit backup.cron)

### 4. Secrets & Credentials konfigurieren

- Google Workspace: App-Passwort für philip@zepta.com und office@zepta.com erstellen (2FA + App-Passwort)
- Nextcloud: Admin-Login für WebDAV (philip@zepta.com + Passwort) - App-Passwort hatte Probleme
- `infra/.env` erstellen (aus .env.example) und ausfüllen:
- POSTGRES_PASSWORD
- PAPERLESS_MAIL_PASSWORD (philip@zepta.com)
- Rclone-Config: Nextcloud-Admin-User + Passwort

### 5. AI-Klassifikation & Taxonomie

- JSON-Taxonomie erstellen: config/categories_mapping.json (Firmen, Ordnerstruktur, Tags)
- `invoice-ai/app.py` vervollständigen:
- OCR-Text via Paperless API abrufen
- LLM-Call (OpenAI/Anthropic) für Metadaten-Extraktion (Rechnungsnr, Datum, Betrag, Absender)
- Paperless API: Dokument-Metadaten updaten (correspondent, document_type, tags, custom_fields)
- JSON-Mapping für Auto-Kategorisierung nutzen

### 6. Deployment & Testing

- Repo auf Server clonen
- .env ausfüllen
- docker compose up -d
- Logs prüfen: docker compose logs -f
- Web-UI testen: https://archive.megabrain.cloud
- Superuser anlegen: docker compose exec paperless-webserver python manage.py createsuperuser
- Test-Dokument in consume/ legen, OCR + Indexierung prüfen
- IMAP-Import testen (E-Mail an archive@megabrain.cloud senden)

### 7. Dokumentation

- docs/README_Deploy.md: Server-Setup, DNS, Secrets, Stack-Start
- docs/README_Usage.md: Paperless Web-UI, Workflows, Regeln, Tags
- docs/README_AI_Classifier.md: JSON-Taxonomie-Format, AI-Prompts, Custom Fields

### 8. Phase 2 (optional, später)

- Google Contacts Sync: People API, Korrespondenten wöchentlich synchronisieren
- Monitoring: Uptime-Check, Log-Aggregation
- Offsite-Backup: Zusätzlich zu Nextcloud z. B. Backblaze B2

## Implementierungs-Reihenfolge

1. provision-server: Hetzner CX32 erstellen, SSH-Login, Docker installieren
2. configure-dns: A-Record setzen, TLS in Caddyfile aktivieren
3. integrate-sidecars: eml2pdf, invoice-ai, rclone-backup in docker-compose.yml
4. setup-secrets: Google/Nextcloud App-Passwörter, .env ausfüllen
5. deploy-stack: Repo clonen, docker compose up -d, Logs prüfen
6. configure-paperless: Superuser, Document Types, Tags, Workflows
7. implement-ai: JSON-Taxonomie, invoice-ai vervollständigen, LLM-Integration
8. test-workflows: Dokument-Ingest (Nextcloud, E-Mail, manuell), OCR, AI-Klassifikation
9. write-docs: Deploy-Guide, Usage-Guide, AI-Classifier-Guide

## Wichtige Dateien & Pfade

- `infra/docker-compose.yml`: Haupt-Stack-Definition
- `infra/.env`: Secrets (git-ignored, aus .env.example erstellen)
- `infra/caddy/Caddyfile`: Reverse Proxy + TLS
- `infra/rclone/rclone.conf`: Nextcloud WebDAV
- `infra/eml2pdf/app.py`: E-Mail-Body → PDF Konverter
- `infra/invoice-ai/app.py`: AI-Metadaten-Extraktion
- `config/categories_mapping.json`: Firmen/Ordner/Tag-Taxonomie (noch zu erstellen)
- `/opt/paperless/consume/`: Auto-Import-Verzeichnis auf Server
- `/opt/paperless/media/`: Dokument-Storage auf Server

## Offene Inputs vom User

1. JSON-Taxonomie: Firmen, Ordnerstruktur, Tags für AI-Klassifikation
2. Nextcloud WebDAV-User: Username + App-Passwort für hub.zepta.com
3. Server-Wahl: hcloud CLI (API-Token) oder Web-Console (manuell)?

### To-dos

- [ ] Hetzner CX32 Server erstellen, SSH-Login einrichten, Docker installieren, Verzeichnisstruktur anlegen
- [ ] A-Record bei IONOS setzen, Caddyfile auf TLS-Hosts umstellen
- [ ] eml2pdf, invoice-ai und rclone-backup Services in docker-compose.yml integrieren
- [ ] Google Workspace App-Passwort, Nextcloud WebDAV Credentials, infra/.env ausfüllen
- [ ] Repo auf Server clonen, docker compose up -d, Logs prüfen
- [ ] Superuser anlegen, Document Types/Tags/Workflows in Web-UI einrichten
- [ ] JSON-Taxonomie erstellen, invoice-ai/app.py vervollständigen mit LLM-Integration
- [ ] End-to-End Tests: Nextcloud-Ingest, E-Mail-Import, OCR, AI-Klassifikation
- [ ] Deploy-Guide, Usage-Guide und AI-Classifier-Guide in docs/ erstellen