# 🎯 Intelligenter Email-Filter mit Supabase & KI

**Ziel:** Nur wichtige E-Mails zu Paperless exportieren, Rest filtern.

---

## 📊 **Supabase Schema**

### **Tabellen:**

#### **1. `email_filter_blacklist`**
```sql
CREATE TABLE email_filter_blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL UNIQUE,
  category TEXT, -- 'sender', 'subject', 'domain'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);
```

#### **2. `email_filter_whitelist`**
```sql
CREATE TABLE email_filter_whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL UNIQUE,
  category TEXT, -- 'sender', 'subject', 'domain', 'attachment'
  priority INT DEFAULT 5, -- 1-10 (10 = höchste Priorität)
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);
```

#### **3. `email_filter_decisions`** (Logging)
```sql
CREATE TABLE email_filter_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_from TEXT,
  email_subject TEXT,
  has_attachments BOOLEAN,
  decision TEXT, -- 'export', 'skip'
  reason TEXT,
  ai_score FLOAT, -- 0-10
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🤖 **Apps Script Integration**

### **Workflow:**
```
1. E-Mail kommt rein
   ↓
2. Lade Whitelist/Blacklist aus Supabase
   ↓
3. Regelbasierte Vorprüfung
   ├─ Blacklist Match? → SKIP
   ├─ Whitelist Match? → EXPORT
   └─ Unsicher? → Weiter zu KI
   ↓
4. KI-Bewertung (Google Gemini)
   ├─ Score > 7? → EXPORT
   └─ Score ≤ 7? → SKIP
   ↓
5. Entscheidung loggen in Supabase
```

---

## 💾 **Initiale Daten**

### **Blacklist:**
- Newsletter-Keywords
- Social Media
- Spam-Begriffe

### **Whitelist:**
- Wichtige Domains (Finanzamt, Steuerberater, etc.)
- Dokument-Keywords (Rechnung, Vertrag, etc.)
- Architekturbegriffe (Bauantrag, Genehmigung, etc.)

---

## 🔑 **Supabase MCP Config:**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", 
               "--project-ref=jpmhwyjiuodsvjowddsm"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_c84e0ef289c52aa32de2e5ffbec3d7e9dbca3623"
      }
    }
  }
}
```

---

## ✅ **Status:**
- ⏳ Supabase MCP Config bereitgestellt
- ⏳ Schema erstellen
- ⏳ Apps Script erweitern

