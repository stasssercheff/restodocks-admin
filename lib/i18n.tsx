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
    establishments: 'Заведения',
    promo: 'Промокоды',
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
    newHint: 'Это доступ в эту админку, не сотрудники заведений в Restodocks. Отметь, какие вкладки ему показывать.',
    access: 'Доступ к разделам',
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
    establishments: 'Venues',
    promo: 'Promo codes',
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
    newHint: 'This is access to this admin panel, not Restodocks venue staff. Tick which tabs they can see.',
    access: 'Tab access',
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
