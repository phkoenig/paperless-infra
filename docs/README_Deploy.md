# Paperless-NGX Deployment Guide

Vollständige Anleitung für das Deployment von Paperless-NGX auf Hetzner Cloud.

## 📋 Voraussetzungen

- Hetzner Cloud Account
- Domain (z.B. megabrain.cloud)
- Google Workspace Account (für E-Mail)
- Nextcloud Account (für Speicher)

## 🖥️ Server Setup

### 1. Hetzner Cloud Server erstellen

```bash
# Hetzner CLI installieren (optional)
curl -fsSL https://cli.hetzner.com/install.sh | sh

# Server erstellen
hcloud server create \
  --name paperless-archive \
  --type cx32 \
  --image ubuntu-24.04 \
  --location fsn1 \
  --ssh-key id_ed25519 \
  --user-data-from-file cloud-init.yaml
```

**Manuelle Alternative:**
1. [Hetzner Cloud Console](https://console.hetzner-cloud.com) öffnen
2. "New Project" → "Add Server"
3. **Type:** CX32 (8 GB RAM, 160 GB SSD)
4. **Image:** Ubuntu 24.04
5. **Location:** fsn1 (Falkenstein)
6. **SSH Key:** Upload deinen public key
7. **User Data:** Inhalt von `cloud-init.yaml` einfügen

### 2. Firewall konfigurieren

```bash
# Firewall erstellen
hcloud firewall create \
  --name paperless-fw \
  --rule direction=in,source-ips=0.0.0.0/0,protocol=tcp,port=22 \
  --rule direction=in,source-ips=0.0.0.0/0,protocol=tcp,port=80 \
  --rule direction=in,source-ips=0.0.0.0/0,protocol=tcp,port=443

# Firewall zuordnen
hcloud server add-label paperless-archive firewall=paperless-fw
```

### 3. DNS konfigurieren

**IONOS DNS:**
1. A-Record erstellen: `archive.megabrain.cloud` → Server-IP
2. Optional: CNAME `www.archive.megabrain.cloud` → `archive.megabrain.cloud`

## 🔧 Deployment

### 1. Repository clonen

```bash
# SSH-Login zum Server
ssh ubuntu@YOUR_SERVER_IP

# Repository clonen
git clone https://github.com/phkoenig/paperless-infra.git
cd paperless-infra/infra
```

### 2. Environment konfigurieren

```bash
# Environment-Template kopieren
cp paperless.env.example .env

# .env bearbeiten
nano .env
```

**Wichtige Variablen:**
```bash
# Paperless
PAPERLESS_URL=https://archive.megabrain.cloud
PAPERLESS_ALLOWED_HOSTS=archive.megabrain.cloud,www.archive.megabrain.cloud,YOUR_SERVER_IP

# Database
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE

# Mail (Google Workspace)
PAPERLESS_MAIL_USER=philip@zepta.com
PAPERLESS_MAIL_PASSWORD=YOUR_APP_PASSWORD
```

### 3. Verzeichnisse erstellen

```bash
# Paperless-Verzeichnisse
sudo mkdir -p /opt/paperless/{data,media,consume,export,db,backups}

# Berechtigungen setzen
sudo chown -R 1000:1000 /opt/paperless
```

### 4. Stack starten

```bash
# Alle Services starten
docker compose up -d

# Logs prüfen
docker compose logs -f
```

## 🔐 TLS aktivieren

### 1. Caddyfile auf TLS umstellen

```bash
# Caddyfile bearbeiten
nano caddy/Caddyfile
```

**Neue Konfiguration:**
```caddy
{
	auto_https on
}

archive.megabrain.cloud, www.archive.megabrain.cloud {
	encode gzip
	reverse_proxy paperless-webserver:8000
}
```

### 2. Caddy neu starten

```bash
docker compose restart caddy
```

**Let's Encrypt Zertifikat wird automatisch erstellt!**

## 🧪 Testing

### 1. Web-Interface testen

```bash
# HTTP (temporär)
curl -I http://YOUR_SERVER_IP

# HTTPS (nach DNS-Propagation)
curl -I https://archive.megabrain.cloud
```

### 2. Paperless konfigurieren

1. **Web-UI öffnen:** https://archive.megabrain.cloud
2. **Superuser erstellen:**
   ```bash
   docker compose exec paperless-webserver python manage.py createsuperuser
   ```
3. **E-Mail-Konto konfigurieren:** Admin → E-Mail
4. **Test-Dokument hochladen**

### 3. Services prüfen

```bash
# Alle Container-Status
docker compose ps

# Spezifische Logs
docker compose logs paperless-webserver
docker compose logs paperless-worker
docker compose logs caddy
```

## 🔧 Troubleshooting

### Häufige Probleme

**1. 400 Bad Request:**
```bash
# ALLOWED_HOSTS prüfen
grep PAPERLESS_ALLOWED_HOSTS .env
# Server-IP hinzufügen falls fehlt
```

**2. IMAP-Verbindung fehlgeschlagen:**
```bash
# App-Passwort prüfen
# 2FA aktiviert?
# IMAP in Gmail aktiviert?
```

**3. TLS-Zertifikat fehlt:**
```bash
# DNS-Propagation warten (bis zu 24h)
# Caddy-Logs prüfen
docker compose logs caddy
```

### Logs analysieren

```bash
# Alle Logs
docker compose logs -f

# Spezifische Services
docker compose logs paperless-worker --tail 50
docker compose logs caddy --tail 20

# System-Logs
journalctl -u docker -f
```

## 🔄 Updates

```bash
# Repository aktualisieren
git pull origin master

# Stack neu starten
docker compose down
docker compose up -d

# Logs prüfen
docker compose logs -f
```

## 📊 Monitoring

### Ressourcen-Überwachung

```bash
# Speicherplatz
df -h

# RAM-Nutzung
free -h

# Container-Status
docker stats
```

### Backup-Status

```bash
# Nextcloud-Sync prüfen
ls -la /opt/paperless/backups/

# Logs der Backup-Services
docker compose logs rclone-backup
```

## 🆘 Support

Bei Problemen:
1. Logs prüfen (`docker compose logs -f`)
2. GitHub Issues erstellen
3. Dokumentation in `docs/` konsultieren
