#!/usr/bin/env python3
"""
Paperless-NGX API Client
Direkte REST-API Integration für Cursor AI
"""

import os
import sys
import json
import requests
from typing import Optional, Dict, List
from datetime import datetime

class PaperlessAPI:
    """Client für Paperless-NGX REST API"""
    
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.headers = {
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json'
        }
    
    def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """Generische API-Anfrage"""
        url = f"{self.base_url}{endpoint}"
        response = requests.request(method, url, headers=self.headers, **kwargs)
        response.raise_for_status()
        return response.json() if response.content else {}
    
    # ===== DOKUMENTE =====
    
    def list_documents(self, page: int = 1, page_size: int = 100, **filters) -> Dict:
        """Liste alle Dokumente"""
        params = {'page': page, 'page_size': page_size, **filters}
        return self._request('GET', '/api/documents/', params=params)
    
    def get_document(self, doc_id: int) -> Dict:
        """Hole einzelnes Dokument"""
        return self._request('GET', f'/api/documents/{doc_id}/')
    
    def search_documents(self, query: str, page: int = 1) -> Dict:
        """Suche Dokumente"""
        params = {'query': query, 'page': page}
        return self._request('GET', '/api/documents/', params=params)
    
    def delete_document(self, doc_id: int) -> None:
        """Lösche Dokument"""
        self._request('DELETE', f'/api/documents/{doc_id}/')
    
    def update_document(self, doc_id: int, data: Dict) -> Dict:
        """Aktualisiere Dokument"""
        return self._request('PATCH', f'/api/documents/{doc_id}/', json=data)
    
    # ===== TAGS =====
    
    def list_tags(self) -> List[Dict]:
        """Liste alle Tags"""
        response = self._request('GET', '/api/tags/')
        return response.get('results', [])
    
    def create_tag(self, name: str, color: str = '#aaaaaa') -> Dict:
        """Erstelle neuen Tag"""
        data = {'name': name, 'color': color}
        return self._request('POST', '/api/tags/', json=data)
    
    # ===== CORRESPONDENTS =====
    
    def list_correspondents(self) -> List[Dict]:
        """Liste alle Korrespondenten"""
        response = self._request('GET', '/api/correspondents/')
        return response.get('results', [])
    
    # ===== DOCUMENT TYPES =====
    
    def list_document_types(self) -> List[Dict]:
        """Liste alle Dokumenttypen"""
        response = self._request('GET', '/api/document_types/')
        return response.get('results', [])
    
    # ===== TASKS =====
    
    def list_tasks(self) -> List[Dict]:
        """Liste alle Tasks"""
        response = self._request('GET', '/api/tasks/')
        return response.get('results', [])
    
    # ===== LOGS =====
    
    def get_logs(self, level: str = 'INFO') -> List[str]:
        """Hole Logs (über API wenn verfügbar)"""
        try:
            response = self._request('GET', '/api/logs/')
            return response.get('logs', [])
        except:
            return ["Log-API nicht verfügbar - nutze Docker logs"]
    
    # ===== STATISTICS =====
    
    def get_statistics(self) -> Dict:
        """Hole Statistiken"""
        return self._request('GET', '/api/statistics/')


def main():
    """CLI Interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Paperless-NGX API CLI')
    parser.add_argument('--url', default=os.getenv('PAPERLESS_URL', 'http://91.98.40.206'),
                       help='Paperless-NGX URL')
    parser.add_argument('--token', default=os.getenv('PAPERLESS_TOKEN'),
                       help='API Token')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # List documents
    list_parser = subparsers.add_parser('list', help='Liste Dokumente')
    list_parser.add_argument('--query', help='Suchquery')
    list_parser.add_argument('--limit', type=int, default=10, help='Max. Anzahl')
    
    # Search documents
    search_parser = subparsers.add_parser('search', help='Suche Dokumente')
    search_parser.add_argument('query', help='Suchbegriff')
    
    # Delete document
    delete_parser = subparsers.add_parser('delete', help='Lösche Dokument')
    delete_parser.add_argument('id', type=int, help='Dokument ID')
    
    # Statistics
    subparsers.add_parser('stats', help='Zeige Statistiken')
    
    # Tasks
    subparsers.add_parser('tasks', help='Zeige Tasks')
    
    # Tags
    subparsers.add_parser('tags', help='Liste Tags')
    
    args = parser.parse_args()
    
    if not args.token:
        print("❌ Kein API-Token! Setze PAPERLESS_TOKEN oder nutze --token")
        sys.exit(1)
    
    api = PaperlessAPI(args.url, args.token)
    
    try:
        if args.command == 'list':
            result = api.list_documents(page_size=args.limit)
            docs = result.get('results', [])
            print(f"\n📄 {len(docs)} Dokumente (Total: {result.get('count', 0)}):\n")
            for doc in docs:
                print(f"  ID {doc['id']}: {doc['title']}")
                print(f"    Erstellt: {doc.get('created')}")
                print(f"    Tags: {doc.get('tags', [])}")
                print()
        
        elif args.command == 'search':
            result = api.search_documents(args.query)
            docs = result.get('results', [])
            print(f"\n🔍 {len(docs)} Treffer für '{args.query}':\n")
            for doc in docs:
                print(f"  ID {doc['id']}: {doc['title']}")
                print(f"    Erstellt: {doc.get('created')}")
                print()
        
        elif args.command == 'delete':
            api.delete_document(args.id)
            print(f"✅ Dokument {args.id} gelöscht!")
        
        elif args.command == 'stats':
            stats = api.get_statistics()
            print("\n📊 Paperless-NGX Statistiken:\n")
            print(json.dumps(stats, indent=2))
        
        elif args.command == 'tasks':
            tasks = api.list_tasks()
            print(f"\n⚙️  {len(tasks)} Tasks:\n")
            for task in tasks:
                print(f"  {task.get('id')}: {task.get('task_name')}")
                print(f"    Status: {task.get('status')}")
                print(f"    Fortschritt: {task.get('result', 'N/A')}")
                print()
        
        elif args.command == 'tags':
            tags = api.list_tags()
            print(f"\n🏷️  {len(tags)} Tags:\n")
            for tag in tags:
                print(f"  ID {tag['id']}: {tag['name']} (Color: {tag.get('color', 'N/A')})")
        
        else:
            parser.print_help()
    
    except requests.exceptions.RequestException as e:
        print(f"❌ API-Fehler: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()

