# 🔐 SSH-Zugang zum Hetzner Paperless-NGX Server

## 📋 Server-Details

### **Hetzner Cloud Server (CX32)**
- **IP-Adresse:** `91.98.40.206`
- **Domain:** `archive.megabrain.cloud`
- **OS:** Ubuntu 24.04 LTS
- **RAM:** 8 GB
- **Storage:** 160 GB SSD
- **Region:** Falkenstein (Deutschland)

---

## 🔑 SSH-Zugang

### **Standard SSH-Login:**
```bash
ssh ubuntu@91.98.40.206
```

### **Alternative über Domain:**
```bash
ssh ubuntu@archive.megabrain.cloud
```

---

## ✅ **SSH-Key Authentication AKTIVIERT**

### **Status:** ✅ **Eingerichtet am 16.10.2025**

**SSH-Key Details:**
- **Typ:** `ssh-ed25519` (Modern & Sicher)
- **Lokaler Key:** `~/.ssh/id_ed25519`
- **Public Key auf Server:** `~/.ssh/authorized_keys`
- **Passwortloser Login:** ✅ Funktioniert

### **✨ Vorteile:**
- ✅ **Sicherer** als Passwort-basiert
- ✅ **Keine Passwort-Eingabe** mehr nötig
- ✅ **Automatisierung** möglich (Scripts, CI/CD)
- ✅ **Best Practice** für Server-Management

### **📝 SSH-Config erstellt:**
Die Datei `~/.ssh/config` wurde erstellt mit Alias "paperless"

**Du kannst jetzt einfach verbinden mit:**
```bash
ssh paperless
```

Statt:
```bash
ssh ubuntu@91.98.40.206
```

---

## 🛠️ **Wichtige Server-Befehle**

### **Docker Stack verwalten:**
```bash
# Stack Status prüfen
cd /opt/paperless
docker compose -f infra/docker-compose.yml ps

# Logs anschauen
docker compose -f infra/docker-compose.yml logs -f

# Services neustarten
docker compose -f infra/docker-compose.yml restart

# Stack komplett neustarten
docker compose -f infra/docker-compose.yml down
docker compose -f infra/docker-compose.yml up -d
```

### **Paperless-spezifische Befehle:**
```bash
# Consumer Logs (Import-Fehler debuggen)
docker compose -f infra/docker-compose.yml logs paperless-consumer -f

# rclone Sync Logs (Google Drive Accounts)
docker compose -f infra/docker-compose.yml logs gdrive-sync-philip -f
docker compose -f infra/docker-compose.yml logs gdrive-sync-office -f

# Paperless Management Console
docker compose -f infra/docker-compose.yml exec paperless-webserver python manage.py shell
```

### **System-Monitoring:**
```bash
# Disk Space
df -h

# Docker Volumes
docker volume ls

# Running Containers
docker ps

# System Resources
htop
```

---

## 📁 **Wichtige Verzeichnisse auf dem Server**

```bash
/opt/paperless/                           # Hauptverzeichnis
├── infra/                                # Infrastructure (Docker Compose, etc.)
│   ├── docker-compose.yml                # Stack Definition
│   ├── caddy/Caddyfile                   # Reverse Proxy Config
│   ├── rclone/rclone.conf                # Google Drive Credentials
│   ├── eml2pdf/                          # E-Mail-zu-PDF Service
│   └── invoice-ai/                       # AI Classifier Service
├── data/                                 # Paperless Application Data
├── media/                                # Processed Documents (Paperless Storage)
├── consume/                              # Import Queues
│   ├── gdrive-philip/attachments/        # phkoenig@gmail.com Imports
│   ├── gdrive-office/attachments/        # philip@zepta.com Imports
│   └── nextcloud/                        # Nextcloud Imports
├── export/                               # Export Directory
├── db/                                   # PostgreSQL Data
└── backups/                              # Backup Files
```

---

## 🔒 **Sicherheits-Konfiguration**

### **Firewall (UFW):**
```bash
# Status prüfen
sudo ufw status

# Erwartete Regeln:
# - 22/tcp (SSH)
# - 80/tcp (HTTP)
# - 443/tcp (HTTPS)
```

