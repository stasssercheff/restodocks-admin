'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Locale = 'ru' | 'en'

const STORAGE_KEY = 'rd_admin_locale'

const ru = {
  login: {
    subtitle: 'Админка платформы',
    email: 'Email',
    password: 'Пароль',
    submit: 'Войти',
    checking: 'Проверка...',
    invalid: 'Неверный логин или пароль',
  },
  header: {
    admin: 'Admin',
    logout: 'Выйти',
  },
  tabs: {
    reviews: 'Отзывы',
    ads_agent: 'Ads Agent',
    establishments: 'Заведения',
    promo: 'Промокоды',
    popups: 'Попапы',
    ai_usage: 'AI Usage',
    demo_sandboxes: 'Демо',
    marketing_visits: 'Витрина',
    broadcast: 'Рассылка',
    support: 'Техподдержка',
    security: 'Безопасность',
    health: 'Нагрузка',
    demo: 'Демо',
    vitrine: 'Витрина',
    admins: 'Админы',
  },
  common: {
    search: 'Поиск...',
    refresh: '↻ Обновить',
    loading: 'Загрузка...',
    noData: 'Нет данных',
    save: 'Сохранить',
    copy: 'Скопировать',
    delete: 'Удалить',
    actions: 'Действия',
    created: 'Создан',
    email: 'Email',
    status: 'Статус',
    date: 'Дата',
  },
  establishments: {
    title: 'Заведения',
    count: 'Заведений',
    employees: 'Сотрудников',
    subscriptions: 'Подписок',
    search: 'Поиск по названию, владельцу, email...',
    empty: 'Заведений нет',
    colPlace: 'Заведение',
    colOwner: 'Владелец',
    colEmail: 'Email',
    colEmployees: 'Сотрудников',
    colCountry: 'Страна',
    colRegistered: 'Дата регистрации',
    colSub: 'Подписка',
    soon: '— (скоро)',
    loadError: 'Не удалось загрузить заведения',
  },
  promo: {
    total: 'Всего',
    free: 'Свободно',
    used: 'Использовано',
    expired: 'Истекло',
    all: 'Все',
    freeFilter: 'Свободные',
    usedFilter: 'Исп.',
    expiredFilter: 'Истекшие',
    empty: 'Промокодов нет',
    newTitle: 'Новый промокод',
    create: '+ Создать',
  },
  demo: {
    hint: 'Песочницы restodocks.com/demo. Это не заведения клиентов.',
    open: 'Открыть демо-сайт',
    total: 'Всего',
    active: 'Активные',
    converted: 'Конверсия',
    expired: 'Истекли',
    empty: 'Демо-сессий нет',
    colEmail: 'Email',
    colLocale: 'Язык',
    colStatus: 'Статус',
    colCreated: 'Создана',
    colExpires: 'До',
    colConverted: 'Конверсия',
    loadError: 'Не удалось загрузить демо',
  },
  vitrine: {
    hint: 'Публичная витрина restodocks.com/promo — лендинг продукта, не кухня заведения.',
    open: 'Открыть витрину',
    visits: 'Визиты /promo',
    locales: 'Выбор языка',
    campaigns: 'Кампании на витрине',
    emptyVisits: 'Визитов пока нет',
    emptyCampaigns: 'Кампаний нет',
    colPath: 'Путь',
    colEvent: 'Событие',
    colLang: 'Язык',
    colCountry: 'Страна',
    colWhen: 'Когда',
    enabled: 'вкл',
    disabled: 'выкл',
    loadError: 'Не удалось загрузить витрину',
  },
  admins: {
    newTitle: 'Новый админ панели',
    newHint: 'Это доступ в эту админку, не сотрудники заведений в Restodocks. Отметь вкладки и задай узкий срез данных: промокод и сколько уровней рефералов видно.',
    access: 'Доступ к разделам',
    dataScope: 'Срез данных',
    promoCodes: 'Промокоды',
    promoCodesHint: 'Только регистрации по этим кодам (уровень 1). Например 666',
    referralDepth: 'Глубина рефералов',
    referralHint: '1 — только кто ввёл промокод. 2 — плюс кто пришёл по реферальной ссылке от них. До 5 уровней.',
    depth1: '1 — только промокод',
    depth2: '2 — промокод + 1 уровень рефералов',
    depth3: '3 уровня',
    depth4: '4 уровня',
    depth5: '5 уровней',
    create: '+ Создать учётку',
    created: 'Учётка создана.',
    password: 'Пароль:',
    copyPass: 'Скопировать',
    passOnce: 'Передай его админу — повторно пароль не показывается.',
    colAdmin: 'Админ',
    empty: 'Других админов пока нет — создай учётку выше',
    fullAccess: 'полный доступ',
    owner: 'владелец',
    loadError: 'Не удалось загрузить админов',
    name: 'Имя (необязательно)',
    generate: 'Сгенерировать',
  },
  scope: {
    bannerPromo: 'Узкий доступ: только регистрации по промокоду',
    bannerDepth: 'и реферальная цепочка до {depth} уровня (кто пришёл по ссылке от них).',
    bannerNoReferral: 'Рефералы следующего уровня скрыты.',
    total: 'Регистраций в цепочке',
    withSub: 'С подпиской',
    withoutSub: 'Без подписки',
    level: 'Уровень {n}',
    levelShort: 'подписка {with} · без {without}',
    statsError: 'Ошибка статистики',
  },
  noAccess: 'Нет доступа ни к одному разделу. Попросите владельца выдать страницы.',
}

