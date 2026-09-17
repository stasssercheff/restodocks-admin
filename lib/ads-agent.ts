export type AdsAgentSettings = {
  daily_limit: number
  weekly_limit: number
  period_limit: number
  period_start: string | null
  period_end: string | null
  currency: string
  landing: string
  primary_language: string
  geo_notes: string
  pause_if_no_result_days: number
  warn_daily_pct: number
  status: 'idle' | 'configured' | 'awaiting_approval' | 'armed' | 'paused' | string
  meta_ad_account_id: string
  meta_page_id: string
  notes: string
  updated_at: string | null
}

export type AdsAgentDraft = {
  id: string
  language: string
  angle: string
  angle_label: string
  trend_note: string
  headline: string
  primary_text: string
  cta: string
  creative_brief: string
  approved: boolean | null
}

export type AdsAgentPlan = {
  generated_at: string
  landing_url: string
  objective: string
  audience_notes: string
  safety_rules: string[]
  budget_summary: string
  estimates: string[]
  offer_process: string
  drafts: AdsAgentDraft[]
}

export const DEFAULT_ADS_SETTINGS: AdsAgentSettings = {
  daily_limit: 0,
  weekly_limit: 0,
  period_limit: 0,
  period_start: null,
  period_end: null,
  currency: 'VND',
  landing: 'demo',
  primary_language: 'ru',
  geo_notes: 'Outside Russia. Prefer markets where Lemon Squeezy / iOS billing works.',
  pause_if_no_result_days: 3,
  warn_daily_pct: 80,
  status: 'idle',
  meta_ad_account_id: '665520004065928',
  meta_page_id: '',
  notes: '',
  updated_at: null,
}

const LANDING_URLS: Record<string, string> = {
  demo: 'https://restodocks.com/demo',
  register_owner: 'https://restodocks.com/register-owner',
  promo: 'https://restodocks.com/promo',
}

const CREATIVE = {
  brand: 'Красный RD Restodocks, как на facebook.com/Restodocks и на /promo.',
  ttk: 'Экран списка ТТК / import-review: кривой Excel → чистые карточки (как demo_promo screenshot TTK).',
  cost: 'Карточка блюда с себестоимостью (promo money / ttk cost).',
  prep: 'Чеклист заготовок, не WhatsApp-чат.',
  honest: 'В тексте честно: демо по email, 1 день; не обещать «без регистрации» и «100 карт».',
}

