#!/usr/bin/env python3
"""Sync training questions and theory content from Google Sheets 'Памятка 2026' to Supabase."""
import json
import os
import random
from typing import List, Dict, Any, Optional

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
    ('_Подбор_raw', 'selection', 'Подбор направления', 60, False),
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

    options = [correct] + unique_distractors
    # Cap to requested count, but don't pad with nonsense if there aren't enough real distractors
    options = options[:max(2, min(count, len(options)))]
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
    """Build practical situational checklist questions from notes."""
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
    notes = [i['note'] for i in items if i['note']]

    for i in items:
        # Main question: what to check given a real work situation
        if i['note'] and len(i['note']) > 10:
            # Situation described in note, answer is the check item
            questions.append({
                'question_text': f"{i['note']}",
                'options': make_options(i['check'], checks),
                'correct_answer': i['check'],
                'explanation': f"Шаг {i['step']}: {i['check']}",
                'source_row_data': i,
            })

        # Reverse question: what do we verify at this step?
        if i['note'] and len(i['note']) > 10:
            questions.append({
                'question_text': f"Что важно проверить на шаге \"{i['check']}\"?",
                'options': make_options(i['note'], notes),
                'correct_answer': i['note'],
                'explanation': f"Шаг {i['step']}: {i['check']}",
                'source_row_data': i,
            })

    return deduplicate_questions(questions)