const en: typeof ru = {
  login: {
    subtitle: 'Platform admin',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    checking: 'Checking...',
    invalid: 'Invalid email or password',
  },
  header: {
    admin: 'Admin',
    logout: 'Log out',
  },
  tabs: {
    reviews: 'Reviews',
    ads_agent: 'Ads Agent',
    establishments: 'Venues',
    promo: 'Promo codes',
    popups: 'Popups',
    ai_usage: 'AI Usage',
    demo_sandboxes: 'Demo',
    marketing_visits: 'Showcase',
    broadcast: 'Broadcast',
    support: 'Support',
    security: 'Security',
    health: 'Health',
    demo: 'Demo',
    vitrine: 'Showcase',
    admins: 'Admins',
  },
  common: {
    search: 'Search...',
    refresh: '↻ Refresh',
    loading: 'Loading...',
    noData: 'No data',
    save: 'Save',
    copy: 'Copy',
    delete: 'Delete',
    actions: 'Actions',
    created: 'Created',
    email: 'Email',
    status: 'Status',
    date: 'Date',
  },
  establishments: {
    title: 'Venues',
    count: 'Venues',
    employees: 'Staff',
    subscriptions: 'Subscriptions',
    search: 'Search by name, owner, email...',
    empty: 'No venues',
    colPlace: 'Venue',
    colOwner: 'Owner',
    colEmail: 'Email',
    colEmployees: 'Staff',
    colCountry: 'Country',
    colRegistered: 'Registered',
    colSub: 'Plan',
    soon: '— (soon)',
    loadError: 'Could not load venues',
  },
  promo: {
    total: 'Total',
    free: 'Available',
    used: 'Used',
    expired: 'Expired',
    all: 'All',
    freeFilter: 'Available',
    usedFilter: 'Used',
    expiredFilter: 'Expired',
    empty: 'No promo codes',
    newTitle: 'New promo code',
    create: '+ Create',
  },
  demo: {
    hint: 'Sandboxes from restodocks.com/demo. Not customer venues.',
    open: 'Open demo site',
    total: 'Total',
    active: 'Active',
    converted: 'Converted',
    expired: 'Expired',
    empty: 'No demo sessions',
    colEmail: 'Email',
    colLocale: 'Locale',
    colStatus: 'Status',
    colCreated: 'Created',
    colExpires: 'Until',
    colConverted: 'Converted',
    loadError: 'Could not load demo sessions',
  },
  vitrine: {
    hint: 'Public product showcase at restodocks.com/promo — not a restaurant floor.',
    open: 'Open showcase',
    visits: '/promo visits',
    locales: 'Language picks',
    campaigns: 'Showcase campaigns',
    emptyVisits: 'No visits yet',
    emptyCampaigns: 'No campaigns',
    colPath: 'Path',
    colEvent: 'Event',
    colLang: 'Language',
    colCountry: 'Country',
    colWhen: 'When',
    enabled: 'on',
    disabled: 'off',
    loadError: 'Could not load showcase',
  },
  admins: {
    newTitle: 'New panel admin',
    newHint: 'This is access to this admin panel, not Restodocks venue staff. Tick tabs and set a narrow data slice: promo code plus referral depth.',
    access: 'Tab access',
    dataScope: 'Data slice',
    promoCodes: 'Promo codes',
    promoCodesHint: 'Only registrations with these codes (level 1). Example: 666',
    referralDepth: 'Referral depth',
    referralHint: '1 — only people who used the promo. 2 — plus people who came via their referral link. Up to 5 levels.',
    depth1: '1 — promo only',
    depth2: '2 — promo + 1 referral level',
    depth3: '3 levels',
    depth4: '4 levels',
    depth5: '5 levels',
    create: '+ Create account',
    created: 'Account created.',
    password: 'Password:',
    copyPass: 'Copy',
    passOnce: 'Send it to the admin — it will not be shown again.',
    colAdmin: 'Admin',
    empty: 'No other admins yet — create an account above',
    fullAccess: 'full access',
    owner: 'owner',
    loadError: 'Could not load admins',
    name: 'Name (optional)',
    generate: 'Generate',
  },
  scope: {
    bannerPromo: 'Narrow access: only registrations with promo code',
    bannerDepth: 'plus the referral chain up to level {depth} (people who arrived via their link).',
    bannerNoReferral: 'Next-level referrals are hidden.',
    total: 'Registrations in the chain',
    withSub: 'With subscription',
    withoutSub: 'Without subscription',
    level: 'Level {n}',
    levelShort: 'subscribed {with} · none {without}',
    statsError: 'Could not load stats',
  },
  noAccess: 'No tabs available. Ask the owner to grant access.',
}

const dictionaries = { ru, en } as const

export type Dictionary = typeof ru

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Dictionary
}

const I18nContext = createContext<I18nContextValue | null>(null)

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'ru'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'en' || stored === 'ru' ? stored : 'ru'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru')

  useEffect(() => {
    setLocaleState(readStoredLocale())
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale(next) {
      setLocaleState(next)
      window.localStorage.setItem(STORAGE_KEY, next)
    },
    t: dictionaries[locale],
  }), [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n()
  return (
    <div className={`flex text-xs rounded-lg border border-gray-800 overflow-hidden ${className}`}>
      {(['ru', 'en'] as const).map(item => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          className={`px-2.5 py-1.5 uppercase tracking-wide transition ${
            locale === item ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}
