---
allowed-tools: Bash(git add:*), Bash(git commit:*)
description: Staged alle Änderungen, commit mit Nachricht – robust, mit Timeout und explizit ausgeben.
argument-hint: '"Commit-Nachricht"'
---

Führe folgenden Befehl aus:
timeout 10 git add -A && timeout 10 git commit -am {{argument}} --no-verify || echo "Nichts zu committen"