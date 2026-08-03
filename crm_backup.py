#!/usr/bin/env python3
"""
CRM Database Backup with pagination (>1000 rows supported)
Saves candidates, profiles, training tables, etc.
"""
import os
import sys
import json
import datetime
import re

sys.path.insert(0, '/opt/gapi_venv/lib/python3.10/site-packages')
from supabase import create_client

TABLES = [
    'candidates',
    'profiles',
    'training_modules',
    'training_attempts',
    'training_progress',
    'messages',
    'calendar_events',
    'departments',
    'news',
]

BACKUP_DIR = '/var/backups/crm'
PAGE_SIZE = 1000


def log(msg):
    ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'[{ts}] {msg}')


def fetch_all(sb, table: str):
    """Fetch ALL rows from a table using pagination."""
    all_rows = []
    page = 0
    while True:
        start = page * PAGE_SIZE
        end = start + PAGE_SIZE - 1
        res = sb.table(table).select('*').range(start, end).execute()
        if not res.data:
            break
        all_rows.extend(res.data)
        log(f'  {table}: fetched {len(res.data)} rows (total: {len(all_rows)})')
        if len(res.data) < PAGE_SIZE:
            break
        page += 1
    return all_rows


def backup():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    sb = create_client(
        os.environ['SUPABASE_URL'],
        os.environ['SUPABASE_SERVICE_KEY']
    )
    
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = os.path.join(BACKUP_DIR, f'crm_backup_{timestamp}.json')
    
    log('=== CRM Backup Started ===')
    log(f'Backup file: {backup_path}')
    
    backup_data = {}
    total_rows = 0
    
    for table in TABLES:
        try:
            rows = fetch_all(sb, table)
            backup_data[table] = rows
            total_rows += len(rows)
            log(f'{table}: {len(rows)} rows')
        except Exception as e:
            log(f'ERROR fetching {table}: {e}')
            backup_data[table] = []
    
    # Save backup
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2)
    
    # Also save a symlink to latest
    latest = os.path.join(BACKUP_DIR, 'latest.json')
    if os.path.exists(latest):
        os.remove(latest)
    os.symlink(backup_path, latest)
    
    # Cleanup: keep last 7 days
    cutoff = datetime.datetime.now() - datetime.timedelta(days=7)
    for fname in os.listdir(BACKUP_DIR):
        fpath = os.path.join(BACKUP_DIR, fname)
        if fname.startswith('crm_backup_') and fname.endswith('.json'):
            try:
                ftime = datetime.datetime.fromtimestamp(os.path.getmtime(fpath))
                if ftime < cutoff:
                    os.remove(fpath)
                    log(f'Cleaned old backup: {fname}')
            except Exception:
                pass
    
    log(f'=== Backup Complete: {total_rows} rows across {len(TABLES)} tables ===')
    log(f'File size: {os.path.getsize(backup_path) / 1024 / 1024:.1f} MB')
    return backup_path


if __name__ == '__main__':
    backup()
