# Пошаговая инструкция по развёртыванию CRM

## Шаг 1. Supabase (база данных, авторизация, файлы)

1. Зайди на https://supabase.com и создай новый проект.
2. Скопируй данные из раздела **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

3. Открой **SQL Editor → New query**, вставь содержимое файла `supabase/schema.sql` и выполни.

4. Перейди в **Storage → New bucket**:
   - Название: `candidate-files`
   - Тип: `Public`
   - Сохрани.

## Шаг 2. Google Sheets (загрузка лидов)

1. Перейди в Google Cloud Console: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Создай сервисный аккаунт.
3. Создай JSON-ключ и скачай файл.
4. Открой файл ключа, скопируй:
   - `client_email` → `GOOGLE_CLIENT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY`
5. Открой таблицу «Общий сток» и дай доступ сервисному аккаунту (кнопка «Поделиться» → вставь `client_email`).
6. Убедись, что на листе есть столбец **B** с заголовком **Телефон**.
7. Скопируй ID таблицы из URL: `https://docs.google.com/spreadsheets/d/ID/edit` → `GOOGLE_SHEETS_ID`.

## Шаг 3. GitHub

1. Создай новый приватный репозиторий.
2. Залей код:

```bash
cd /Users/a1/projects/crm-contracts
git remote add origin https://github.com/ТВОЙ_НИК/crm-contracts.git
git branch -M main
git push -u origin main
```

## Шаг 4. Vercel

1. Зайди на https://vercel.com, импортируй репозиторий с GitHub.
2. В настройках проекта добавь переменные окружения из `.env.example`.
3. Нажми **Deploy**.
4. После деплоя скопируй URL сайта и добавь в переменную `NEXT_PUBLIC_SITE_URL`.
5. Пересобери проект (Redeploy).

## Шаг 5. Первый администратор

1. Открой сайт, зарегистрируй первого пользователя.
2. В Supabase перейди в **Table Editor → profiles**.
3. Найди свою запись, установи:
   - `role` = `admin`
   - `approved` = `true`
   - `active` = `true`
4. Войди снова — теперь у тебя права админа.

## Шаг 6. Проверка импорта лидов

Открой в браузере:

```
https://ТВОЙ_САЙТ.vercel.app/api/import
```

Должен вернуть JSON с количеством импортированных телефонов.

Импорт запускается автоматически по расписанию (10:00 и 15:00 по Москве) благодаря `vercel.json`.

## Готово

Теперь менеджеры могут регистрироваться, админ их одобряет, а лидов автоматически раздаёт поровну.
