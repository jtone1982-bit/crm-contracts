#!/usr/bin/env python3
import os
import sys
import json
import re
import datetime
from pathlib import Path

sys.path.insert(0, '/opt/gapi_venv/lib/python3.10/site-packages')

from supabase import create_client

EXCEL_FILE = '/opt/crm-scripts/leads_many.xls'
LOG_FILE = '/opt/crm-scripts/daily_import_excel.log'
BATCH_SIZE = 200

MANAGERS = [
    {'id': '59bf2fbc-ab21-41cc-a17c-cb12655d4277', 'name': 'Алена'},
    {'id': '02bd2e9c-3f89-444c-a313-d3eb131e8b2b', 'name': 'Иван'},
    {'id': '5a7040f9-a0ac-4e2b-8797-29369c77575a', 'name': 'Надежда'},
    {'id': '1e164d83-4411-4c94-b8e5-ecea9e038546', 'name': 'Скарга'},
    {'id': '985b5e69-78de-48a6-aea4-3e0dd3ce4e97', 'name': 'Татьяна'},
]


def normalize_phone(raw):
    if not raw:
        return ''
    s = re.sub(r'\D', '', str(raw))
    if s.startswith('7') and len(s) == 11:
        return '+' + s
    if s.startswith('8') and len(s) == 11:
        return '+7' + s[1:]
    if s.startswith('9') and len(s) == 10:
        return '+7' + s
    return ''


def log(msg):
    ts = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line)
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(line + '\n')


def main():
    log('=== Daily Excel Import Started ===')
    
    try:
        import pandas as pd
        df = pd.read_excel(EXCEL_FILE)
        log(f'Excel rows: {len(df)}')
    except Exception as e:
        log(f'ERROR reading Excel: {e}')
        sys.exit(1)
    
    leads = []
    for _, row in df.iterrows():
        phone = normalize_phone(row.get('Мобильный телефон'))
        name = row.get('Название лида') or row.get('Имя') or ''
        if phone:
            leads.append({'phone': phone, 'name': str(name).strip()})
    
    log(f'Valid leads in file: {len(leads)}')
    
    sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY'])
    
    existing = sb.table('candidates').select('phone').execute()
    existing_phones = set(normalize_phone(c['phone']) for c in existing.data)
    log(f'Existing phones in CRM: {len(existing_phones)}')
    
    new_leads = [l for l in leads if normalize_phone(l['phone']) not in existing_phones]
    log(f'New leads after dedup: {len(new_leads)}')
    
    if len(new_leads) == 0:
        log('No new leads to import. Done.')
        return
    
    batch = new_leads[:BATCH_SIZE]
    log(f'Importing batch of {len(batch)} leads')
    
    imports = []
    for i, lead in enumerate(batch):
        mgr = MANAGERS[i % len(MANAGERS)]
        imports.append({
            'phone': lead['phone'],
            'full_name': lead['name'] if lead['name'] else None,
            'manager_id': mgr['id'],
            'status': 'На обзвон',
            'lead_source': 'Загружено из Excel',
            'imported_from_sheets': False,
        })
    
    sb.table('candidates').insert(imports).execute()
    log(f'Inserted {len(imports)} candidates')
    
    for mgr in MANAGERS:
        cnt = sum(1 for c in imports if c['manager_id'] == mgr['id'])
        log(f'  {mgr["name"]}: {cnt}')
    
    remaining = len(new_leads) - len(batch)
    log(f'Remaining in file: {remaining}')
    
    log('=== Daily Excel Import Complete ===')


if __name__ == '__main__':
    main()
