#!/usr/bin/env python3
"""
Apps Script Deployment Automation v1.0

Deployt Code.js automatisch zu beiden Google Accounts:
- philip@zepta.com (ZEPTA - Architekturbüro Workspace)
- phkoenig@gmail.com (PRIVAT)

Usage:
    python deploy-apps-script.py --all     # Deploy zu beiden Accounts
    python deploy-apps-script.py --zepta   # Nur philip@zepta.com
    python deploy-apps-script.py --privat  # Nur phkoenig@gmail.com
    python deploy-apps-script.py --status  # Zeige Login-Status
"""

import subprocess
import sys
import os
import json
from pathlib import Path

# ============================================
# CONFIGURATION
# ============================================

SCRIPT_DIR = Path(__file__).parent / "master-gmail-to-paperless"
CLASP_JSON = SCRIPT_DIR / ".clasp.json"

# Google Account Configurations
ACCOUNTS = {
    "zepta": {
        "name": "philip@zepta.com (ZEPTA)",
        "script_id": "1-7xxxihVVq6MCmvMMfJjYdLBRTTuE57JTpu5yg85tE4CVvPH_pJK1p4S",
        "script_name": "ZeptaMail-to-paperless"
    },
    "privat": {
        "name": "phkoenig@gmail.com (PRIVAT)",
        "script_id": "1OgncdBW_-rbgf_geYu8K9eFHjrl5NjZGcpQKBZaUZurgM5Xi36YS6Hgw",
        "script_name": "Paperless-Email-Export"
    }
}

# ============================================
# HELPER FUNCTIONS
# ============================================

def run_command(cmd, cwd=None, timeout=30):
    """Execute command with timeout"""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd or SCRIPT_DIR,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=True
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "Command timed out"
    except Exception as e:
        return -1, "", str(e)


def get_current_script_id():
    """Read current script ID from .clasp.json"""
    try:
        with open(CLASP_JSON, 'r') as f:
            data = json.load(f)
            return data.get("scriptId")
    except Exception as e:
        print(f"❌ Fehler beim Lesen von .clasp.json: {e}")
        return None


def update_script_id(script_id):
    """Update script ID in .clasp.json"""
    try:
        with open(CLASP_JSON, 'r') as f:
            data = json.load(f)
        
        data["scriptId"] = script_id
        
        with open(CLASP_JSON, 'w') as f:
            json.dump(data, f, indent=2)
        
        return True
    except Exception as e:
        print(f"❌ Fehler beim Aktualisieren von .clasp.json: {e}")
        return False


def check_login_status():
    """Check which Google account is currently logged in"""
    print("🔍 Prüfe clasp Login-Status...")
    
    returncode, stdout, stderr = run_command("clasp list", timeout=10)
    
    if returncode != 0:
        print("❌ clasp nicht eingeloggt oder Fehler")
        print(f"   Fehler: {stderr}")
        return None
    
    # Parse output to find account
    if "ZeptaMail-to-paperl" in stdout:
        return "zepta"
    elif "Paperless-Email-Exp" in stdout:
        return "privat"
    else:
        print("⚠️  Unbekannter Account oder keine Scripts gefunden")
        return None


def deploy_to_account(account_key):
    """Deploy to specific account"""
    account = ACCOUNTS[account_key]
    
    print("\n" + "="*60)
    print(f"📤 DEPLOYMENT zu {account['name']}")
    print("="*60)
    
    # 1. Check if logged in to correct account
    current_account = check_login_status()
    
    if current_account != account_key:
        print(f"\n⚠️  Falscher Account eingeloggt!")
        print(f"   Aktuell: {ACCOUNTS.get(current_account, {}).get('name', 'Unbekannt')}")
        print(f"   Benötigt: {account['name']}")
        print(f"\n   Bitte führe aus:")
        print(f"   1. clasp logout")
        print(f"   2. clasp login")
        print(f"   3. Wähle im Browser: {account['name']}")
        print(f"\n   Dann Script nochmal starten.\n")
        return False
    
    print(f"✅ Korrekt eingeloggt als: {account['name']}")
    
    # 2. Update .clasp.json with correct script ID
    current_id = get_current_script_id()
    
    if current_id != account['script_id']:
        print(f"\n📝 Aktualisiere .clasp.json...")
        print(f"   Alt: {current_id[:20]}...")
        print(f"   Neu: {account['script_id'][:20]}...")
        
        if not update_script_id(account['script_id']):
            print("❌ Fehler beim Aktualisieren der Script-ID")
            return False
        
        print("✅ Script-ID aktualisiert")
    
    # 3. Push code
    print(f"\n📤 Push Code zu {account['script_name']}...")
    
    returncode, stdout, stderr = run_command("clasp push", timeout=30)
    
    if returncode != 0:
        print(f"❌ Push fehlgeschlagen!")
        print(f"   Fehler: {stderr}")
        return False
    
    print(f"✅ Push erfolgreich!")
    if "Pushed" in stdout:
        for line in stdout.split('\n'):
            if line.strip():
                print(f"   {line}")
    
    # 4. Deploy
    print(f"\n🚀 Deploy neue Version...")
    
    deploy_cmd = 'clasp deploy --description "v4.2: Präventive Duplikaterkennung mit Supabase"'
    returncode, stdout, stderr = run_command(deploy_cmd, timeout=30)
    
    if returncode != 0:
        print(f"❌ Deploy fehlgeschlagen!")
        print(f"   Fehler: {stderr}")
        return False
    
    print(f"✅ Deploy erfolgreich!")
    
    # Extract deployment ID
    if "Deployed" in stdout:
        print(f"   {stdout.strip()}")
    
    # 5. Show deployments
    print(f"\n📊 Aktive Deployments:")
    
    returncode, stdout, stderr = run_command("clasp deployments", timeout=10)
    
    if returncode == 0 and stdout:
        for line in stdout.split('\n'):
            if line.strip():
                print(f"   {line}")
    
    print(f"\n✅ Deployment zu {account['name']} abgeschlossen!\n")
    return True


