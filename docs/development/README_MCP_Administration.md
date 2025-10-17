# 🎛️ Paperless Administration via MCP

## 🎯 Übersicht

**Paperless wird AUSSCHLIESSLICH über das Paperless MCP administriert, NICHT über SSH!**

### Warum MCP statt SSH?

#### ❌ SSH-Probleme (alt):
- Komplexe Django Shell Befehle
- Fehleranfällig (Syntax, Python-Indentation)
- Keine Type-Safety
- Zeitaufwändig
- Nicht wiederholbar

#### ✅ MCP-Vorteile (neu):
- Einfache API-Calls
- Type-Safe
- Automatische Error-Handling
- Schnell und zuverlässig
- Cursor AI Integration

---

## 🔧 Setup

### MCP-Konfiguration

**Datei:** `~/.cursor/mcp.json` (Windows: `C:\Users\USERNAME\.cursor\mcp.json`)

```json
{
  "mcpServers": {
    "paperless": {
      "command": "npx",
      "args": [
        "-y",
        "@baruchiro/paperless-mcp@latest"
      ],
      "env": {
        "PAPERLESS_URL": "https://archive.megabrain.cloud",
        "PAPERLESS_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### API Key erstellen

**Via Web-UI:**
1. Login: https://archive.megabrain.cloud
2. Settings → API Keys
3. Create Token
4. Copy & Paste in `mcp.json`

**Via SSH (einmalig):**
```bash
ssh paperless
docker compose exec paperless-webserver python manage.py shell
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
user = User.objects.get(username='admin')
token, created = Token.objects.get_or_create(user=user)
print(f"API Key: {token.key}")
```

---

## 📖 MCP Funktionen

### Dokumente

#### Liste alle Dokumente
```javascript
mcp_paperless_list_documents({
  page_size: 20,
  ordering: "-created"
})
```

#### Dokument suchen
```javascript
mcp_paperless_list_documents({
  search: "rechnung 2025",
  page_size: 10
})
```

#### Dokument Details
```javascript
mcp_paperless_get_document({
  id: 126
})
```

#### Dokument aktualisieren
```javascript
mcp_paperless_update_document({
  id: 126,
  title: "Neue Titel",
  tags: [1, 5, 10],
  correspondent: 3
})
```

### Tags

#### Liste alle Tags
```javascript
mcp_paperless_list_tags({
  page_size: 50
})
```

#### Tag erstellen
```javascript
mcp_paperless_create_tag({
  name: "Rechnung",
  color: "#FF0000"
})
```

#### Tag aktualisieren
```javascript
mcp_paperless_update_tag({
  id: 10,
  name: "Rechnung 2025",
  color: "#00FF00"
})
```

### Correspondents

#### Liste alle Absender
```javascript
mcp_paperless_list_correspondents({
  page_size: 50
})
```

#### Correspondent erstellen
```javascript
mcp_paperless_create_correspondent({
  name: "ZEPTA Architektur"
})
```

### Document Types

#### Liste alle Dokumenttypen
```javascript
mcp_paperless_list_document_types({
  page_size: 50
})
```

#### Dokumenttyp erstellen
```javascript
mcp_paperless_create_document_type({
  name: "Rechnung"
})
```

---

## 💡 Beispiele

### Dokument mit Tags versehen

```javascript
// 1. Tags finden
const tags = await mcp_paperless_list_tags({ page_size: 100 });
const rechnungTag = tags.results.find(t => t.name === "Rechnung");

// 2. Dokument updaten
await mcp_paperless_update_document({
  id: 126,
  tags: [rechnungTag.id]
});
```

### Alle Dokumente eines Absenders

```javascript
// 1. Correspondent finden
const corrs = await mcp_paperless_list_correspondents({ page_size: 100 });
const zepta = corrs.results.find(c => c.name.includes("ZEPTA"));

// 2. Dokumente filtern
const docs = await mcp_paperless_list_documents({
  correspondent: zepta.id,
  page_size: 50
});
```

### Duplikat prüfen

```javascript
// Via Titel-Suche
const docs = await mcp_paperless_list_documents({
  search: "2025-10-17_10-30-45_John_Rechnung",
  page_size: 5
});

console.log(docs.results.length > 0 
  ? "✅ Dokument existiert (Duplikat)"
  : "❌ Nicht gefunden");
```

---

## ⚠️ Was SSH noch macht

SSH ist NUR für Server-Wartung, NICHT für Paperless:

### ✅ Erlaubt:
- Docker Services restart
- Log-Dateien prüfen
- Disk Space prüfen
- System Updates

### ❌ Verboten:
- Paperless-Dokumente abfragen
- Tags/Correspondents verwalten
- Dokumente bearbeiten
- Django Shell verwenden

---

## 🚀 Migration von SSH zu MCP

### Alt (SSH):
```bash
ssh paperless
docker compose exec paperless-webserver python manage.py shell

from documents.models import Document
docs = Document.objects.filter(title__icontains="rechnung")
for doc in docs:
    print(doc.id, doc.title)
```

### Neu (MCP):
```javascript
const docs = await mcp_paperless_list_documents({
  search: "rechnung",
  page_size: 100
});

docs.results.forEach(doc => {
  console.log(doc.id, doc.title);
});
```

**Vorteile:**
- ✅ 10x schneller
- ✅ Keine SSH-Verbindung nötig
- ✅ Type-Safe
- ✅ Automatisch in Cursor AI verfügbar

---

## 📊 Monitoring & Debugging

### Logs prüfen (noch via SSH)
```bash
# Alle Services
ssh paperless "docker compose -f /home/ubuntu/paperless-infra/infra/docker-compose.yml ps"

# Consumer Logs
ssh paperless "docker compose -f /home/ubuntu/paperless-infra/infra/docker-compose.yml logs paperless-consumer --tail 50"

# Worker Logs
ssh paperless "docker compose -f /home/ubuntu/paperless-infra/infra/docker-compose.yml logs paperless-worker --tail 50"
```

### Status prüfen (via MCP)
```javascript
// Letzte importierte Dokumente
const recent = await mcp_paperless_list_documents({
  page_size: 10,
  ordering: "-added"
});

console.log(`Letzter Import: ${recent.results[0].added}`);
```

---

## 🔒 Security

### API Key schützen
- ❌ NIEMALS in Git committen
- ✅ Nur in `.cursor/mcp.json` (außerhalb Repo)
- ✅ Key regelmäßig rotieren
- ✅ Bei Leak: Sofort neuen Key erstellen

### Key rotieren
1. Web-UI: Settings → API Keys → Revoke old key
2. Create new Token
3. Update `.cursor/mcp.json`
4. Restart Cursor

---

## 📚 Referenzen

- **MCP Package:** https://www.npmjs.com/package/@baruchiro/paperless-mcp
- **Paperless API Docs:** https://docs.paperless-ngx.com/api/
- **MCP Config:** `~/.cursor/mcp.json`

---

**Status:** Aktiv seit 17.10.2025 - SSH-Administration deprecated

