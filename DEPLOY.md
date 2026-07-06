# Инструкция по развёртыванию CRM

## 1. Supabase

1. Создай проект на https://supabase.com (бесплатно).
2. В SQL Editor выполни скрипт из `supabase/schema.sql`.
3. В Storage создай бакет `candidate-files` и разреши публичный доступ для чтения.
4. Скопируй URL, anon key и service role key в `.env.local`.

## 2. Google Sheets

1. Создай сервисный аккаунт Google Cloud: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Скачай JSON-ключ.
3. Предоставь доступ сервисному аккаунту на таблицу «Общий сток».
4. Заполни `GOOGLE_CLIENT_EMAIL` и `GOOGLE_PRIVATE_KEY`.
5. Убедись, что на листе «Лиды» есть столбец `B` — Телефон.

## 3. Vercel

1. Залей код на GitHub.
2. Импортируй репозиторий на https://vercel.com.
3. Добавь все переменные окружения из `.env.example`.
4. Разверни.

## 4. Первый админ

После регистрации первого пользователя в Supabase вручную поменяй ему `role` на `admin` и `approved` на `true`.

## 5. Импорт лидов

Cron настроен в `vercel.json`: дважды в день в 7:00 и 12:00 UTC (10:00 и 15:00 по Москве).

Ручной запуск: открой `https://your-site.vercel.app/api/import`.
