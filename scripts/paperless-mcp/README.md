# Paperless-NGX MCP Server

Model Context Protocol (MCP) Server für [Paperless-NGX](https://github.com/paperless-ngx/paperless-ngx).

## 🚀 Features

- **📄 Dokumentenverwaltung**: Suchen, Listen, Löschen, Aktualisieren
- **🏷️ Tag-Management**: Tags listen und erstellen
- **📊 Statistiken**: Übersicht über Dokumente, Tags, Korrespondenten
- **⚙️ Task-Monitoring**: Aktive Tasks und deren Status überwachen
- **🔐 SSH-Tunnel**: Umgeht Caddy's HTTPS-Redirect über direkte Container-API-Zugriffe

## 📦 Installation

```bash
# Installiere MCP SDK
pip install mcp

# Oder mit uv (empfohlen)
uv pip install mcp
```

## ⚙️ Konfiguration

### Cursor AI Integration

Füge zu deiner Cursor-Konfiguration (`~/.cursor/config.json` oder Settings → MCP) hinzu:

```json
{
  "mcpServers": {
    "paperless-ngx": {
      "command": "python",
      "args": ["B:\\Nextcloud\\CODE\\proj\\Paperless\\scripts\\paperless-mcp\\server.py"],
      "env": {
        "PAPERLESS_SSH_HOST": "paperless",
        "PAPERLESS_TOKEN": "08303a894fc26772730f3f5f8802b70837ca48c3"
      }
    }
  }
}
```

### Claude Desktop Integration

Füge zu `~/Library/Application Support/Claude/claude_desktop_config.json` hinzu:

```json
{
  "mcpServers": {
    "paperless-ngx": {
      "command": "python",
      "args": ["/path/to/scripts/paperless-mcp/server.py"],
      "env": {
        "PAPERLESS_SSH_HOST": "paperless",
        "PAPERLESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## 🛠️ Verfügbare Tools

### `search_documents`
Suche nach Dokumenten.

**Parameter:**
- `query` (string, required): Suchbegriff
- `limit` (number, optional): Max. Anzahl Ergebnisse (default: 10)

**Beispiel:**
```
Search for "invoice 2024"
```

### `list_documents`
Liste alle Dokumente mit optionalen Filtern.

**Parameter:**
- `page` (number): Seitennummer
- `page_size` (number): Ergebnisse pro Seite
- `ordering` (string): Sortierung (z.B. "-created", "title")

### `get_document`
Hole Details zu einem spezifischen Dokument.

**Parameter:**
- `document_id` (number, required): Dokument-ID

### `delete_document`
Lösche ein Dokument.

**Parameter:**
- `document_id` (number, required): Dokument-ID

### `update_document`
Aktualisiere Dokument-Metadaten.

**Parameter:**
- `document_id` (number, required): Dokument-ID
- `title` (string): Neuer Titel
- `tags` (array): Tag-IDs
- `correspondent` (number): Korrespondent-ID
- `document_type` (number): Dokumenttyp-ID

### `get_statistics`
Hole Paperless-NGX Statistiken.

### `list_tags`
Liste alle Tags.

### `create_tag`
Erstelle einen neuen Tag.

**Parameter:**
- `name` (string, required): Tag-Name
- `color` (string): Hex-Farbe (default: "#aaaaaa")

### `list_tasks`
Liste alle aktiven und kürzlichen Tasks.

## 📚 Resources

Der Server stellt folgende Resources bereit:

- `paperless://statistics` - Gesamtstatistiken
- `paperless://documents/recent` - Kürzlich hinzugefügte Dokumente
- `paperless://tasks` - Aktive Tasks

## 🔧 Technische Details

### Architektur

Der MCP-Server nutzt **SSH + Docker Exec** um direkt mit der Paperless-NGX API zu kommunizieren:

```
Cursor AI
  ↓ MCP Protocol
Paperless MCP Server
  ↓ SSH
Hetzner Server
  ↓ Docker Exec
Paperless Container (Port 8000)
  ↓ REST API
Paperless-NGX Django Backend
```

### Warum SSH-Tunnel?

Caddy macht einen **308 Permanent Redirect** von HTTP zu HTTPS. Da das SSL-Zertifikat self-signed ist, schlagen direkte HTTPS-Requests fehl. Der SSH-Tunnel umgeht dies durch direkten Zugriff auf den Container.

### API-Token

Der Token wird über Django Management Command erstellt:

```bash
docker exec infra-paperless-webserver-1 python manage.py drf_create_token admin
```

## 🐛 Debugging

### MCP-Server testen

```bash
# Manueller Start
python scripts/paperless-mcp/server.py

# Mit Debug-Logging
PYTHONUNBUFFERED=1 python scripts/paperless-mcp/server.py
```

### SSH-Verbindung prüfen

```bash
ssh paperless "docker exec infra-paperless-webserver-1 curl -s -H 'Authorization: Token YOUR_TOKEN' http://localhost:8000/api/statistics/"
```

## 📄 Lizenz

MIT License

## 🤝 Contributing

Contributions welcome! Dieses Projekt ist Teil des Paperless-NGX Deployment Projekts.

## 🔗 Links

- [Paperless-NGX](https://github.com/paperless-ngx/paperless-ngx)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Servers Awesome List](https://github.com/wong2/awesome-mcp-servers)

