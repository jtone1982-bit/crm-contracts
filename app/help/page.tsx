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
        <strong>Резервный адрес:</strong>{' '}
        <a href="https://ru.tone-crm.ru:8443" target="_blank" rel="noreferrer">https://ru.tone-crm.ru:8443</a>
      </p>
      <p style={{ background: '#fff7ed', borderLeft: '4px solid #f97316', padding: 12 }}>
        <strong>Важно:</strong> С мобильного интернета CRM может не открываться из-за блокировки оператора.
        Используйте домашний Wi-Fi или VPN.
      </p>

      <h2>1. Вход</h2>
      <ol>
        <li>Открыть <a href="https://tone-crm.ru" target="_blank" rel="noreferrer">https://tone-crm.ru</a></li>
        <li>Ввести email и пароль</li>
        <li>Нажать <strong>Войти</strong></li>
      </ol>
      <p>Нет аккаунта — обратитесь к руководителю.</p>

      <h2>2. Студент — что можно делать</h2>
      <ul>
        <li>Смотреть карточки кандидатов</li>
        <li>Добавлять комментарии и заметки</li>
        <li>Помогать заполнять анкеты</li>
        <li>Проверять документы</li>
        <li>Фиксировать результаты звонков</li>
      </ul>

      <h2>3. Студент — правила</h2>
      <ul>
        <li>Не удаляйте кандидатов</li>
        <li>Не меняйте статусы без разрешения менеджера</li>
        <li>Записывайте всё в комментарии: дату, суть, договорённости</li>
      </ul>

      <h2>4. Менеджер — ежедневный порядок</h2>
      <ol>
        <li>Открыть <strong>Кандидаты</strong> → фильтр <strong>На обзвон</strong> / <strong>Сегодня</strong></li>
        <li>Позвонить по списку</li>
        <li>Зафиксировать результат звонка в комментарии</li>
        <li>Установить дату следующего контакта</li>
        <li>Сменить статус кандидата</li>
        <li>Загрузить документы, если есть</li>
        <li>В конце дня проверить недозвоны</li>
      </ol>

      <h2>5. Статусы кандидатов</h2>
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

      <h2>6. Недозвон — что делать</h2>
      <ol>
        <li>Поставить статус <strong>Недозвон</strong></li>
        <li>Выбрать причину: не берёт / занят / недоступен / номер не существует</li>
        <li>Установить дату следующей попытки</li>
        <li>Сохранить</li>
      </ol>

      <h2>7. Звонок кандидату</h2>
      <ol>
        <li>Нажать на номер телефона в таблице</li>
        <li>В карточке нажать кнопку 📞</li>
        <li>Позвонить через телефон или мессенджер</li>
        <li>После звонка сменить статус и написать комментарий</li>
      </ol>

      <h2>8. Загрузка документов</h2>
      <ol>
        <li>Открыть карточку кандидата</li>
        <li>Раздел <strong>Документы</strong> → <strong>Загрузить файл</strong></li>
        <li>Выбрать файл: паспорт, СНИЛС, ИНН, военный билет</li>
        <li>Сохранить</li>
      </ol>

      <h2>9. Мобильный доступ</h2>
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
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Основной адрес не открывается</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Попробовать <a href="https://ru.tone-crm.ru:8443">https://ru.tone-crm.ru:8443</a></td></tr>
        </tbody>
      </table>

      <h2>10. Частые проблемы</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ border: '1px solid #d1d5db', padding: 8, textAlign: 'left' }}>Проблема</th>
            <th style={{ border: '1px solid #d1d5db', padding: 8, textAlign: 'left' }}>Решение</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Не загружается сайт</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Попробовать резервный адрес, Wi-Fi или VPN</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Забыл пароль</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Обратиться к руководителю</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Нет новых лидов</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Проверить фильтры в таблице</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Не сохраняется карточка</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Проверить интернет, перезагрузить страницу</td></tr>
          <tr><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Не открывается документ</td><td style={{ border: '1px solid #d1d5db', padding: 8 }}>Проверить формат и размер файла</td></tr>
        </tbody>
      </table>

      <p style={{ marginTop: 40, color: '#6b7280', fontSize: 14 }}>
        По техническим вопросам обращайтесь к администратору CRM.
      </p>
    </div>
  )
}