def show_status():
    """Show current clasp login status"""
    print("\n" + "="*60)
    print("📊 CLASP STATUS")
    print("="*60)
    
    current_account = check_login_status()
    
    if current_account:
        print(f"\n✅ Eingeloggt als: {ACCOUNTS[current_account]['name']}")
        
        current_id = get_current_script_id()
        print(f"\n📝 Aktuelle .clasp.json:")
        print(f"   Script-ID: {current_id[:30]}...")
        
        # Check if ID matches account
        if current_id == ACCOUNTS[current_account]['script_id']:
            print(f"   ✅ Passt zu {ACCOUNTS[current_account]['name']}")
        else:
            print(f"   ⚠️  Stimmt nicht mit Login überein!")
    else:
        print("\n❌ Nicht eingeloggt oder Fehler")
        print("\n   Führe aus: clasp login")
    
    print("\n")


# ============================================
# MAIN
# ============================================

def main():
    """Main function"""
    
    # Check if script directory exists
    if not SCRIPT_DIR.exists():
        print(f"❌ Script-Verzeichnis nicht gefunden: {SCRIPT_DIR}")
        sys.exit(1)
    
    # Parse arguments
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "--status":
        show_status()
    
    elif command == "--zepta":
        success = deploy_to_account("zepta")
        sys.exit(0 if success else 1)
    
    elif command == "--privat":
        success = deploy_to_account("privat")
        sys.exit(0 if success else 1)
    
    elif command == "--all":
        print("\n🎯 Deploy zu BEIDEN Accounts\n")
        
        # Check which account is currently logged in
        current_account = check_login_status()
        
        if not current_account:
            print("❌ Bitte erst mit einem Account einloggen:")
            print("   clasp login")
            sys.exit(1)
        
        # Determine deployment order (start with current account)
        if current_account == "zepta":
            first_account = "zepta"
            second_account = "privat"
            second_email = "phkoenig@gmail.com"
        else:  # privat
            first_account = "privat"
            second_account = "zepta"
            second_email = "philip@zepta.com"
        
        # Deploy to FIRST account (currently logged in)
        print(f"✅ Starte mit aktuellem Account: {ACCOUNTS[first_account]['name']}\n")
        first_success = deploy_to_account(first_account)
        
        if not first_success:
            print(f"\n❌ Deploy zu {ACCOUNTS[first_account]['name']} fehlgeschlagen")
            print("   Behebe das Problem und versuche es erneut.\n")
            sys.exit(1)
        
        # Prompt for account switch
        print("\n" + "="*60)
        print("🔄 ACCOUNT-WECHSEL erforderlich")
        print("="*60)
        print(f"\nBitte wechsle zu {second_email}:")
        print("1. clasp logout")
        print("2. clasp login")
        print(f"3. Wähle im Browser: {second_email}")
        print("\nDrücke ENTER wenn fertig...")
        input()
        
        # Deploy to SECOND account
        second_success = deploy_to_account(second_account)
        
        if first_success and second_success:
            print("\n" + "="*60)
            print("🎉 DEPLOYMENT KOMPLETT ERFOLGREICH!")
            print("="*60)
            print("\n✅ philip@zepta.com (ZEPTA)")
            print("✅ phkoenig@gmail.com (PRIVAT)")
            print("\nv4.2 ist deployed und aktiv! 🚀\n")
            sys.exit(0)
        else:
            print("\n⚠️  Deployment teilweise erfolgreich")
            sys.exit(1)
    
    else:
        print(f"❌ Unbekannter Befehl: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()

