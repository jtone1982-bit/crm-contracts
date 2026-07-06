# CRM Контракты

Закрытая CRM для работы с кандидатами на заключение контракта с Минобороны РФ.

## Возможности

- Авторизация с одобрением администратора.
- Роли: админ и менеджер.
- Менеджер видит только своих кандидатов.
- Карточка кандидата с полным набором полей.
- Воронка статусов: На обзвон → Недозвон → В работе → На билетах → На оформлении → Подписал → Женщины, офицеры, комисс → Неактуально → Архив → Черный список.
- Загрузка лидов из Google Sheets «Общий сток» дважды в день (10:00 и 15:00 по Москве).
- Автоматическое распределение новых лидов поровну между активными менеджерами.
- Загрузка файлов: документы, фото шрамов, билеты, фото контракта.
- Экспорт в Excel.
- Адаптивный интерфейс для мобильных.

## Переменные окружения

Создай файл `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_SHEETS_ID=1jDLvwIWn2pImdOC3hf5lGy3C3j0KflG5yiMbrRQAzDM
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Запуск локально

```bash
npm install
npm run dev
```

## Развёртывание

Рекомендуется Vercel или Netlify. Cron для импорта лидов настраивается через `vercel.json` (Vercel) или Netlify Functions + scheduled functions.
