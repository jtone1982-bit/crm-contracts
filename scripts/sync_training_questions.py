#!/usr/bin/env python3
"""Sync training questions and theory content from Google Sheets 'Памятка 2026' to Supabase."""
import json
import os
import random
from typing import List, Dict, Any

from google.oauth2 import service_account
from googleapiclient.discovery import build
from supabase import create_client, Client

SPREADSHEET_ID = '1giQnDsU24PJ8kGkXP6adn3uNEEt8SYuns1R_jZ6YXco'
SERVICE_ACCOUNT_FILE = '/opt/sa_key.json'

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://qwwikbmvdwgaekxmekbe.supabase.co')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

MODULES = [
    ('Чек-лист', 'checklist', 'Чек-лист куратора', 10, False),
    ('Справочник по болезням', 'diseases', 'Справочник по болезням', 20, False),
    ('Общие правила', 'rules', 'Общие правила приёма', 30, False),
    ('Программы', 'programs', 'Программы', 40, False),
    ('Направления', 'directions', 'Направления и города', 50, False),
    ('Подбор', 'selection', 'Подбор направления', 60, False),
    ('Звания', 'ranks', 'Воинские звания', 70, False),
    ('АФК', 'afk', 'Африканский корпус (АФК)', 80, False),
    ('Регламент работы', 'regulations', 'Регламент работы куратора', 90, False),
    ('Техника продаж', 'sales', 'Техника продаж', 100, False),
]


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_sheets_service():
    scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    creds = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
    return build('sheets', 'v4', credentials=creds)


def normalize_text(text: str) -> str:
    if not text:
        return ''
    return ' '.join(str(text).replace('\n', ' ').split())


def make_options(correct: str, distractors: List[str], count: int = 4) -> List[str]:
    correct = normalize_text(correct)
    unique_distractors = []
    seen = {correct.lower()}
    for d in distractors:
        d = normalize_text(d)
        if not d or d.lower() in seen:
            continue
        seen.add(d.lower())
        unique_distractors.append(d)

    options = [correct] + unique_distractors[:count - 1]
    generic = [
        'Информация не указана в памятке',
        'Зависит от региона кандидата',
        'Требуется уточнение у руководителя',
        'Не влияет на результат подбора',
        'Решается индивидуально',
        'Возможно только при наличии медзаключения',
    ]
    while len(options) < count:
        added = False
        for g in generic:
            if g.lower() not in seen:
                seen.add(g.lower())
                options.append(g)
                added = True
                break
        if not added:
            options.append('Уточните в памятке')
            break

    random.shuffle(options)
    return options