def build_disease_questions(rows: List[List[str]]) -> List[Dict[str, Any]]:
    """Multiple-choice questions from disease reference."""
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

    all_diseases = [d['disease'] for d in diseases]
    # Build per-city disease lists for multi-select questions
    city_to_diseases: Dict[str, List[str]] = {}
    for d in diseases:
        if not d['cities'] or d['cities'].lower() in ['не найдено', 'нет']:
            continue
        for city in [c.strip() for c in d['cities'].split(';') if c.strip()]:
            city_to_diseases.setdefault(city, []).append(d['disease'])

    all_cities = list(city_to_diseases.keys())

    # Q1: Which cities accept a given disease (multiple correct)
    for d in diseases:
        if not d['cities'] or d['cities'].lower() in ['не найдено', 'нет']:
            continue
        correct_cities = [c.strip() for c in d['cities'].split(';') if c.strip()]
        if len(correct_cities) < 2:
            continue
        # Ensure all correct cities are in options, then add distractors up to 8 total
        distractors = [c for c in all_cities if c not in correct_cities]
        needed = max(0, 8 - len(correct_cities))
        options = list(dict.fromkeys(correct_cities + distractors))[:max(len(correct_cities), 8)]
        questions.append({
            'question_text': f"В каких городах принимают кандидатов с диагнозом \"{d['disease']}\"? (выберите все подходящие)",
            'options': options,
            'correct_answer': correct_cities,
            'explanation': f"Города приёма: {d['cities']}",
            'source_row_data': d,
            'question_type': 'multiple_choice',
        })

    # Q2: Which diseases are accepted in a given city (multiple correct)
    for city, disease_list in city_to_diseases.items():
        if len(disease_list) < 2:
            continue
        distractors = [d for d in all_diseases if d not in disease_list]
        needed = max(0, 8 - len(disease_list))
        options = list(dict.fromkeys(disease_list + distractors))[:max(len(disease_list), 8)]
        questions.append({
            'question_text': f"Какие диагнозы принимают в направлении \"{city}\"? (выберите все подходящие)",
            'options': options,
            'correct_answer': disease_list,
            'explanation': f"Всего диагнозов для этого направления: {len(disease_list)}",
            'source_row_data': {'city': city, 'diseases': disease_list},
            'question_type': 'multiple_choice',
        })

    # Q3: Single-choice reverse — find disease by city
    for d in diseases:
        if not d['cities'] or d['cities'].lower() in ['не найдено', 'нет']:
            continue
        first_city = d['cities'].split(';')[0].strip()
        questions.append({
            'question_text': f"Какой диагноз связан с направлением \"{first_city}\"?",
            'options': make_options(d['disease'], all_diseases),
            'correct_answer': d['disease'],
            'explanation': f"Города приёма: {d['cities']}",
            'source_row_data': d,
            'question_type': 'single_choice',
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

    active = [d for d in directions if d['status'].lower() != 'стоп']
    if not active:
        return []

    cities = [d['city'] for d in active]
    edvs = [d['edv'] for d in active if d['edv']]
    zps = [d['zp'] for d in active if d['zp']]
    ages = [d['age'] for d in active if d['age']]
    vvks = [d['vvk'] for d in active if d['vvk']]

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
    """Multiple-choice questions for direction selection using all candidate criteria."""
    questions = []
    items = []
    for row in rows[1:]:
        if len(row) < 4:
            continue
        city = normalize_text(row[0])
        if not city:
            continue
        items.append({
            'city': city,
            'program': normalize_text(row[1]) if len(row) > 1 else '',
            'edv': normalize_text(row[2]) if len(row) > 2 else '',
            'zp': normalize_text(row[3]) if len(row) > 3 else '',
            'age': normalize_text(row[4]) if len(row) > 4 else '',
            'vvk': normalize_text(row[5]) if len(row) > 5 else '',
            'foreign': normalize_text(row[6]) if len(row) > 6 else '',
            'diseases': normalize_text(row[7]) if len(row) > 7 else '',
            'health_group': normalize_text(row[8]) if len(row) > 8 else '',
            'drivers': normalize_text(row[9]) if len(row) > 9 else '',
            'bpla': normalize_text(row[10]) if len(row) > 10 else '',
            'programs': normalize_text(row[11]) if len(row) > 11 else '',
            'relations': normalize_text(row[12]) if len(row) > 12 else '',
            'status': normalize_text(row[13]) if len(row) > 13 else '',
            'note': normalize_text(row[14]) if len(row) > 14 else '',
        })

    if not items:
        return []

    active = [i for i in items if i['status'].lower() != 'стоп']
    if not active:
        return []

    all_cities = [i['city'] for i in active]

    def parse_list(text: str) -> List[str]:
        return [t.strip() for t in text.split(',') if t.strip()]

    # Multi-select: which cities accept specific disease
    disease_to_cities: Dict[str, List[str]] = {}
    for i in active:
        for d in parse_list(i['diseases']):
            disease_to_cities.setdefault(d, []).append(i['city'])
    for disease, cities in disease_to_cities.items():
        if len(cities) < 2:
            continue
        options = list(dict.fromkeys(cities + all_cities))[:max(len(cities), 8)]
        questions.append({
            'question_text': f"В каких направлениях принимают кандидатов с особенностью здоровья \"{disease}\"? (выберите все подходящие)",
            'options': options,
            'correct_answer': cities,
            'explanation': f"{len(cities)} направлений",
            'source_row_data': {'disease': disease, 'cities': cities},
            'question_type': 'multiple_choice',
        })

    # Multi-select: which cities accept foreigners/SNG
    foreign_to_cities: Dict[str, List[str]] = {}
    for i in active:
        if i['foreign']:
            key = i['foreign']
            if any(w in key for w in ['снг', 'иностран']):
                foreign_to_cities.setdefault('СНГ / иностранцы', []).append(i['city'])
            else:
                foreign_to_cities.setdefault(key, []).append(i['city'])
    for label, cities in foreign_to_cities.items():
        if len(cities) < 2:
            continue
        options = list(dict.fromkeys(cities + all_cities))[:max(len(cities), 8)]
        questions.append({
            'question_text': f"Какие направления работают с \"{label}\"? (выберите все подходящие)",
            'options': options,
            'correct_answer': cities,
            'explanation': f"{len(cities)} направлений",
            'source_row_data': {'label': label, 'cities': cities},
            'question_type': 'multiple_choice',
        })

    # Multi-select: which cities are suitable for BPLA
    bpla_cities = [i['city'] for i in active if 'да' in i['bpla'].lower()]
    if len(bpla_cities) >= 2:
        options = list(dict.fromkeys(bpla_cities + all_cities))[:max(len(bpla_cities), 8)]
        questions.append({
            'question_text': 'В каких направлениях есть потребность в операторах БПЛА? (выберите все подходящие)',
            'options': options,
            'correct_answer': bpla_cities,
            'explanation': f"{len(bpla_cities)} направлений",
            'source_row_data': {'bpla': 'да', 'cities': bpla_cities},
            'question_type': 'multiple_choice',
        })

    # Multi-select: which cities accept drivers
    driver_cities = [i['city'] for i in active if i['drivers']]
    if len(driver_cities) >= 2:
        options = list(dict.fromkeys(driver_cities + all_cities))[:max(len(driver_cities), 8)]
        questions.append({
            'question_text': 'В каких направлениях нужны водители? (выберите все подходящие)',
            'options': options,
            'correct_answer': driver_cities,
            'explanation': f"{len(driver_cities)} направлений",
            'source_row_data': {'drivers': 'да', 'cities': driver_cities},
            'question_type': 'multiple_choice',
        })

    # Multi-select: which cities match a given VVK strictness
    vvk_to_cities: Dict[str, List[str]] = {}
    for i in active:
        if i['vvk']:
            vvk_to_cities.setdefault(i['vvk'], []).append(i['city'])
    for vvk, cities in vvk_to_cities.items():
        if len(cities) < 2:
            continue
        options = list(dict.fromkeys(cities + all_cities))[:max(len(cities), 8)]
        questions.append({
            'question_text': f"Какие направления имеют требования по ВВК \"{vvk}\"? (выберите все подходящие)",
            'options': options,
            'correct_answer': cities,
            'explanation': f"{len(cities)} направлений",
            'source_row_data': {'vvk': vvk, 'cities': cities},
            'question_type': 'multiple_choice',
        })

    # Single-choice: best city for a candidate profile
    for i in active:
        features = []
        if i['diseases']:
            features.append(f"особенностью здоровья: {i['diseases']}")
        if i['foreign']:
            features.append(f"гражданством: {i['foreign']}")
        if i['drivers']:
            features.append(f"водительскими правами: {i['drivers']}")
        if i['bpla']:
            features.append(f"БПЛА: {i['bpla']}")
        if not features:
            continue
        questions.append({
            'question_text': f"Какое направление подходит для кандидата с {features[0]}?",
            'options': make_options(i['city'], all_cities),
            'correct_answer': i['city'],
            'explanation': f"Программа: {i['programs'] or i['program']}, примечание: {i['note']}",
            'source_row_data': i,
            'question_type': 'single_choice',
        })

    return deduplicate_questions(questions)


def build_ranks_questions(rows: List[List[str]]) -> List[Dict[str, Any]]:
    """Questions from 'Звания' using notes, subcategories and equivalents."""
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
        ranks.append({
            'category': current_category,
            'subcategory': subcategory,
            'rank': rank,
            'note': note,
        })

    all_ranks = [r['rank'] for r in ranks]
    all_categories = list(set(r['category'] for r in ranks if r['category']))
    all_subcategories = list(set(r['subcategory'] for r in ranks if r['subcategory']))

    for r in ranks:
        # Q1: by detailed note/description guess the rank
        if r['note'] and len(r['note']) > 15:
            questions.append({
                'question_text': f"О каком звании идёт речь: {r['note']}?",
                'options': make_options(r['rank'], all_ranks),
                'correct_answer': r['rank'],
                'explanation': f"Категория: {r['category']}, подкатегория: {r['subcategory']}",
                'source_row_data': r,
            })

        # Q2: category of the rank
        questions.append({
            'question_text': f"К какой категории относится звание \"{r['rank']}\"?",
            'options': make_options(r['category'], [c for c in all_categories if c != r['category']]),
            'correct_answer': r['category'],
            'explanation': f"Подкатегория: {r['subcategory']}",
            'source_row_data': r,
        })

        # Q3: subcategory
        if r['subcategory']:
            questions.append({
                'question_text': f"К какой подкатегории относится звание \"{r['rank']}\"?",
                'options': make_options(r['subcategory'], [s for s in all_subcategories if s != r['subcategory']]),
                'correct_answer': r['subcategory'],
                'explanation': f"Категория: {r['category']}",
                'source_row_data': r,
            })

        # Q4: which rank belongs to subcategory
        if r['subcategory']:
            same_sub = [x['rank'] for x in ranks if x['subcategory'] == r['subcategory'] and x['rank'] != r['rank']]
            questions.append({
                'question_text': f"Какое звание относится к подкатегории \"{r['subcategory']}\"?",
                'options': make_options(r['rank'], same_sub),
                'correct_answer': r['rank'],
                'explanation': f"Категория: {r['category']}",
                'source_row_data': r,
            })

    # Equivalents between naval and army ranks from notes
    equivalents = []
    for r in ranks:
        note = r['note'].lower()
        if 'соответствует званию' in note or 'соответствует' in note or 'совпадает' in note:
            # Try to extract mentioned rank
            for other in ranks:
                if other['rank'].lower() in note and other['rank'] != r['rank']:
                    equivalents.append((r['rank'], other['rank'], r['category']))
                    break

    for a, b, cat in equivalents:
        if cat == 'Корабельные':
            questions.append({
                'question_text': f"Какому войсковому званию соответствует корабельное звание \"{a}\"?",
                'options': make_options(b, all_ranks),
                'correct_answer': b,
                'explanation': f"Корабельное звание: {a}",
                'source_row_data': {'rank': a, 'equivalent': b},
            })
        else:
            questions.append({
                'question_text': f"Какому корабельному званию соответствует войсковое звание \"{a}\"?",
                'options': make_options(b, all_ranks),
                'correct_answer': b,
                'explanation': f"Войсковое звание: {a}",
                'source_row_data': {'rank': a, 'equivalent': b},
            })

    # Hierarchy questions based on standard Russian military rank order
    army_order = [
        'Рядовой', 'Ефрейтор', 'Младший сержант', 'Сержант', 'Старший сержант',
        'Старшина', 'Прапорщик', 'Старший прапорщик',
        'Младший лейтенант', 'Лейтенант', 'Старший лейтенант', 'Капитан',
        'Майор', 'Подполковник', 'Полковник'
    ]
    navy_order = [
        'Матрос', 'Старший матрос', 'Старшина 2-й статьи', 'Старшина 1-й статьи',
        'Главный старшина', 'Главный корабельный старшина', 'Мичман',
        'Младший лейтенант', 'Лейтенант', 'Старший лейтенант', 'Капитан-лейтенант',
        'Капитан 3-го ранга', 'Капитан 2-го ранга', 'Капитан 1-го ранга'
    ]

    def add_hierarchy_questions(order, prefix):
        present = [r for r in order if r in all_ranks]
        for i, rank in enumerate(present):
            # Next higher rank
            higher = []
            for j in range(i + 1, len(present)):
                if present[j]:
                    higher.append(present[j])
                    break
            if higher:
                questions.append({
                    'question_text': f"Какое {prefix} звание стоит выше \"{rank}\"?",
                    'options': make_options(higher[0], all_ranks),
                    'correct_answer': higher[0],
                    'explanation': f"После {rank} идёт {higher[0]}",
                    'source_row_data': {'rank': rank, 'higher': higher[0]},
                })
            # Next lower rank
            lower = []
            for j in range(i - 1, -1, -1):
                if present[j]:
                    lower.append(present[j])
                    break
            if lower:
                questions.append({
                    'question_text': f"Какое {prefix} звание стоит ниже \"{rank}\"?",
                    'options': make_options(lower[0], all_ranks),
                    'correct_answer': lower[0],
                    'explanation': f"Перед {rank} идёт {lower[0]}",
                    'source_row_data': {'rank': rank, 'lower': lower[0]},
                })

    add_hierarchy_questions(army_order, 'войсковое')
    add_hierarchy_questions(navy_order, 'корабельное')

    # Command scope questions
    command_facts = [
        ('Рядовой', 'не командует'),
        ('Ефрейтор', 'не командует'),
        ('Сержант', 'командир отделения'),
        ('Старший сержант', 'командир отделения'),
        ('Старшина', 'командир отделения'),
        ('Прапорщик', 'заместитель командира взвода'),
        ('Старший прапорщик', 'заместитель командира взвода'),
        ('Капитан', 'командир роты'),
        ('Майор', 'командир батальона'),
        ('Подполковник', 'командир батальона / полка'),
        ('Полковник', 'командир полка'),
    ]
    all_ranks_lower = [r.lower() for r in all_ranks]
    for rank, scope in command_facts:
        if rank.lower() in all_ranks_lower:
            actual_rank = next((r for r in all_ranks if r.lower() == rank.lower()), rank)
            questions.append({
                'question_text': f"Какая должность обычно соответствует званию \"{actual_rank}\"?",
                'options': make_options(scope, [s for _, s in command_facts]),
                'correct_answer': scope,
                'explanation': f"Звание: {actual_rank}",
                'source_row_data': {'rank': actual_rank, 'scope': scope},
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
    """Build questions from 'Техника продаж' sheet with proper section/body parsing."""
    questions = []
    items = []
    current_section = ''

    for row in rows[3:]:
        if not row:
            continue
        col0 = normalize_text(row[0]) if len(row) > 0 else ''
        col1 = normalize_text(row[1]) if len(row) > 1 else ''
        col2 = normalize_text(row[2]) if len(row) > 2 else ''

        if not col0 and not col1 and not col2:
            continue

        if col0:
            current_section = col0
            continue

        # Label + body
        if col2 and len(col1) <= 45:
            items.append({'section': current_section, 'label': col1, 'text': col2})
        elif col1:
            items.append({'section': current_section, 'label': '', 'text': col1})

    all_sections = list(set(i['section'] for i in items if i['section']))
    all_texts = [i['text'] for i in items]

    for i in items:
        same_section = [x['text'] for x in items if x['section'] == i['section'] and x['text'] != i['text']]
        # Q1: which body belongs to section
        questions.append({
            'question_text': f"Какой совет/пункт относится к разделу техники продаж \"{i['section']}\"?",
            'options': make_options(i['text'], same_section or all_texts),
            'correct_answer': i['text'],
            'explanation': '',
            'source_row_data': i,
        })
        # Q2: which section does this body belong to
        if i['section']:
            questions.append({
                'question_text': f"К какому разделу техники продаж относится: \"{i['text']}\"?",
                'options': make_options(i['section'], [s for s in all_sections if s != i['section']]),
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
    '_Подбор_raw': build_selection_questions,
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
            'subtitle': f"Поиск: {key}" if key else '',
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
        if status.lower() == 'стоп':
            continue
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
    for row in rows[1:]:
        if len(row) < 4:
            continue
        city = normalize_text(row[0])
        if not city:
            continue
        content.append({
            'type': 'selection',
            'title': city,
            'program': normalize_text(row[1]) if len(row) > 1 else '',
            'edv': normalize_text(row[2]) if len(row) > 2 else '',
            'zp': normalize_text(row[3]) if len(row) > 3 else '',
            'age': normalize_text(row[4]) if len(row) > 4 else '',
            'vvk': normalize_text(row[5]) if len(row) > 5 else '',
            'foreign': normalize_text(row[6]) if len(row) > 6 else '',
            'diseases': normalize_text(row[7]) if len(row) > 7 else '',
            'health_group': normalize_text(row[8]) if len(row) > 8 else '',
            'drivers': normalize_text(row[9]) if len(row) > 9 else '',
            'bpla': normalize_text(row[10]) if len(row) > 10 else '',
            'programs': normalize_text(row[11]) if len(row) > 11 else '',
            'relations': normalize_text(row[12]) if len(row) > 12 else '',
            'status': normalize_text(row[13]) if len(row) > 13 else '',
            'note': normalize_text(row[14]) if len(row) > 14 else '',
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
    """Extract sales training content with proper section/subsection/body structure."""
    content = []
    current_section = ''
    current_subsection = ''

    for row in rows[3:]:
        if not row:
            continue

        col0 = normalize_text(row[0]) if len(row) > 0 else ''
        col1 = normalize_text(row[1]) if len(row) > 1 else ''
        col2 = normalize_text(row[2]) if len(row) > 2 else ''

        # Skip rows that have nothing usable
        if not col0 and not col1 and not col2:
            continue

        # New section header (e.g. "1. СТРУКТУРА ЗВОНКА" or "1.1 Приветствие...")
        if col0:
            current_section = col0
            current_subsection = ''
            content.append({'type': 'section', 'title': col0})
            continue

        # col0 is empty; content is in col1 and maybe col2
        if not col1:
            continue

        # Case: col1 is a short label like "Принципы:", "Если просит перезвонить:"
        # and col2 is the body text
        if col2 and len(col1) <= 45:
            content.append({
                'type': 'tip',
                'title': col1,
                'description': col2,
            })
            continue

        # Case: col1 is the body (long replica, e.g. «Доброе утро...»)
        # Use current section/subsection as context title if available
        title = current_subsection or current_section or ''
        content.append({
            'type': 'tip',
            'title': title,
            'description': col1,
        })

    return content


CONTENT_BUILDERS = {
    'Чек-лист': extract_checklist_content,
    'Справочник по болезням': extract_diseases_content,
    'Общие правила': extract_rules_content,
    'Программы': extract_programs_content,
    'Направления': extract_directions_content,
    '_Подбор_raw': extract_selection_content,
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
                    'question_type': q.get('question_type', 'single_choice'),
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