const ANGLES: { angle: string; angle_label: string; trend_note: string; headline: Record<string, string>; text: Record<string, string>; cta: Record<string, string>; brief: string }[] = [
  {
    angle: 'excel_import',
    angle_label: 'Recipe import / kitchen automation',
    trend_note: 'Chefs want file→cards, not another full ERP pitch.',
    headline: {
      en: 'Messy Excel recipes → live kitchen cards',
      ru: 'Кривой Excel → живые карточки ТТК',
      tr: 'Dağınık Excel tarifleri → mutfak kartları',
      vi: 'Excel lộn xộn → thẻ bếp sống',
      es: 'Excel desordenado → fichas de cocina',
    },
    text: {
      en: 'Restodocks for chefs: drop Excel/PDF, review cards like on our site — yield, method, cost path. 1-day demo via email at restodocks.com/demo. Independent kitchens, not enterprise rip-and-replace.',
      ru: 'Restodocks для шефов: загрузите Excel/PDF, проверьте карточки как на сайте — выход, метод, себестоимость. Демо на 1 день по email: restodocks.com/demo.',
      tr: 'Restodocks: Excel/PDF yükleyin, kartları sitedeki gibi kontrol edin. 1 günlük demo e-posta ile restodocks.com/demo.',
      vi: 'Restodocks cho bếp trưởng: tải Excel/PDF, xem thẻ như trên site. Demo 1 ngày qua email restodocks.com/demo.',
      es: 'Restodocks para chefs: sube Excel/PDF y revisa fichas como en el sitio. Demo de 1 día por email en restodocks.com/demo.',
    },
    cta: { en: 'Open demo', ru: 'Открыть демо', tr: 'Demoyu aç', vi: 'Mở demo', es: 'Abrir demo' },
    brief: `${CREATIVE.brand} ${CREATIVE.ttk} ${CREATIVE.honest}`,
  },
  {
    angle: 'food_cost',
    angle_label: 'Food cost pressure',
    trend_note: 'Margin squeeze is the #1 ops topic in F&B media.',
    headline: {
      en: 'Food cost without the midnight spreadsheet',
      ru: 'Себестоимость без ночной таблицы',
      tr: 'Gece Excel’i olmadan food cost',
      vi: 'Giá thành món không cần Excel đêm',
      es: 'Food cost sin la hoja de medianoche',
    },
    text: {
      en: 'Prices on products → dish cost on the tech card. Same UI story as Restodocks promo. Demo: email, 1 day. Built for chef-owners, not corporate rollouts.',
      ru: 'Цены на продукты → себестоимость на карточке блюда. Как на промо Restodocks. Демо: email, 1 день.',
      tr: 'Ürün fiyatları → kartta yemek maliyeti. Demo: e-posta, 1 gün.',
      vi: 'Giá nguyên liệu → giá thành trên thẻ món. Demo: email, 1 ngày.',
      es: 'Precios de productos → coste en la ficha. Demo: email, 1 día.',
    },
    cta: { en: 'Try demo', ru: 'Попробовать демо', tr: 'Demoyu dene', vi: 'Thử demo', es: 'Probar demo' },
    brief: `${CREATIVE.brand} ${CREATIVE.cost} ${CREATIVE.honest}`,
  },
  {
    angle: 'prep_whatsapp',
    angle_label: 'Prep out of chat apps',
    trend_note: 'WhatsApp kitchens are a known ops anti-pattern.',
    headline: {
      en: 'Prep lists that aren’t WhatsApp threads',
      ru: 'Заготовки не в WhatsApp',
      tr: 'WhatsApp’ta olmayan prep listesi',
      vi: 'Checklist sơ chế không phải WhatsApp',
      es: 'Listas de prep que no son hilos de WhatsApp',
    },
    text: {
      en: 'Restodocks prep checklists: recipe + required yield + deadline for the chef. Matches the product UI. Demo via email — 1 day.',
      ru: 'Чеклисты заготовок Restodocks: рецепт + выход + срок. Как в продукте. Демо по email — 1 день.',
      tr: 'Restodocks prep checklist: tarif + miktar + deadline. Demo e-posta ile — 1 gün.',
      vi: 'Checklist sơ chế Restodocks: công thức + định lượng + hạn. Demo email — 1 ngày.',
      es: 'Checklists de prep: receta + rendimiento + plazo. Demo por email — 1 día.',
    },
    cta: { en: 'See demo', ru: 'Смотреть демо', tr: 'Demoyu gör', vi: 'Xem demo', es: 'Ver demo' },
    brief: `${CREATIVE.brand} ${CREATIVE.prep} ${CREATIVE.honest}`,
  },
]

