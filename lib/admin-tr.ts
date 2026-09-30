'use client'

import { useCallback } from 'react'
import { useI18n, type Locale } from '@/lib/i18n'
import { adminRuEnExtra } from '@/lib/admin-tr-extra'

function decodeKey(key: string): string {
  return key
    .replace(/\\n/g, '\n')
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

function normalizeMap(map: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(map)) {
    out[decodeKey(k)] = decodeKey(v)
  }
  return out
}

/**
 * Runtime RU→EN map for recovered admin-client.jsx hardcodes.
 * Keep Russian source strings as keys; EN locale swaps via tr().
 */
const adminRuEnBase: Record<string, string> = {
  // Shared / common
  'Всего': 'Total',
  'Да': 'Yes',
  'Нет': 'No',
  'да': 'yes',
  'нет': 'no',
  'Все': 'All',
  'все': 'all',
  'Отмена': 'Cancel',
  'Сохранить': 'Save',
  'Удалить': 'Delete',
  'Действия': 'Actions',
  'Действие': 'Action',
  'Дата': 'Date',
  'Время': 'Time',
  'время': 'time',
  'Имя': 'Name',
  'Страна': 'Country',
  'Почта': 'Email',
  'Email': 'Email',
  'Владелец': 'Owner',
  'владелец': 'owner',
  'Статус': 'Status',
  'Загрузка…': 'Loading…',
  'Загрузка...': 'Loading...',
  'Обновить': 'Refresh',
  'Обновление…': 'Refreshing…',
  'Применить': 'Apply',
  'Сбросить': 'Reset',
  '↩ Сбросить': '↩ Reset',
  'Поиск...': 'Search...',
  'Вкл': 'On',
  'Выкл': 'Off',
  'Выкл.': 'Off',
  'Включена': 'Enabled',
  'Включить': 'Enable',
  'готово': 'done',
  'Ошибка загрузки': 'Load failed',
  'Пароль': 'Password',
  'отключена': 'disabled',
  'Без даты': 'No date',
  'До': 'To',
  'по': 'to',
  'С': 'From',
  'По': 'To',

  // Reviews
  'Отзывы': 'Reviews',
  'Из демо': 'From demo',
  'На промо': 'On promo',
  'Публично': 'Public',
  'Источник': 'Source',
  'Отзыв': 'Review',
  'Демо': 'Demo',
  'Аккаунт': 'Account',
  'Веб': 'Web',
  'Показать полностью': 'Show more',
  'Свернуть': 'Collapse',
  'Показать на промостранице': 'Show on promo page',
  'Нет согласия на публикацию': 'No consent to publish',
  'Нет согласия на публикацию — отзыв нельзя показать на промо.':
    'No consent to publish — this review cannot be shown on promo.',
  'Пока нет отзывов.': 'No reviews yet.',
  'Сообщения из приложения: Настройки → «Оставить отзыв». Колонка «Публично» — согласие пользователя на показ отзыва (сайт, промо, открытые источники). Без согласия отзыв виден здесь, но галочку «На промо» поставить нельзя.':
    'Messages from the app: Settings → “Leave a review”. The “Public” column is the user’s consent to display the review (site, promo, public sources). Without consent the review stays here, but “On promo” cannot be enabled.',

  // Establishments
  'Заведений': 'Venues',
  'Заведений за период': 'Venues in period',
  'заведений': 'venues',
  'Людей (влад.+сотр.)': 'People (owner+staff)',
  'С платной подпиской': 'Paid subscription',
  'С промокодом': 'With promo code',
  'без промокода': 'without a promo code',
  'Без подписки': 'No subscription',
  'без подписки': 'no subscription',
  'Без Pro': 'No Pro',
  'Заведений нет': 'No venues',
  'Заведение / ID': 'Venue / ID',
  'Тип': 'Type',
  'Тип: все': 'Type: all',
  'Основное': 'Main',
  'Филиал': 'Branch',
  'Отдельное': 'Separate',
  'Подписка': 'Plan',
  'Люди': 'People',
  'Регистрация': 'Registered',
  'Последний вход': 'Last login',
  'Место': 'Place',
  'Создано с': 'Created from',
  'Выгрузка в Excel': 'Export to Excel',
  'Скачать Excel (.xlsx)': 'Download Excel (.xlsx)',
  'Формируем файл…': 'Building file…',
  'Поиск (название, email, ID)...': 'Search (name, email, ID)...',
  'IP и гео регистрации': 'Registration IP & geo',
  '🌐 IP и гео регистрации': '🌐 Registration IP & geo',
  'Скрыть системные (': 'Hide system demos (',
  'Только системные демо': 'System demos only',
  'Все (': 'All (',
  'Сотр.: все': 'Staff: all',
  'Допы: ': 'Add-ons: ',
  'Без допов': 'No add-ons',
  'Регистрация и пробный Pro': 'Registration & Pro trial',
  'Владелец / Email:': 'Owner / Email:',
  'активные': 'active',
  'ID': 'ID',
  'confirm': 'confirm',
  'головное: ': 'head: ',
  'Даты изменены, но ещё не применены — нажми «Применить».':
    'Dates changed but not applied yet — press “Apply”.',
  'Список отсортирован по связям: один владелец — блоком, филиалы сразу под головным заведением (↳ и строка «головное: …»).':
    'List is grouped by ownership: one owner as a block, branches directly under the head venue (↳ and a “head: …” row).',
  'Фильтр по типу заведения': 'Filter by venue type',
  'Тариф; допы — второй список': 'Plan; add-ons are the second list',
  'Активные сотрудники этого заведения (1 человек с несколькими ролями = 1)':
    'Active staff at this venue (one person with several roles = 1)',
  'Догнать registration_ip из last_login (владелец по owner_id, любой сотрудник) и город/страну по IP':
    'Backfill registration_ip from last_login (owner by owner_id, any staff) and city/country by IP',
  'Системные демо-кухни (': 'System demo kitchens (',
  ') скрыты — это не удаления, они в БД с флагом ':
    ') are hidden — not deleted; they stay in the DB with flag ',
  '. Показать: фильтр «Демо» ниже.': '. Show them: use the “Demo” filter below.',
  'Фильтр дат применён': 'Date filter applied',
  ' с ': ' from ',
  ' по ': ' to ',
  ' · в таблице с учётом поиска/типа: ': ' · in table after search/type: ',
  'В файл попадут ': 'The file will include ',
  ' строк из текущего фильтра (даты, демо, поиск). Формат .xlsx.':
    ' rows from the current filter (dates, demo, search). .xlsx format.',
  'Колонка «Регистрация» — дата и время создания ':
    'The “Registered” column is the create date/time of the ',
  'записи заведения': 'venue record',
  ' в базе (': ' in the database (',
  '). Для входа': '). For sign-up',
  ' в продукте действует': ' the product grants',
  '72 часа полного Pro': '72 hours of full Pro',
  ' с этого момента (в БД — поле': ' from that moment (DB field',
  '). С промокодом триал обычно не заполняется — тариф даёт промо.':
    '). With a promo code the trial is usually empty — the promo sets the plan.',
  'Если у старых аккаунтов без промо пропала дата окончания триала, выполни в Supabase миграцию':
    'If older no-promo accounts lost their trial end date, run this Supabase migration',
  ' из ': ' from ',
  ' (роль owner или ': ' (owner role or ',
  '). До confirm — из': '). Before confirm — from',
  '). Под названием заведения — ': '). Under the venue name — ',
  ' (полный UUID, клик копирует). Колонка «Люди» — уникальные ':
    ' (full UUID, click to copy). The “People” column is unique ',
  ' сотрудники этого заведения (собственник + шеф в одной строке = 1; неактивные не считаются).':
    ' staff at this venue (owner + chef in one row = 1; inactive not counted).',
  'Заведения и филиалы': 'Venues and branches',
  ' создаются только в приложении (регистрация, экран «Мои заведения» / добавление филиала). В этой админке нет кнопки «создать заведение» — здесь только список из БД, удаление и гео. Если строка «видна в админке, но не в приложении», это всё равно записи в Supabase; после успешного удаления появится подтверждение; при ошибке — текст в алерте и в красном блоке выше.':
    ' are created only in the app (signup, “My venues” / add branch). This admin has no “create venue” button — only the DB list, delete, and geo. If a row is “visible in admin but not in the app”, it is still a Supabase record; after a successful delete you get a confirmation; on error — alert text and the red block above.',
  'Нет колонки или схема старая — открой Supabase → SQL Editor и выполни миграции:':
    'Missing column or old schema — open Supabase → SQL Editor and run migrations:',
  ' (колонка ': ' (column ',
  '). Ошибка входа/401 — проверь Secrets в Cloudflare (':
    '). Login/401 error — check Cloudflare Secrets (',
  ') и перелогинься в админке.': ') and sign in again.',
  'Реферальный уровень ': 'Referral level ',
  'ур. ': 'lv. ',
  ': 1 — промокод, 2+ — по реферальной ссылке': ': 1 — promo code, 2+ — via referral link',
  'Pro (промокод)': 'Pro (promo)',
  'Ultra (промокод)': 'Ultra (promo)',
  'ещё не заходили': 'never signed in',
  'чел.': 'ppl',
  'УДАЛИТЬ': 'DELETE',

  // Promo
  'Свободно': 'Available',
  'Использовано': 'Used',
  'Истекло': 'Expired',
  'Отключено': 'Disabled',
  'Новый промокод': 'New promo code',
  '+ Создать': '+ Create',
  'Логика': 'Logic',
  'Как раньше (классика)': 'Classic (as before)',
  'Новый тип: дни Pro с активации': 'New type: Pro days from activation',
  'Выдаваемый тариф': 'Granted plan',
  'Действует с': 'Valid from',
  'Действует до': 'Valid until',
  'Макс. сотр.': 'Max staff',
  'Макс. фил.': 'Max branches',
  'Учётных записей': 'Accounts',
  'Ввод кода с': 'Code entry from',
  'Ввод кода до': 'Code entry until',
  'Дней Pro с активации': 'Pro days from activation',
  'Активации': 'Redemptions',
  'Активации:': 'Redemptions:',
  'Есть активации': 'Has redemptions',
  'Включить промокод': 'Enable promo code',
  'Отключить промокод': 'Disable promo code',
  'Только расширения (без смены тарифа промокодом)': 'Add-ons only (promo does not change plan)',
  'Возобновляемые ИИ-лимиты каждый месяц (от даты применения промокода)':
    'Renewable AI limits every month (from promo apply date)',
  'Возобновляемые ИИ-лимиты каждый месяц (от даты применения)':
    'Renewable AI limits every month (from apply date)',
  'Подписки расширения (отдельно от промокода тарифа)':
    'Add-on subscriptions (separate from plan promo)',
  'Промокодов нет': 'No promo codes',
  'Не удалось создать промокод (': 'Could not create promo code (',
  'Удалить промокод?': 'Delete promo code?',
  'Укажите дату окончания («Действует до» / «Ввод кода до») — без неё промокод не создать.':
    'Set an end date (“Valid until” / “Code entry until”) — required to create a promo code.',
  'Отключить промокод? У заведений, которые уже его применили, доступ будет заблокирован (как при истечении срока).':
    'Disable this promo code? Venues that already redeemed it will lose access (same as expiry).',
  'Выключить «только расширения»?': 'Turn off “add-ons only”?',
  'Промокод': 'Promo code',
  ' — код выдачи тарифа (Pro/Ultra), сроков и при необходимости лимита сотрудников; это не то же самое, что платные подписки расширения в приложении. Уже созданные коды ':
    ' — grants a plan (Pro/Ultra), dates, and optional staff limits; not the same as paid add-on subscriptions in the app. Existing codes ',
  'не меняются': 'do not change',
  ' автоматически: у старых пустое «дней с активации». Ниже можно завести ':
    ' automatically: older ones have empty “days from activation”. Below you can create a ',
  'второй тип срока': 'second duration type',
  ' — дни Pro с момента активации кода.': ' — Pro days from code activation.',
  'Подписки расширения Lite': 'Lite add-on subscriptions',
  ': выбор только из фиксированных пакетов. Для сотрудников: ':
    ': pick only fixed packs. For staff: ',
  '. Для заведений: ': '. For venues: ',
  ' (+5 / +10 — старые коды).': ' (+5 / +10 — legacy codes).',
  'Регистрация ': 'Sign-up ',
  ' в приложении даёт владельцу': ' in the app gives the owner',
  ' (см. вкладку «Заведения»: колонка «Регистрация» и поле ':
    ' (see Venues tab: “Registered” column and field ',
  '). Промокоды ниже — отдельный способ выдать тариф и срок.':
    '). Promo codes below are a separate way to grant a plan and term.',
  'Тариф в строке промокода задаёт, что запишется в':
    'The plan on the promo row sets what is written to',
  ' в момент': ' at',
  'первого погашения': 'first redemption',
  ' кода. Уже активированный код не переписывает заведение — смена тарифа здесь влияет на новые активации и на отображение в админке.':
    ' of the code. An already redeemed code does not rewrite the venue — changing the plan here affects new redemptions and admin display.',
  'Тариф промокода — отдельно от «классика / с активации»: попадёт в':
    'Promo plan is separate from “classic / from activation”: it goes into',
  ' заведения. Публичная линейка — только Lite / Pro / Ultra. Ultimate — скрытый тариф только по промокоду (POS Restodocks: столы, зал, заказы на prod; не показывать в витрине и прайсе).':
    ' of the venue. Public lineup is Lite / Pro / Ultra only. Ultimate is a hidden promo-only plan (Restodocks POS: tables, floor, orders on prod; do not show on showcase/pricing).',
  'Действует до (классический промокод без режима «дней с активации»). Без даты — без ограничения.':
    'Valid until (classic promo without “days from activation”). Empty = no limit.',
  'Последний день, когда код ещё можно ввести. Без даты — нет ограничения по календарю.':
    'Last day the code can still be entered. Empty = no calendar limit.',
  'только тариф ': 'plan only ',
  '; даты, макс. сотр. и макс. фил. — как в полях выше':
    '; dates, max staff and max branches — as in the fields above',
  'дн. с активации': 'days from activation',
  'ввести до ': 'enter by ',
  'ввод кода без крайней даты': 'code entry with no end date',
  'сотр.': 'staff',
  'фил.': 'br.',
  '+ сотрудники': '+ staff',
  '+ заведения': '+ venues',
  '+5 сотр.': '+5 staff',
  '+1 фил.': '+1 branch',
  '✓ Отметить исп.': '✓ Mark used',
  'ПРОМОКОД — КОД, ЗАМЕТКА, ДАТЫ': 'PROMO — CODE, NOTE, DATES',

  // Popups
  'Попапы в приложении': 'In-app popups',
  'Новая кампания': 'New campaign',
  'Кампании': 'Campaigns',
  'Где показывать': 'Where to show',
  'Аудитория': 'Audience',
  'Активна с (дата)': 'Active from (date)',
  'Активна до (дата)': 'Active until (date)',
  'Показывать только если промокод ещё доступен (лимит не исчерпан)':
    'Show only if the promo code is still available (limit not exhausted)',
  'За сколько часов до окончания промо (app_shell)':
    'Hours before promo expiry (app_shell)',
  'все пользователи': 'all users',
  'Все пользователи': 'All users',

  // Ads
  'Бюджет (вы задаёте вручную)': 'Budget (you set manually)',
  'Лимит на день': 'Daily limit',
  'Валюта': 'Currency',
  'Гео / заметки': 'Geo / notes',
  'Агент вооружён. Автосписание в Meta пока выключено — крутите по плану вручную или дождитесь токена.':
    'Agent armed. Meta auto-spend is still off — run the plan manually or wait for the token.',
  'Агент не выбирает сумму за вас. Без лимита — не тратит. Оценки кликов — ориентир, не гарантия регистраций.':
    'The agent does not pick the amount for you. With no limit it does not spend. Click estimates are guidance, not a signup guarantee.',
  'Простой — нет бюджета': 'Idle — no budget',
  'Настроено — ждут ваше «вооружить»': 'Configured — waiting for you to arm',
  'Ждёт одобрения черновиков': 'Awaiting draft approval',
  'Вооружён — готов к API / ручному запуску по плану':
    'Armed — ready for API / manual launch per plan',
  'Пауза': 'Paused',

  // Support
  'Доступ техподдержки': 'Support access',
  'Открыть доступ': 'Open access',
  'Введите логин учётной записи (email). PIN вводит владелец на своей стороне вместе с тумблером доступа.':
    'Enter the account login (email). The owner enters the PIN on their side with the access toggle.',

  // Security / health
  'Периметр:': 'Perimeter:',
  'Интерпретация': 'Interpretation',
  'Критичные проверки пройдены': 'Critical checks passed',
  'Есть проблемы доступности': 'Availability issues found',
  'Заведений (оценка)': 'Venues (estimate)',
  'Где смотреть полные метрики': 'Where to see full metrics',

  // AI usage
  'последние 7 дней': 'last 7 days',
  'последние 14 дней': 'last 14 days',
  'последние 30 дней': 'last 30 days',
  'последние 90 дней': 'last 90 days',
  'Быстрый период': 'Quick range',
  'выбрать…': 'choose…',
  'токенов': 'tokens',
  'вызовов ·': 'calls ·',

  // Demo sandboxes
  'Всего демо': 'Total demos',
  'Скрыть проверки': 'Hide checks',
  'Активные': 'Active',
  'Конверсия': 'Converted',
  'Истекли': 'Expired',

  // Broadcast
  'Укажите тему…': 'Enter a subject…',
  'Отправить рассылку?': 'Send broadcast?',
  'Выберите хотя бы один тип подписки': 'Pick at least one plan type',
  'Диапазон регистрации (дата создания аккаунта)':
    'Registration range (account created date)',
  'Дата «С» не может быть позже «По»': '“From” date cannot be after “To”',
  'Время «С» должно быть раньше «По»': '“From” time must be before “To”',
  'любая': 'any',
  '\nОт: info@restodocks.com (через Resend)':
    '\nFrom: info@restodocks.com (via Resend)',
  '\nПодписка: ': '\nPlan: ',
  '\nРегистрация: ': '\nRegistered: ',
  '\nПолучателей (по последнему подсчёту): ':
    '\nRecipients (last count): ',
  '\nПользователи: ': '\nUsers: ',
  'Пользователи: ': 'Users: ',

  // Hosts / misc shared with marketing leftovers in helpers
  'Без беты и localhost': 'Exclude beta & localhost',
  'Все хосты': 'All hosts',
  'бета · ': 'beta · ',
  'Бот / проверка': 'Bot / check',
  'Неясно': 'Unclear',
  'Человек': 'Human',
  'Выбор языка': 'Language pick',
  '«Начать использование»': '“Start using”',
  '«Попробовать ультра»': '“Try ultra”',
  'Вход в систему (email/пароль)': 'App login (email/password)',
  'Открытие приложения (уже залогинен)': 'App open (already signed in)',
  'Просмотр страницы': 'Page view',
  'Главная (приложение)': 'Home (app)',
  'Вход': 'Login',
  'Вход по ссылке': 'Magic-link login',
  'Гость (без входа)': 'Guest (signed out)',
  'Владелец-оплатчик': 'Paying owner',
  'В приложении после входа': 'In the app after login',
  'Ещё скрыть почты (ваши тесты)': 'Also hide emails (your tests)',
  '0 = выкл': '0 = off',
  'шт.)': 'pcs)',
  'записей учтены': 'records counted',
  'событий в выборке — проверьте rate limit / правило для IP (возможен парсинг или скрипт).':
    'events in sample — check rate limit / IP rule (possible scraping or script).',
  'HTTP-запросов к зоне. Сравните с обычным днём: резкий рост часто совпадает с ботами или парсингом.':
    'HTTP requests to the zone. Compare with a normal day: sharp spikes often mean bots or scraping.',
  'В выборке есть запрос к подозрительному пути (':
    'Sample includes a request to a suspicious path (',
  ') — похоже на сканирование уязвимостей.':
    ') — looks like vulnerability scanning.',
  '. Возможны сканирование, перебор или нетипичный клиент — смотрите Security в Cloudflare.':
    '. Possible scanning, brute force, or an unusual client — see Security in Cloudflare.',
  ' → issue в GitHub.': ' → GitHub issue.',
  'мс': 'ms',
  'Обновлено: ': 'Updated: ',
  'Обновлено': 'Updated',
  'Пробный': 'Trial',
  'Pro (оплата)': 'Pro (paid)',
  'Ultra (оплата)': 'Ultra (paid)',
  'Только допы (промо)': 'Add-ons only (promo)',
  'Прочее': 'Other',
  'Сотр. и завед.': 'Staff & venues',
  'Любые допы': 'Any add-ons',
  'Как отображать': 'Display name',
  'минимум 8 символов': 'min. 8 characters',
  'Новый пароль для ': 'New password for ',
  ' (минимум 8 символов):': ' (min. 8 characters):',
  'Пароль должен быть не короче 8 символов': 'Password must be at least 8 characters',
  'Удалить учётку ': 'Delete account ',
  'Не удалось удалить': 'Could not delete',
  'Сеть: не удалось загрузить настройки писем': 'Network: could not load email settings',
  'Сеть: не удалось сохранить': 'Network: could not save',
  'Сеть: проверка не удалась': 'Network: check failed',
  'проверено: ': 'checked: ',
  'писем: ': 'emails: ',
  'пропущено: ': 'skipped: ',
  'ошибки: ': 'errors: ',
  'Не удалось создать учётку': 'Could not create account',
  'Не удалось сохранить': 'Could not save',
}

