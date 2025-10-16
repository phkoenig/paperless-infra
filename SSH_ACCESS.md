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

## ⚠️ **OFFENE FRAGE: SSH-Key Authentication**

### **Status:** ❓ **Unbeantwortet**

**Frage vom Agent:**
> "Soll ich für dich einen SSH-Key auf deinem lokalen Rechner erstellen und zum Server hinzufügen, damit du dich ohne Passwort einloggen kannst?"

**User-Antwort:** Keine Antwort erhalten

### **Empfehlung:**

#### **Option 1: SSH-Key Authentication (EMPFOHLEN für Sicherheit)**
**Vorteile:**
- ✅ Sicherer als Passwort
- ✅ Keine Passwort-Eingabe mehr nötig
- ✅ Kann für GitHub Actions / CI/CD verwendet werden
- ✅ Best Practice

**Setup:**
```bash
# 1. Lokalen SSH-Key erstellen (falls noch nicht vorhanden)
ssh-keygen -t ed25519 -C "philip@zepta.com"

# 2. Public Key zum Server kopieren
ssh-copy-id ubuntu@91.98.40.206

# 3. Testen
ssh ubuntu@91.98.40.206
```

#### **Option 2: Passwort-Authentication (Aktueller Status)**
**Vorteile:**
- ✅ Einfach
- ✅ Funktioniert bereits

**Nachteile:**
- ❌ Weniger sicher
- ❌ Passwort muss jedes Mal eingegeben werden
- ❌ Nicht ideal für Automatisierung

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

## 📝 **SSH-Config Empfehlung (Lokal)**

Erstelle/Bearbeite `~/.ssh/config` auf deinem lokalen Rechner:

```ssh-config
# Paperless-NGX Hetzner Server
Host paperless
    HostName 91.98.40.206
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3

# Alternative über Domain
Host paperless-domain
    HostName archive.megabrain.cloud
    User ubuntu
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**Dann kannst du einfach verbinden mit:**
```bash
ssh paperless
```

---

## 🔐 **TODO: Offene SSH-Fragen**

### **Zu klären mit Philip:**
1. ❓ **SSH-Key Authentication einrichten?**
   - Soll ich einen SSH-Key auf dem lokalen Rechner erstellen?
   - Soll dieser zum Server hinzugefügt werden?
   - Soll Passwort-Auth danach deaktiviert werden?

2. ❓ **SSH-Config anlegen?**
   - Soll ich eine ~/.ssh/config Datei erstellen?
   - Soll ein Alias "paperless" eingerichtet werden?

3. ❓ **Mehrere Rechner?**
   - Von welchen Rechnern soll Zugriff möglich sein?
   - Sollen mehrere SSH-Keys hinzugefügt werden?

4. ❓ **Backup-Zugang?**
   - Braucht jemand anderes SSH-Zugang?
   - Backup-User mit eingeschränkten Rechten?

---

## 👨‍💻 **Maintainer**

**Philip König**
- E-Mail: philip@zepta.com

**Aktueller SSH-Status:** ✅ Funktioniert (Passwort-basiert)  
**Empfehlung:** 🔑 SSH-Key Authentication einrichten  
**Priorität:** 🟡 Mittel (funktioniert, aber nicht optimal)

---

## 📅 Letzte Aktualisierung

**16.10.2025** - SSH-Zugang dokumentiert, offene Frage zu Key-Auth vermerkt.