function pickLang(map: Record<string, string>, lang: string): string {
  return map[lang] ?? map.en
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

export function buildAdsPlan(settings: AdsAgentSettings, previous?: AdsAgentPlan | null): AdsAgentPlan {
  const lang = settings.primary_language || 'en'
  const landingUrl = LANDING_URLS[settings.landing] ?? LANDING_URLS.demo
  const previousByAngle = new Map((previous?.drafts ?? []).map(draft => [`${draft.language}:${draft.angle}`, draft]))
  const drafts: AdsAgentDraft[] = ANGLES.map((item, index) => {
    const id = `${lang}-${item.angle}-${index}`
    const prev = previousByAngle.get(`${lang}:${item.angle}`)
    return {
      id,
      language: lang,
      angle: item.angle,
      angle_label: item.angle_label,
      trend_note: item.trend_note,
      headline: pickLang(item.headline, lang),
      primary_text: pickLang(item.text, lang),
      cta: pickLang(item.cta, lang),
      creative_brief: item.brief,
      approved: prev?.approved ?? null,
    }
  })

  const budgetParts: string[] = []
  if (settings.daily_limit > 0) budgetParts.push(`день ${formatMoney(settings.daily_limit, settings.currency)}`)
  if (settings.weekly_limit > 0) budgetParts.push(`неделя ${formatMoney(settings.weekly_limit, settings.currency)}`)
  if (settings.period_limit > 0) budgetParts.push(`период ${formatMoney(settings.period_limit, settings.currency)}`)

  const estimates: string[] = []
  if (settings.daily_limit > 0) {
    estimates.push(`В день до ${formatMoney(settings.daily_limit, settings.currency)}: ориентир ~2–16 кликов на сайт (не регистрации).`)
  }
  estimates.push('Из кликов до демо/регистрации обычно доходит малая доля — смотрим факт в отчётах, не обещания Meta.')
  estimates.push(
    `Защита: предупреждение при ${settings.warn_daily_pct}% дневного лимита; пауза, если ${settings.pause_if_no_result_days} дн. трат без результата (когда подключим API).`,
  )

  return {
    generated_at: new Date().toISOString(),
    landing_url: landingUrl,
    objective: settings.landing === 'promo'
      ? 'Трафик на /promo (витрина).'
      : settings.landing === 'register_owner'
        ? 'Трафик / лиды на регистрацию владельца.'
        : 'Трафик / лиды на /demo (email → песочница), не «лайки страницы».',
    audience_notes: `Шеф / су-шеф / шеф-владелец независимого кафе/ресторана. Не сети на тяжёлой ERP; не гео Россия. ${settings.geo_notes}`.trim(),
    safety_rules: [
      'Не превышать дневной / недельный / периодный лимит без нового подтверждения.',
      'Не крутить кабинет «Станислав SMM» и любые RUB/РФ-аккаунты.',
      settings.meta_ad_account_id ? `Целевой рекламный аккаунт: act_${settings.meta_ad_account_id.replace(/^act_/, '')}.` : 'Указать рекламный аккаунт Meta.',
      'Не обещать «100 ТТК» и «демо без email» — в продукте другие лимиты.',
      `Пауза при ${settings.pause_if_no_result_days} днях трат без демо/регистраций (после API).`,
    ],
    budget_summary: budgetParts.length ? `Лимиты: ${budgetParts.join('. ')}.` : 'Лимиты не заданы — агент не тратит.',
    estimates,
    offer_process: 'Оффер делает агент (3 угла по трендам кухни + тон сайта Restodocks). Вы только Ок/Нет. Креатив: бриф под UI сайта; ролик/скрин можно снять по брифу или загрузить позже. Старый одиночный текст «Excel ночью» больше не единственный вариант.',
    drafts,
  }
}

export const META_API_DISCONNECTED = {
  connected: false,
  reason: 'Meta Marketing API ещё не подключён (нужны приложение разработчика + токен системного пользователя). Агент уже считает лимиты и черновики; автозапуск — после токена.',
}

export function mergeAdsSettings(input: unknown, current: AdsAgentSettings): AdsAgentSettings {
  const body = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const next = { ...current }
  const assignNumber = (key: keyof AdsAgentSettings) => {
    const value = body[key]
    if (typeof value === 'number' && Number.isFinite(value)) (next as Record<string, unknown>)[key] = value
    else if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      (next as Record<string, unknown>)[key] = Number(value)
    }
  }
  const assignString = (key: keyof AdsAgentSettings) => {
    const value = body[key]
    if (typeof value === 'string') (next as Record<string, unknown>)[key] = value
  }
  assignNumber('daily_limit')
  assignNumber('weekly_limit')
  assignNumber('period_limit')
  assignNumber('pause_if_no_result_days')
  assignNumber('warn_daily_pct')
  assignString('currency')
  assignString('landing')
  assignString('primary_language')
  assignString('geo_notes')
  assignString('status')
  assignString('meta_ad_account_id')
  assignString('meta_page_id')
  assignString('notes')
  if (body.period_start === null || typeof body.period_start === 'string') next.period_start = body.period_start as string | null
  if (body.period_end === null || typeof body.period_end === 'string') next.period_end = body.period_end as string | null
  next.updated_at = new Date().toISOString()
  return next
}
