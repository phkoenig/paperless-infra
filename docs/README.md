# 📚 Dokumentations-Übersicht

Willkommen zur Dokumentation des Paperless-NGX Projekts! Hier findest du alle wichtigen Informationen zur Installation, Architektur, Entwicklung und Nutzung des Systems.

---

## 🗺️ Navigation

### 🚀 Setup & Konfiguration
Alles was du brauchst, um das System einzurichten:

- **[Google Accounts Setup](setup/GOOGLE_ACCOUNTS_SETUP.md)** - Konfiguration der Gmail-Accounts für Email-Export
- **[SSH Access](setup/SSH_ACCESS.md)** - Server-Zugriff und SSH-Konfiguration
- **[Deployment Guide](setup/README_Deploy.md)** - Schritt-für-Schritt Deployment auf Hetzner

---

### 🏗️ Architektur & Workflow
Verstehe wie das System funktioniert:

- **[Complete Workflow v4.2](architecture/README_Complete_Workflow.md)** ⭐  
  _Der vollständige End-to-End Workflow: Gmail → .eml → Google Drive → rclone → eml2pdf → Paperless_

- **[Deduplication Strategy v4.2](architecture/README_Deduplication_v4.2.md)**  
  _4-Ebenen präventive Duplikaterkennung mit Supabase-Index (NEU!)_

- **[Galaxy System - KI Navigation](architecture/README_GALAXY_SYSTEM_KI_NAVIGATION.md)** 🚧  
  _Zukunftsprojekt: AI-gesteuerte intelligente Dokumentenzuordnung_

---

### 💻 Entwicklung & Administration
Für Entwickler und Administratoren:

- **[MCP Administration](development/README_MCP_Administration.md)**  
  _Paperless-NGX Administration über Management Control Plane (Python & TypeScript)_

- **[Email Filter](development/README_Email_Filter.md)**  
  _Intelligente Whitelist/Blacklist mit Supabase und Pattern Matching_

- **[Paperless Usage Guide](development/README_Usage.md)**  
  _Best Practices für die tägliche Nutzung von Paperless-NGX_

---

### 📋 Planung & Status
Projekt-Status und Planungen:

- **[Deployment Plan](planning/paperless-ngx-deployment.plan.md)**  
  _Ursprünglicher Deployment-Plan und Infrastruktur-Konzept_

- **[Deployment Status](planning/DEPLOYMENT_STATUS.md)**  
  _Aktueller Status: Was läuft, was fehlt noch_

- **[Reset Log](planning/RESET_LOG.md)**  
  _Dokumentation von System-Resets und Änderungen_

---

## 🔍 Schnellzugriff

### Für neue User / AI-Sessions
👉 **[START HERE - Onboarding](../onboarding/START_HERE.md)**

### Für schnelles Debugging
👉 **[Quick Start Guide](../onboarding/QUICK_START.md)**

### Für Entwickler
👉 **[Scripts Übersicht](../scripts/)**
- [Master Gmail-to-Paperless Script](../scripts/master-gmail-to-paperless/)
- [Paperless MCP (Python)](../scripts/paperless-mcp/)
- [Paperless MCP (Node/TypeScript)](../scripts/paperless-mcp-nloui/)
- [Paperless CLI Tools](../scripts/paperless-cli/)

### Für Infrastruktur
👉 **[Infrastruktur-Konfigurationen](../infra/)**
- Docker Compose Setup
- Caddy Reverse Proxy
- eml2pdf Service
- invoice-ai Service
- rclone Sync Configuration

---

## 📖 Dokumentations-Konventionen

### Dateinamen
- Format: `README_Topic.md` für alle Dokumentationen
- Unterordner-Struktur für logische Gruppierung

### Struktur
- ✅ Emojis für bessere visuelle Navigation
- ✅ Code-Beispiele mit Syntax-Highlighting
- ✅ Links zu verwandten Dokumentationen
- ✅ Klare Abschnitte mit Überschriften

### Sprache
- Deutsch/Englisch gemischt (wie es passt)
- Technische Begriffe in Englisch
- Erklärungen in Deutsch

---

## 🆘 Hilfe & Support

### Problem beim Email-Import?
→ Siehe [Deduplication Strategy v4.2](architecture/README_Deduplication_v4.2.md) - Präventive Duplikaterkennung verhindert "failed imports"!

### Server-Probleme?
→ Siehe [MCP Administration](development/README_MCP_Administration.md) für Debugging-Befehle

### Workflow unklar?
→ Siehe [Complete Workflow v4.2](architecture/README_Complete_Workflow.md) für detaillierte Erklärung

### Google Apps Script Probleme?
→ Siehe [Scripts Dokumentation](../scripts/master-gmail-to-paperless/README.md)

---

## 🗂️ Veraltete Dokumentation

Alte oder überholte Dokumentationen findest du im **[Archive](../archive/)**  
Diese werden für Referenzzwecke aufbewahrt, sind aber nicht mehr aktuell.

---

## 🎯 Projekt-Version

**Aktueller Stand:** v4.2 (Oktober 2025)
- ✅ .eml Export mit Google Apps Script
- ✅ Server-seitige PDF-Konvertierung (eml2pdf + Gotenberg)
- ✅ 3-stufige Deduplication
- ✅ MCP Administration Interface
- ✅ Intelligenter Email-Filter mit Supabase
- 🚧 Galaxy System KI-Navigation (geplant)

---

_Letzte Aktualisierung: 17.10.2025_

