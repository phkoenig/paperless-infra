#!/usr/bin/env python3
"""
Erstellt API-Token für Paperless-NGX Admin-User
Muss auf dem Server ausgeführt werden
"""

import sys
import os

# Django Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paperless.settings')
import django
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

try:
    user = User.objects.get(username='admin')
    token, created = Token.objects.get_or_create(user=user)
    
    if created:
        print(f"✅ Neuer Token erstellt: {token.key}")
    else:
        print(f"✅ Existierender Token: {token.key}")
    
    print(f"\n📋 Füge diesen Token zu deiner .env hinzu:")
    print(f"PAPERLESS_TOKEN={token.key}")
    
except User.DoesNotExist:
    print("❌ Admin-User nicht gefunden!")
    sys.exit(1)
except Exception as e:
    print(f"❌ Fehler: {e}")
    sys.exit(1)