export const adminRuEn: Record<string, string> = {
  ...normalizeMap(adminRuEnExtra),
  ...normalizeMap(adminRuEnBase),
}

/** Translate a hardcoded Russian admin UI string when locale is EN. */
export function translateAdmin(locale: Locale, text: string): string {
  if (locale !== 'en' || !text) return text
  if (Object.prototype.hasOwnProperty.call(adminRuEn, text)) return adminRuEn[text]
  // Prefix/suffix patterns with dynamic numbers
  let m = text.match(/^Системные демо-кухни \((\d+)\) скрыты — это не удаления, они в БД с флагом $/)
  if (m) return `System demo kitchens (${m[1]}) are hidden — not deleted; they stay in the DB with flag `
  m = text.match(/^Скрыть системные \((\d+)\)$/)
  if (m) return `Hide system demos (${m[1]})`
  m = text.match(/^Все \((\d+)\)$/)
  if (m) return `All (${m[1]})`
  m = text.match(/^Фильтр дат применён с (.+): (\d+) заведений$/)
  if (m) return `Date filter applied from ${m[1]}: ${m[2]} venues`
  m = text.match(/^Фильтр дат применён по (.+): (\d+) заведений$/)
  if (m) return `Date filter applied until ${m[1]}: ${m[2]} venues`
  m = text.match(/^Фильтр дат применён с (.+) по (.+): (\d+) заведений$/)
  if (m) return `Date filter applied from ${m[1]} to ${m[2]}: ${m[3]} venues`
  m = text.match(/^Реферальный уровень (\d+): 1 — промокод, 2\+ — по реферальной ссылке$/)
  if (m) return `Referral level ${m[1]}: 1 — promo code, 2+ — via referral link`
  m = text.match(/^Допы: (.+)$/)
  if (m) return `Add-ons: ${m[1]}`
  return text
}

export function useAdminTr() {
  const { locale } = useI18n()
  return useCallback((text: string) => translateAdmin(locale, text), [locale])
}

export function useAdminLocaleTag() {
  const { locale } = useI18n()
  return locale === 'en' ? 'en-GB' : 'ru-RU'
}
