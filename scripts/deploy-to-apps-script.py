#!/usr/bin/env python3
"""
Deployment Script für Google Apps Script
Lädt Code.js direkt in Apps Script hoch
"""

import os
import sys

def main():
    # Pfade
    code_file = "scripts/master-gmail-to-paperless/Code.js"
    
    # Code lesen
    if not os.path.exists(code_file):
        print(f"❌ Fehler: {code_file} nicht gefunden!")
        sys.exit(1)
    
    with open(code_file, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Ausgabe für manuelles Kopieren
    print("=" * 80)
    print("📋 GOOGLE APPS SCRIPT CODE - BEREIT ZUM KOPIEREN")
    print("=" * 80)
    print()
    print("1. Öffne: https://script.google.com/home/projects/1j6Bq0MvMa3H9fFlD5XmwyzECH7-GIzRMkJDWrDMs0sficyKdRQMUmU1L/edit")
    print("2. Lösche den Standard-Code")
    print("3. Kopiere den folgenden Code (Ctrl+A, Ctrl+C im Terminal)")
    print("4. Füge ihn in Apps Script ein (Ctrl+V)")
    print("5. Speichere (Ctrl+S)")
    print()
    print("=" * 80)
    print()
    print(code)
    print()
    print("=" * 80)
    print("✅ Code bereit zum Kopieren!")
    print("=" * 80)

if __name__ == "__main__":
    main()

