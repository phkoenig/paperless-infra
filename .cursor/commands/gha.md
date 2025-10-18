---
allowed-tools: Bash(git add:*), Bash(git commit:*)
description: Staged alle Änderungen, commit mit Nachricht – robust und Windows-kompatibel.
argument-hint: '"Commit-Nachricht"'
---

Führe folgenden Befehl aus:
git add -A && git commit -m {{argument}} --no-verify || echo Nichts zu committen