def deduplicate_questions(questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen_text = set()
    result = []
    for q in questions:
        text = q['question_text'].lower()
        if text not in seen_text:
            seen_text.add(text)
            result.append(q)
    return result


# ---------- QUESTION BUILDERS ----------

def build_checklist_questions(rows: List[List[str]]) -> List[Dict[str, Any]]:
    questions = []
    items = []
    for row in rows[1:]:
        if len(row) < 3:
            continue
        step = normalize_text(row[0])
        check = normalize_text(row[1])
        note = normalize_text(row[2])
        if not check:
            continue
        items.append({'step': step, 'check': check, 'note': note})

    checks = [i['check'] for i in items]
    for i in items:
        distractors = [x for x in checks if x != i['check']]
        q = f"Что необходимо сделать на этапе \"{i['step']}\"?"
        questions.append({
            'question_text': q,
            'options': make_options(i['check'], distractors),
            'correct_answer': i['check'],
            'explanation': i['note'] or 'Действие из чек-листа куратора.',
            'source_row_data': i,
        })
    return deduplicate_questions(questions)


def build_disease_questions(rows: List[List[str]]) -> List[Dict[str, Any]]:
    questions = []
    diseases = []
    for row in rows[1:]:
        if len(row) < 3:
            continue
        disease = normalize_text(row[0])
        key = normalize_text(row[1])
        cities = normalize_text(row[2])
        if not disease:
            continue
        diseases.append({'disease': disease, 'key': key, 'cities': cities})

    all_cities = [d['cities'] for d in diseases if d['cities']]
    all_diseases = [d['disease'] for d in diseases]

    for d in diseases:
        if d['cities'] and d['cities'].lower() not in ['не найдено', 'нет']:
            questions.append({
                'question_text': f"Где принимают кандидатов с диагнозом \"{d['disease']}\"?",
                'options': make_options(d['cities'], all_cities),
                'correct_answer': d['cities'],
                'explanation': f"Ключ поиска по справочнику: {d['key']}",
                'source_row_data': d,
            })
        if d['cities'] and d['cities'].lower() not in ['не найдено', 'нет']:
            questions.append({
                'question_text': f"Какой диагноз связан с направлением \"{d['cities']}\" по справочнику?",
                'options': make_options(d['disease'], all_diseases),
                'correct_answer': d['disease'],
                'explanation': f"Ключ поиска: {d['key']}",
                'source_row_data': d,
            })
        if d['key']:
            questions.append({
                'question_text': f"Какой диагноз ищут по ключу \"{d['key']}\"?",
                'options': make_options(d['disease'], all_diseases),
                'correct_answer': d['disease'],
                'explanation': f"Города приёма: {d['cities']}",
                'source_row_data': d,
            })
    return deduplicate_questions(questions)


def build_rules_questions(rows: List[List[str]]) -> List[Dict[str, Any]]:
    questions = []
    rules = []
    for row in rows[1:]:
        if len(row) < 2:
            continue
        rule = normalize_text(row[0])
        text = normalize_text(row[1])
        if not rule or not text:
            continue
        rules.append({'rule': rule, 'text': text})

    rule_titles = [r['rule'] for r in rules]
    rule_texts = [r['text'] for r in rules]

    for r in rules:
        questions.append({
            'question_text': f"Какое общее правило описывает следующее: \"{r['text']}\"?",
            'options': make_options(r['rule'], rule_titles),
            'correct_answer': r['rule'],
            'explanation': '',
            'source_row_data': r,
        })
        questions.append({
            'question_text': f"Что означает правило \"{r['rule']}\"?",
            'options': make_options(r['text'], rule_texts),
            'correct_answer': r['text'],
            'explanation': '',
            'source_row_data': r,
        })
    return deduplicate_questions(questions)


def build_programs_questions(rows: List[List[str]]) -> List[Dict[str, Any]]:
    questions = []
    programs = []
    for row in rows[1:]:
        if len(row) < 5:
            continue
        program = normalize_text(row[0])
        essence = normalize_text(row[1])
        requirements = normalize_text(row[2])
        age = normalize_text(row[3])
        note = normalize_text(row[4]) if len(row) > 4 else ''
        if not program:
            continue
        programs.append({'program': program, 'essence': essence, 'requirements': requirements, 'age': age, 'note': note})

    names = [p['program'] for p in programs]
    essences = [p['essence'] for p in programs if p['essence']]
    requirements = [p['requirements'] for p in programs if p['requirements']]
    ages = [p['age'] for p in programs if p['age']]

    for p in programs:
        if p['essence']:
            questions.append({
                'question_text': f"Чем отличается программа \"{p['program']}\"?",
                'options': make_options(p['essence'], essences),
                'correct_answer': p['essence'],
                'explanation': f"Требования: {p['requirements']}. Возраст: {p['age']}",
                'source_row_data': p,
            })
        if p['requirements']:
            questions.append({
                'question_text': f"Какие требования предъявляются по программе \"{p['program']}\"?",
                'options': make_options(p['requirements'], requirements),
                'correct_answer': p['requirements'],
                'explanation': f"Суть программы: {p['essence']}",
                'source_row_data': p,
            })
        if p['age']:
            questions.append({
                'question_text': f"Какой возрастной диапазон у программы \"{p['program']}\"?",
                'options': make_options(p['age'], ages),
                'correct_answer': p['age'],
                'explanation': f"Требования: {p['requirements']}",
                'source_row_data': p,
            })
        if p['essence']:
            questions.append({
                'question_text': f"О какой программе идёт речь: \"{p['essence']}\"?",
                'options': make_options(p['program'], names),
                'correct_answer': p['program'],
                'explanation': f"Возраст: {p['age']}",
                'source_row_data': p,
            })
    return deduplicate_questions(questions)


def build_directions_questions(rows: List[List[str]]) -> List[Dict[str, Any]]:
    questions = []
    directions = []
    for row in rows[1:]:
        if len(row) < 3:
            continue
        city = normalize_text(row[0])
        region = normalize_text(row[1]) if len(row) > 1 else ''
        edv = normalize_text(row[2]) if len(row) > 2 else ''
        zp = normalize_text(row[3]) if len(row) > 3 else ''
        age = normalize_text(row[4]) if len(row) > 4 else ''
        vvk = normalize_text(row[5]) if len(row) > 5 else ''
        status = normalize_text(row[13]) if len(row) > 13 else ''
        if not city:
            continue
        directions.append({'city': city, 'region': region, 'edv': edv, 'zp': zp, 'age': age, 'vvk': vvk, 'status': status})

    cities = [d['city'] for d in directions]
    edvs = [d['edv'] for d in directions if d['edv']]
    zps = [d['zp'] for d in directions if d['zp']]
    ages = [d['age'] for d in directions if d['age']]
    vvks = [d['vvk'] for d in directions if d['vvk']]

    active = [d for d in directions if d['status'].lower() != 'стоп']

    for d in active:
        if d['edv']:
            questions.append({
                'question_text': f"Какая ЕДВ предусмотрена в направлении \"{d['city']}\"?",
                'options': make_options(d['edv'], edvs),
                'correct_answer': d['edv'],
                'explanation': f"ЗП: {d['zp']}, возраст: {d['age']}",
                'source_row_data': d,
            })
        if d['age']:
            questions.append({
                'question_text': f"Какой возрастной диапазон в направлении \"{d['city']}\"?",
                'options': make_options(d['age'], ages),
                'correct_answer': d['age'],
                'explanation': f"ВВК: {d['vvk']}",
                'source_row_data': d,
            })
        if d['zp']:
            questions.append({
                'question_text': f"Какая ЗП в направлении \"{d['city']}\"?",
                'options': make_options(d['zp'], zps),
                'correct_answer': d['zp'],
                'explanation': f"ЕДВ: {d['edv']}",
                'source_row_data': d,
            })
        if d['vvk']:
            questions.append({
                'question_text': f"Какие требования по ВВК в направлении \"{d['city']}\"?",
                'options': make_options(d['vvk'], vvks),
                'correct_answer': d['vvk'],
                'explanation': f"ЗП: {d['zp']}",
                'source_row_data': d,
            })
        if d['edv'] and d['zp']:
            questions.append({
                'question_text': f"Какое направление предлагает ЕДВ {d['edv']} и ЗП {d['zp']}?",
                'options': make_options(d['city'], cities),
                'correct_answer': d['city'],
                'explanation': f"Возраст: {d['age']}",
                'source_row_data': d,
            })
    return deduplicate_questions(questions)


def build_selection_questions(rows: List[List[str]]) -> List[Dict[str, Any]]:
    questions = []
    items = []
    for row in rows[3:]:
        if len(row) < 4:
            continue
        city = normalize_text(row[0])
        edv = normalize_text(row[1])
        zp = normalize_text(row[2])
        age = normalize_text(row[3])
        if not city or not edv:
            continue
        items.append({'city': city, 'edv': edv, 'zp': zp, 'age': age})

    cities = [i['city'] for i in items]
    for i in items:
        questions.append({
            'question_text': f"Какое направление подходит под параметры: ЕДВ {i['edv']}, ЗП {i['zp']}?",
            'options': make_options(i['city'], cities),
            'correct_answer': i['city'],
            'explanation': f"Возраст: {i['age']}",
            'source_row_data': i,
        })
        if i['zp']:
            questions.append({
                'question_text': f"Какие условия предлагает направление \"{i['city']}\"?",
                'options': make_options(f"ЕДВ {i['edv']}, ЗП {i['zp']}", [f"ЕДВ {x['edv']}, ЗП {x['zp']}" for x in items]),
                'correct_answer': f"ЕДВ {i['edv']}, ЗП {i['zp']}",
                'explanation': f"Возраст: {i['age']}",
                'source_row_data': i,
            })
    return deduplicate_questions(questions)


def build_ranks_questions(rows: List[List[str]]) -> List[Dict[str, Any]]:
    questions = []
    ranks = []
    current_category = ''
    for row in rows[3:]:
        if len(row) < 3:
            continue
        category = normalize_text(row[0]) or current_category
        subcategory = normalize_text(row[1])
        rank = normalize_text(row[2])
        note = normalize_text(row[3]) if len(row) > 3 else ''
        if category:
            current_category = category
        if not rank:
            continue
        ranks.append({'category': current_category, 'subcategory': subcategory, 'rank': rank, 'note': note})

    all_ranks = [r['rank'] for r in ranks]
    all_categories = list(set(r['category'] for r in ranks if r['category']))

    for r in ranks:
        same_cat = [x['rank'] for x in ranks if x['category'] == r['category'] and x['rank'] != r['rank']]
        questions.append({
            'question_text': f"Какое звание относится к категории \"{r['category']}\"?",
            'options': make_options(r['rank'], same_cat or all_ranks),
            'correct_answer': r['rank'],
            'explanation': r['note'] or f"Подкатегория: {r['subcategory']}",
            'source_row_data': r,
        })
        questions.append({
            'question_text': f"К какой категории относится звание \"{r['rank']}\"?",
            'options': make_options(r['category'], all_categories),
            'correct_answer': r['category'],
            'explanation': r['note'] or '',
            'source_row_data': r,
        })
    return deduplicate_questions(questions)


def build_afk_questions(rows: List[List[str]]) -> List[Dict[str, Any]]:
    questions = []
    sections = []
    current_section = ''
    for row in rows[3:]:
        if len(row) < 3:
            continue
        section = normalize_text(row[0]) or current_section
        num = normalize_text(row[1])
        text = normalize_text(row[2])
        if section:
            current_section = section
        if not text:
            continue
        sections.append({'section': current_section, 'num': num, 'text': text})

    all_texts = [s['text'] for s in sections]
    all_sections = list(set(s['section'] for s in sections if s['section']))

    for s in sections:
        same_section = [x['text'] for x in sections if x['section'] == s['section'] and x['text'] != s['text']]
        questions.append({
            'question_text': f"Какой пункт относится к разделу \"{s['section']}\" в Африканском корпусе?",
            'options': make_options(s['text'], same_section or all_texts),
            'correct_answer': s['text'],
            'explanation': '',
            'source_row_data': s,
        })
        questions.append({
            'question_text': f"К какому разделу АФК относится следующий пункт: \"{s['text']}\"?",
            'options': make_options(s['section'], all_sections),
            'correct_answer': s['section'],
            'explanation': '',
            'source_row_data': s,
        })
    return deduplicate_questions(questions)


def build_regulations_questions(rows: List[List[str]]) -> List[Dict[str, Any]]:
    questions = []
    regs = []
    current_section = ''
    for row in rows[3:]:
        if len(row) < 2:
            continue
        section = normalize_text(row[0]) or current_section
        text = normalize_text(row[1])
        if section:
            current_section = section
        if not text:
            continue
        regs.append({'section': section, 'text': text})

    all_texts = [r['text'] for r in regs]
    all_sections = list(set(r['section'] for r in regs if r['section']))

    for r in regs:
        same_section = [x['text'] for x in regs if x['section'] == r['section'] and x['text'] != r['text']]
        questions.append({
            'question_text': f"Что входит в пункт регламента \"{r['section']}\"?",
            'options': make_options(r['text'], same_section or all_texts),
            'correct_answer': r['text'],
            'explanation': '',
            'source_row_data': r,
        })
        questions.append({
            'question_text': f"К какому пункту регламента относится: \"{r['text']}\"?",
            'options': make_options(r['section'], all_sections),
            'correct_answer': r['section'],
            'explanation': '',
            'source_row_data': r,
        })
    return deduplicate_questions(questions)


def build_sales_questions(rows: List[List[str]]) -> List[Dict[str, Any]]:
    questions = []
    items = []
    current_section = ''
    for row in rows[3:]:
        if len(row) < 3:
            continue
        section = normalize_text(row[0]) or current_section
        num = normalize_text(row[1])
        text = normalize_text(row[2])
        if section:
            current_section = section
        if not text or len(text) < 10:
            continue
        items.append({'section': section, 'num': num, 'text': text})

    all_texts = [i['text'] for i in items]
    all_sections = list(set(i['section'] for i in items if i['section']))

    for i in items:
        same_section = [x['text'] for x in items if x['section'] == i['section'] and x['text'] != i['text']]
        questions.append({
            'question_text': f"Какой совет/пункт относится к разделу техники продаж \"{i['section']}\"?",
            'options': make_options(i['text'], same_section or all_texts),
            'correct_answer': i['text'],
            'explanation': '',
            'source_row_data': i,
        })
        questions.append({
            'question_text': f"К какому разделу техники продаж относится: \"{i['text']}\"?",
            'options': make_options(i['section'], all_sections),
            'correct_answer': i['section'],
            'explanation': '',
            'source_row_data': i,
        })
    return deduplicate_questions(questions)


QUESTION_BUILDERS = {
    'Чек-лист': build_checklist_questions,
    'Справочник по болезням': build_disease_questions,
    'Общие правила': build_rules_questions,
    'Программы': build_programs_questions,
    'Направления': build_directions_questions,
    'Подбор': build_selection_questions,
    'Звания': build_ranks_questions,
    'АФК': build_afk_questions,
    'Регламент работы': build_regulations_questions,
    'Техника продаж': build_sales_questions,
}


# ---------- CONTENT BUILDERS (theory) ----------

def extract_checklist_content(rows: List[List[str]]) -> List[Dict[str, Any]]:
    content = []
    for row in rows[1:]:
        if len(row) < 3:
            continue
        step = normalize_text(row[0])
        check = normalize_text(row[1])
        note = normalize_text(row[2])
        if not step and not check:
            continue
        content.append({
            'type': 'step',
            'step': step,
            'title': check,
            'description': note,
        })
    return content


def extract_diseases_content(rows: List[List[str]]) -> List[Dict[str, Any]]:
    content = []
    for row in rows[1:]:
        if len(row) < 3:
            continue
        disease = normalize_text(row[0])
        key = normalize_text(row[1])
        cities = normalize_text(row[2])
        if not disease:
            continue
        content.append({
            'type': 'card',
            'title': disease,
            'subtitle': f"Ключ поиска: {key}" if key else '',
            'description': f"Города приёма: {cities}" if cities else '',
        })
    return content


def extract_rules_content(rows: List[List[str]]) -> List[Dict[str, Any]]:
    content = []
    for row in rows[1:]:
        if len(row) < 2:
            continue
        rule = normalize_text(row[0])
        text = normalize_text(row[1])
        if not rule or not text:
            continue
        content.append({
            'type': 'rule',
            'title': rule,
            'description': text,
        })
    return content


def extract_programs_content(rows: List[List[str]]) -> List[Dict[str, Any]]:
    content = []
    for row in rows[1:]:
        if len(row) < 5:
            continue
        program = normalize_text(row[0])
        essence = normalize_text(row[1])
        requirements = normalize_text(row[2])
        age = normalize_text(row[3])
        note = normalize_text(row[4]) if len(row) > 4 else ''
        if not program:
            continue
        content.append({
            'type': 'program',
            'title': program,
            'description': essence,
            'requirements': requirements,
            'age': age,
            'note': note,
        })
    return content


def extract_directions_content(rows: List[List[str]]) -> List[Dict[str, Any]]:
    content = []
    current_region = ''
    for row in rows[1:]:
        if len(row) < 3:
            continue
        city = normalize_text(row[0])
        region = normalize_text(row[1]) if len(row) > 1 else ''
        edv = normalize_text(row[2]) if len(row) > 2 else ''
        zp = normalize_text(row[3]) if len(row) > 3 else ''
        age = normalize_text(row[4]) if len(row) > 4 else ''
        vvk = normalize_text(row[5]) if len(row) > 5 else ''
        status = normalize_text(row[13]) if len(row) > 13 else ''
        if region and region != current_region:
            current_region = region
            content.append({'type': 'section', 'title': region})
        if not city:
            continue
        content.append({
            'type': 'direction',
            'title': city,
            'status': status,
            'edv': edv,
            'zp': zp,
            'age': age,
            'vvk': vvk,
        })
    return content


def extract_selection_content(rows: List[List[str]]) -> List[Dict[str, Any]]:
    content = []
    for row in rows[3:]:
        if len(row) < 4:
            continue
        city = normalize_text(row[0])
        edv = normalize_text(row[1])
        zp = normalize_text(row[2])
        age = normalize_text(row[3])
        if not city:
            continue
        content.append({
            'type': 'selection',
            'title': city,
            'edv': edv,
            'zp': zp,
            'age': age,
        })
    return content


def extract_ranks_content(rows: List[List[str]]) -> List[Dict[str, Any]]:
    content = []
    current_category = ''
    for row in rows[3:]:
        if len(row) < 3:
            continue
        category = normalize_text(row[0])
        subcategory = normalize_text(row[1])
        rank = normalize_text(row[2])
        note = normalize_text(row[3]) if len(row) > 3 else ''
        if category and category != current_category:
            current_category = category
            content.append({'type': 'section', 'title': category})
        if not rank:
            continue
        content.append({
            'type': 'rank',
            'title': rank,
            'subtitle': subcategory,
            'description': note,
        })
    return content


def extract_afk_content(rows: List[List[str]]) -> List[Dict[str, Any]]:
    content = []
    current_section = ''
    for row in rows[3:]:
        if len(row) < 3:
            continue
        section = normalize_text(row[0])
        num = normalize_text(row[1])
        text = normalize_text(row[2])
        if section and section != current_section:
            current_section = section
            content.append({'type': 'section', 'title': section})
        if not text:
            continue
        content.append({
            'type': 'point',
            'num': num,
            'description': text,
        })
    return content


def extract_regulations_content(rows: List[List[str]]) -> List[Dict[str, Any]]:
    content = []
    current_section = ''
    for row in rows[3:]:
        if len(row) < 2:
            continue
        section = normalize_text(row[0])
        text = normalize_text(row[1])
        if section and section != current_section:
            current_section = section
            content.append({'type': 'section', 'title': section})
        if not text:
            continue
        content.append({
            'type': 'rule',
            'description': text,
        })
    return content


def extract_sales_content(rows: List[List[str]]) -> List[Dict[str, Any]]:
    content = []
    current_section = ''
    for row in rows[3:]:
        if len(row) < 3:
            continue
        section = normalize_text(row[0])
        num = normalize_text(row[1])
        text = normalize_text(row[2])
        if section and section != current_section:
            current_section = section
            content.append({'type': 'section', 'title': section})
        if not text or len(text) < 10:
            continue
        content.append({
            'type': 'tip',
            'num': num,
            'description': text,
        })
    return content


CONTENT_BUILDERS = {
    'Чек-лист': extract_checklist_content,
    'Справочник по болезням': extract_diseases_content,
    'Общие правила': extract_rules_content,
    'Программы': extract_programs_content,
    'Направления': extract_directions_content,
    'Подбор': extract_selection_content,
    'Звания': extract_ranks_content,
    'АФК': extract_afk_content,
    'Регламент работы': extract_regulations_content,
    'Техника продаж': extract_sales_content,
}


# ---------- SYNC ----------

def sync_modules(supabase: Client, sheet_data: Dict[str, List[List[str]]]):
    existing = supabase.table('training_modules').select('slug').execute().data or []
    existing_slugs = {m['slug'] for m in existing}

    for sheet, slug, title, order, is_final in MODULES:
        content = []
        builder = CONTENT_BUILDERS.get(sheet)
        if builder and sheet_data.get(sheet):
            content = builder(sheet_data[sheet])

        payload = {
            'title': title,
            'source_sheet': sheet,
            'order_index': order,
            'is_final': is_final,
            'passing_score': 90 if is_final else 85,
            'content': content,
        }

        if slug in existing_slugs:
            supabase.table('training_modules').update(payload).eq('slug', slug).execute()
        else:
            payload['slug'] = slug
            payload['active'] = True
            supabase.table('training_modules').insert(payload).execute()

    if 'final-exam' not in existing_slugs:
        supabase.table('training_modules').insert({
            'slug': 'final-exam',
            'title': 'Финальный экзамен',
            'source_sheet': 'ALL',
            'order_index': 1000,
            'is_final': True,
            'passing_score': 90,
            'active': True,
            'content': [{'type': 'info', 'title': 'Финальный экзамен', 'description': 'Вопросы из всех разделов. Сначала изучите каждый раздел.'}],
        }).execute()
    else:
        supabase.table('training_modules').update({
            'title': 'Финальный экзамен',
            'passing_score': 90,
        }).eq('slug', 'final-exam').execute()


def sync_questions(supabase: Client, sheet_data: Dict[str, List[List[str]]]):
    modules = supabase.table('training_modules').select('id, slug, source_sheet').execute().data or []
    module_by_slug = {m['slug']: m for m in modules}

    all_module_questions = []

    for sheet, slug, _, _, _ in MODULES:
        if slug not in module_by_slug:
            continue
        module_id = module_by_slug[slug]['id']
        rows = sheet_data.get(sheet, [])
        builder = QUESTION_BUILDERS.get(sheet)
        if not builder or not rows:
            continue

        questions = builder(rows)
        if len(questions) > 25:
            questions = random.sample(questions, 25)

        supabase.table('training_questions').delete().eq('module_id', module_id).execute()
        if questions:
            batch = []
            for q in questions:
                batch.append({
                    'module_id': module_id,
                    'question_text': q['question_text'],
                    'options': q['options'],
                    'correct_answer': q['correct_answer'],
                    'explanation': q.get('explanation', ''),
                    'source_row_data': q.get('source_row_data', {}),
                    'question_type': 'single_choice',
                    'active': True,
                })
            supabase.table('training_questions').insert(batch).execute()
            print(f"Module {slug}: inserted {len(batch)} questions")
            all_module_questions.extend(questions)
        else:
            print(f"Module {slug}: no questions generated")

    final_module = module_by_slug.get('final-exam')
    if final_module and all_module_questions:
        final_pool = deduplicate_questions(all_module_questions)
        selected = random.sample(final_pool, min(30, len(final_pool)))
        supabase.table('training_questions').delete().eq('module_id', final_module['id']).execute()
        batch = []
        for q in selected:
            batch.append({
                'module_id': final_module['id'],
                'question_text': q['question_text'],
                'options': q['options'],
                'correct_answer': q['correct_answer'],
                'explanation': q.get('explanation', ''),
                'source_row_data': q.get('source_row_data', {}),
                'question_type': 'single_choice',
                'active': True,
            })
        supabase.table('training_questions').insert(batch).execute()
        print(f"Final exam: inserted {len(batch)} questions")


def main():
    supabase = get_supabase()
    sheets_service = get_sheets_service()

    meta = sheets_service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
    sheet_names = [s['properties']['title'] for s in meta.get('sheets', [])]

    sheet_data = {}
    for name in sheet_names:
        res = sheets_service.spreadsheets().values().get(spreadsheetId=SPREADSHEET_ID, range=name).execute()
        sheet_data[name] = res.get('values', [])
        print(f"Sheet '{name}': {len(sheet_data[name])} rows")

    sync_modules(supabase, sheet_data)
    sync_questions(supabase, sheet_data)
    print('Sync complete')


if __name__ == '__main__':
    main()
