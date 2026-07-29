export default function HelpPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif', lineHeight: 1.6 }}>
      <div style={{ marginBottom: 16 }}>
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: '#f3f4f6',
            borderRadius: 8,
            color: '#111827',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          ← Назад
        </a>
      </div>

      <h1>CRM Контракты — инструкция</h1>

      <p>
        <strong>Основной адрес:</strong>{' '}
        <a href="https://tone-crm.ru" target="_blank" rel="noreferrer">https://tone-crm.ru</a>
      </p>
      <p>
        <strong>Резервные адреса:</strong>
      </p>
      <ul>
        <li><a href="https://ru.tone-crm.ru" target="_blank" rel="noreferrer">https://ru.tone-crm.ru</a></li>
        <li><a href="https://ru.tone-crm.ru:8443" target="_blank" rel="noreferrer">https://ru.tone-crm.ru:8443</a></li>
      </ul>
      <p style={{ background: '#fff7ed', borderLeft: '4px solid #f97316', padding: 12 }}>
        <strong>Важно:</strong> С мобильного интернета CRM может не открываться из-за блокировки оператора.
        Используйте домашний Wi-Fi или VPN.
      </p>

      <h2>1. Студент</h2>

      <h3>1.1. Вход</h3>
      <ol>
        <li>Открыть <a href="https://tone-crm.ru" target="_blank" rel="noreferrer">https://tone-crm.ru</a></li>
        <li>Ввести email и пароль</li>
        <li>Нажать <strong>Войти</strong></li>
      </ol>
      <p>Нет аккаунта — обратитесь к руководителю.</p>

      <h3>1.2. Меню студента</h3>
      <img
        src="/screenshots/student-training.png"
        alt="Меню студента и раздел Обучение"
        style={{ width: '100%', maxWidth: 800, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16 }}
      />
      <p>Студенту доступны разделы:</p>
      <ul>
        <li><strong>Обучение</strong> — прохождение курса и тестов</li>
        <li><strong>Профиль</strong> — личные данные и результаты</li>
        <li><strong>Памятка</strong> — эта инструкция</li>
      </ul>
      <p>Раздел <strong>Кандидаты</strong> студенту недоступен.</p>

      <h3>1.3. Обучение</h3>
      <ol>
        <li>В меню выберите <strong>Обучение</strong>.</li>
        <li>Откроется список модулей.</li>
        <li>Каждый модуль состоит из теории и теста.</li>
        <li>После всех модулей открывается финальный экзамен.</li>
      </ol>

      <h3>1.4. Как проходить модуль</h3>
      <ol>
        <li>Нажмите на название модуля.</li>
        <li>Прочитайте теорию.</li>
        <li>Нажмите <strong>Перейти к тесту</strong>.</li>
        <li>Ответьте на все вопросы.</li>
        <li>Нажмите <strong>Отправить ответы</strong>.</li>
        <li>Система покажет результат.</li>
      </ol>

      <h3>1.5. Тесты</h3>
      <ul>
        <li>Вопросы с одним или несколькими вариантами ответа.</li>
        <li>Без ответа на все вопросы тест не отправляется.</li>
        <li>После отправки видно: сколько правильных ответов, сдан или нет.</li>
        <li>Сохраняется лучший результат.</li>
      </ul>

      <h3>1.6. Финальный экзамен</h3>
      <ul>
        <li>Финальный экзамен открывается только после прохождения всех обычных модулей.</li>
        <li>Если модули не сданы — кнопка финального экзамена недоступна.</li>
        <li>После сдачи обучение считается завершённым.</li>
      </ul>

      <h3>1.7. Правила для студента</h3>
      <ul>
        <li>Проходите обучение по порядку.</li>
        <li>Не передавайте логин и пароль.</li>
        <li>Если вопрос непонятен — перечитайте теорию или спросите руководителя.</li>
        <li>После завершения дождитесь назначения роли менеджера.</li>
      </ul>

      <h2>2. Менеджер</h2>

      <h3>2.1. Вход и меню</h3>
      <p>Менеджеру доступны все разделы CRM:</p>
      <ul>
        <li><strong>Кандидаты</strong> — основная таблица</li>
        <li><strong>Календарь</strong> — план звонков</li>
        <li><strong>Сообщения</strong> — чат</li>
        <li><strong>Обучение</strong> — материалы и тесты</li>
        <li><strong>Профиль</strong> — настройки</li>
        <li><strong>Инструменты</strong> — дополнительные функции</li>
        <li><strong>Памятка</strong> — эта инструкция</li>
      </ul>

      <h3>2.2. Ежедневный порядок работы</h3>
      <img
        src="/screenshots/manager-table.png"
        alt="Таблица кандидатов менеджера"
        style={{ width: '100%', maxWidth: 800, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16 }}
      />
      <ol>
        <li>Открыть <strong>Кандидаты</strong> → фильтр <strong>На обзвон</strong> / <strong>Сегодня</strong>.</li>
        <li>Позвонить по списку.</li>
        <li>Зафиксировать результат в комментарии.</li>
        <li>Установить дату следующего контакта.</li>
        <li>Сменить статус кандидата.</li>
        <li>Загрузить документы, если есть.</li>
        <li>В конце дня проверить недозвоны.</li>
      </ol>

      <h3>2.3. Звонок кандидату</h3>
      <img
        src="/screenshots/candidate-card.png"
        alt="Карточка кандидата"
        style={{ width: '100%', maxWidth: 800, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16 }}
      />
      <ol>
        <li>Нажать на номер телефона в таблице.</li>
        <li>Откроется карточка кандидата.</li>
        <li>Рядом с номером есть кнопка 📞.</li>
        <li>Нажмите 📞 — откроется меню выбора способа связи:
          <ul>
            <li>Позвонить по телефону</li>
            <li>Написать в Telegram</li>
            <li>Написать в WhatsApp</li>
          </ul>
        </li>
        <li>Выберите нужный способ связи.</li>
        <li>После разговора запишите результат в комментарий.</li>
      </ol>
      <p style={{ background: '#fff7ed', borderLeft: '4px solid #f97316', padding: 12 }}>
        <strong>Важно:</strong> кнопка 📞 не звонит сама по себе. Она открывает меню выбора: телефон / Telegram / WhatsApp.
      </p>

      <h3>2.4. Статусы кандидатов</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ border: '1px solid #d1d5db', padding: 8, textAlign: 'left' }}>Статус</th>
            <th style={{ border: '1px solid #d1d5db', padding: 8, textAlign: 'left' }}>Значение</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>На обзвон</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Новый кандидат, нужно позвонить</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Недозвон</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Не дозвонились, перезвонить позже</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>В обработке</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Кандидат на этапе оформления</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Оформлен</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Документы собраны, оформлен</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Отказ</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Кандидат отказался</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Не актуален</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Неверный номер, дубль, окончательный отказ</td></tr>
        </tbody>
      </table>

      <h3>2.5. Недозвон</h3>
      <ol>
        <li>Поставить статус <strong>Недозвон</strong>.</li>
        <li>Выбрать причину: не берёт / занят / недоступен / номер не существует.</li>
        <li>Установить дату следующей попытки.</li>
        <li>Сохранить.</li>
      </ol>

      <h3>2.6. Загрузка документов</h3>
      <ol>
        <li>Открыть карточку кандидата.</li>
        <li>Раздел <strong>Документы</strong> → <strong>Загрузить файл</strong>.</li>
        <li>Выбрать файл: паспорт, СНИЛС, ИНН, военный билет.</li>
        <li>Сохранить.</li>
      </ol>

      <h3>2.7. Мобильный доступ</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ border: '1px solid #d1d5db', padding: 8, textAlign: 'left' }}>Проблема</th>
            <th style={{ border: '1px solid #d1d5db', padding: 8, textAlign: 'left' }}>Решение</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>CRM не грузится на iPhone</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Подключиться к домашнему Wi-Fi</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Не работает мобильный интернет</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Включить VPN</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Основной адрес не открывается</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Попробовать <a href="https://ru.tone-crm.ru">ru.tone-crm.ru</a> или <a href="https://ru.tone-crm.ru:8443">ru.tone-crm.ru:8443</a></td></tr>
        </tbody>
      </table>

      <h2>3. Частые проблемы</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ border: '1px solid #d1d5db', padding: 8, textAlign: 'left' }}>Проблема</th>
            <th style={{ border: '1px solid #d1d5db', padding: 8, textAlign: 'left' }}>Решение</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Не загружается сайт</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Попробовать ru.tone-crm.ru, ru.tone-crm.ru:8443, Wi-Fi или VPN</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Забыл пароль</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Обратиться к руководителю</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Не открывается тест</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Проверить интернет, перезагрузить страницу</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Тест не отправляется</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Убедиться, что ответили на все вопросы</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Нет доступа к кандидатам</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Возможно, у вас роль студента. Дождитесь назначения менеджера</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Не сохраняется карточка</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Проверить интернет, перезагрузить страницу</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Не открывается документ</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Проверить формат и размер файла</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Кнопка 📞 не звонит</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Она открывает меню выбора: телефон / Telegram / WhatsApp</td></tr>
        </tbody>
      </table>

      <p style={{ marginTop: 40, color: '#6b7280', fontSize: 14 }}>
        По техническим вопросам обращайтесь к администратору CRM.
      </p>
    </div>
  )
}