### **SSH-Konfiguration:**
```bash
# SSH Config anschauen
cat /etc/ssh/sshd_config

# Wichtige Settings:
# PermitRootLogin no          # Root-Login deaktiviert
# PasswordAuthentication yes  # Passwort-Auth aktiv (könnte auf 'no' gesetzt werden)
# PubkeyAuthentication yes    # Key-Auth aktiviert
```

---

## 🔄 **Backup-Zugang**

### **Nextcloud WebDAV:**
- **URL:** https://hub.zepta.com/remote.php/dav/files/philip/
- **User:** philip
- **App-Passwort:** In `infra/rclone/rclone.conf` (verschlüsselt)

### **Backup-Verzeichnisse:**
- **Media Backup:** `Nextcloud:Paperless/media/`
- **Database Backup:** `Nextcloud:Paperless/db/`
- **Backup-Archiv:** `Nextcloud:Paperless/media_archive/`

---

## 🆘 **Troubleshooting**

### **Problem: SSH-Verbindung schlägt fehl**
```bash
# Prüfe ob Server erreichbar ist
ping 91.98.40.206

# Prüfe ob SSH-Port offen ist
telnet 91.98.40.206 22

# Verbose SSH-Output
ssh -v ubuntu@91.98.40.206
```

### **Problem: Permission Denied**
```bash
# Prüfe SSH-Key Permissions (lokal)
ls -la ~/.ssh/
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# Prüfe authorized_keys auf Server
ssh ubuntu@91.98.40.206
cat ~/.ssh/authorized_keys
```

### **Problem: Passwort wird immer noch abgefragt**
```bash
# Prüfe SSH-Agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Prüfe SSH-Config
cat ~/.ssh/config
```

---

## 📝 **SSH-Config (Lokal)**

Die Datei `~/.ssh/config` wurde bereits erstellt mit folgendem Inhalt:

```ssh-config
# Paperless-NGX Hetzner Server
Host paperless
    HostName 91.98.40.206
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 30
    ServerAliveCountMax 3
    ConnectTimeout 10
    TCPKeepAlive yes
    BatchMode yes

# Alternative über Domain
Host paperless-domain
    HostName archive.megabrain.cloud
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 30
    ServerAliveCountMax 3
    ConnectTimeout 10
    TCPKeepAlive yes
    BatchMode yes
```

### **✅ Verwendung:**
```bash
# Kurzer Alias
ssh paperless

# Oder via Domain
ssh paperless-domain
```

### **📋 Erklärung:**
- `ServerAliveInterval 60` - Sendet alle 60 Sek ein Keep-Alive
- `ServerAliveCountMax 3` - Beendet nach 3 fehlgeschlagenen Keep-Alives
- `IdentityFile` - Verwendet deinen SSH-Key automatisch

---

## 🔐 **SSH-Security Status**

### **✅ Abgeschlossen:**
1. ✅ **SSH-Key Authentication eingerichtet**
   - SSH-Key existierte bereits (`~/.ssh/id_ed25519`)
   - Public Key zum Server kopiert
   - Passwortloser Login funktioniert

2. ✅ **SSH-Config angelegt**
   - `~/.ssh/config` erstellt
   - Alias "paperless" eingerichtet
   - Alternative "paperless-domain" verfügbar

### **📋 Optional (bei Bedarf):**
1. ⚪ **Passwort-Auth deaktivieren** (für maximale Sicherheit)
   - Nur SSH-Key erlauben
   - In `/etc/ssh/sshd_config`: `PasswordAuthentication no`
   - Erst nach Test des SSH-Key-Logins!

2. ⚪ **Mehrere Rechner?**
   - Falls Zugriff von anderen Rechnern nötig
   - Weitere SSH-Keys hinzufügen

3. ⚪ **Backup-Zugang?**
   - Falls andere Personen Zugang brauchen
   - Separater User mit eingeschränkten Rechten

---

## 👨‍💻 **Maintainer**

**Philip König**
- E-Mail: philip@zepta.com

**Aktueller SSH-Status:** ✅ SSH-Key Authentication aktiviert  
**Setup am:** 16.10.2025  
**Login-Methode:** 🔑 Passwortlos via SSH-Key

---

## 📅 Letzte Aktualisierung

**16.10.2025 (23:45)** - SSH-Key Authentication eingerichtet und dokumentiert.
- SSH-Key zum Server kopiert
- SSH-Config mit Alias "paperless" erstellt
- Passwortloser Login getestet und funktioniert

