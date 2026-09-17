// @ts-nocheck
'use client'

// Recovered from production worker 0f158d78 (2026-09-16) — original full admin UI.
// @ts-nocheck

import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import * as s from 'react'
import { useRouter } from 'next/navigation'
import StaffTab from './staff-tab'
import PartnerScopeBanner from './partner-scope-banner'
import { LanguageSwitcher } from '@/lib/i18n'
import { canAccessPage } from '@/lib/admin-pages'

const r = { jsx, jsxs, Fragment }
const l = { useRouter }

const ADMIN_TAB_ORDER = [
  'reviews', 'ads_agent', 'establishments', 'promo', 'popups', 'ai_usage',
  'demo_sandboxes', 'marketing_visits', 'broadcast', 'support', 'security', 'health',
]

function firstAllowedTab(user) {
  if (!user) return 'reviews'
  if (user.isOwner) return 'reviews'
  const found = ADMIN_TAB_ORDER.find(key => canAccessPage(user, key))
  return found || 'establishments'
}

function ReferralLevelBadge({ level }) {
  if (!level) return null
  return (0, r.jsx)('span', {
    className: 'ml-1 inline-flex align-middle rounded border border-indigo-800/70 bg-indigo-950/50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-200',
    title: `Реферальный уровень ${level}: 1 — промокод, 2+ — по реферальной ссылке`,
    children: `ур. ${level}`,
  })
}

function isAllowedPromoGrantType(value) {
  const v = String(value ?? '').toLowerCase().trim()
  return ['pro', 'ultra', 'ultimate', 'premium', 'plus', 'starter', 'business'].includes(v)
}

let n = ["pro", "ultra", "ultimate"],
    i = ["pro", "premium", "ultra", "ultimate", "plus", "starter", "business"];

function o(e) {
    return null == e || "" === e ? "free" : "string" == typeof e ? e.toLowerCase().trim() : String(e).toLowerCase().trim()
}

function d(e) {
    var t;
    return null !== (t = ({
        free: "Free",
        lite: "Lite",
        pro: "Pro",
        premium: "Premium",
        ultra: "Ultra",
        ultimate: "Ultimate (промо, скрытый)",
        plus: "Plus",
        starter: "Starter",
        business: "Business"
    })[o(e)]) && void 0 !== t ? t : "string" == typeof e ? e.trim() : String(null != e ? e : "—")
}

function c(e) {
    return "free" !== e && "" !== e && isAllowedPromoGrantType(e)
}

function x(e) {
    if (!e) return null;
    let t = new Date(e);
    return Number.isNaN(t.getTime()) ? null : t
}
let m = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
};

function u(e) {
    var t, a;
    if (!(null == e ? void 0 : e.code)) return null;
    let r = e.activation_duration_days;
    if (null != r && r > 0) {
        let a = x(null !== (t = e.redeemed_at) && void 0 !== t ? t : null);
        return a ? new Date(a.getTime() + 864e5 * r) : null
    }
    return x(null !== (a = e.expires_at) && void 0 !== a ? a : null)
}
let p = [{
        value: "all",
        label: "Все"
    }, {
        value: "no_pro",
        label: "Без подписки"
    }, {
        value: "trial",
        label: "Пробный"
    }, {
        value: "pro_paid",
        label: "Pro (оплата)"
    }, {
        value: "ultra_paid",
        label: "Ultra (оплата)"
    }, {
        value: "pro_promo",
        label: "Pro (промокод)"
    }, {
        value: "ultra_promo",
        label: "Ultra (промокод)"
    }, {
        value: "promo_slots",
        label: "Только допы (промо)"
    }, {
        value: "expired",
        label: "Истёк"
    }, {
        value: "other",
        label: "Прочее"
    }],
    g = [{
        value: "all",
        label: "Все"
    }, {
        value: "none",
        label: "Без допов"
    }, {
        value: "employees",
        label: "+ сотрудники"
    }, {
        value: "branches",
        label: "+ заведения"
    }, {
        value: "both",
        label: "Сотр. и завед."
    }, {
        value: "any",
        label: "Любые допы"
    }];

function h(e, t) {
    let a = (null != e ? e : "no_pro").trim();
    return "all" === t || ("no_pro" === t ? "no_pro" === a : "trial" === t ? "trial" === a : "expired" === t ? a.startsWith("expired|") : "promo_slots" === t ? a.startsWith("promo_addon|") : "other" === t ? a.startsWith("other|") : "pro_paid" === t ? a.startsWith("iap|pro|") : "ultra_paid" === t ? a.startsWith("iap|ultra|") : "pro_promo" === t ? a.startsWith("promo|pro|") && !a.startsWith("expired|") : "ultra_promo" === t && a.startsWith("promo|ultra|") && !a.startsWith("expired|"))
}

function y(e, t) {
    if ("all" === t) return !0;
    let {
        employeePacks: a,
        branchPacks: r
    } = function(e) {
        var t, a, r, s, l, n, i, o, d, c;
        let x = (null != e ? e : "no_pro").trim();
        if ("no_pro" === x || "trial" === x) return {
            employeePacks: 0,
            branchPacks: 0,
            additiveOnly: !1
        };
        let m = x.split("|"),
            u = m[0];
        if ("iap" === u) return {
            employeePacks: Math.max(0, Number(null !== (t = m[2]) && void 0 !== t ? t : 0)),
            branchPacks: Math.max(0, Number(null !== (a = m[3]) && void 0 !== a ? a : 0)),
            additiveOnly: !1
        };
        if ("promo" === u) return {
            employeePacks: Math.max(0, Number(null !== (r = m[2]) && void 0 !== r ? r : 0)),
            branchPacks: Math.max(0, Number(null !== (s = m[3]) && void 0 !== s ? s : 0)),
            additiveOnly: "1" === m[4]
        };
        if ("promo_addon" === u) return {
            employeePacks: Math.max(0, Number(null !== (l = m[2]) && void 0 !== l ? l : 0)),
            branchPacks: Math.max(0, Number(null !== (n = m[3]) && void 0 !== n ? n : 0)),
            additiveOnly: !0
        };
        if ("expired" === u) {
            if ("promo_addon" === m[1]) return {
                employeePacks: Math.max(0, Number(null !== (i = m[3]) && void 0 !== i ? i : 0)),
                branchPacks: Math.max(0, Number(null !== (o = m[4]) && void 0 !== o ? o : 0)),
                additiveOnly: !0
            };
            if ("promo" === m[1] || "iap" === m[1]) return {
                employeePacks: Math.max(0, Number(null !== (d = m[3]) && void 0 !== d ? d : 0)),
                branchPacks: Math.max(0, Number(null !== (c = m[4]) && void 0 !== c ? c : 0)),
                additiveOnly: !1
            }
        }
        return {
            employeePacks: 0,
            branchPacks: 0,
            additiveOnly: !1
        }
    }(null != e ? e : "no_pro"), s = a > 0, l = r > 0;
    return "none" === t ? !s && !l : "employees" === t ? s : "branches" === t ? l : "both" === t ? s && l : "any" !== t || s || l
}
let b = {
    checklist: "Чек-листы (генерация)",
    translation: "Переводы (меню, ТТК, тексты)",
    product_dedup: "Номенклатура: поиск дубликатов",
    product_parse: "Номенклатура: разбор текста/цен",
    product_lang: "Номенклатура: определение языка",
    ttk: "ТТК",
    ttk_parse: "ТТК: парсинг",
    ttk_create: "ТТК: создание",
    nutrition: "КБЖУ",
    product: "Продукты / номенклатура",
    economy: "ИИ-экономика / меню",
    unknown: "Не указан"
};

function v(e) {
    var t, a;
    return null !== (a = null !== (t = b[(null != e ? e : "unknown").toLowerCase()]) && void 0 !== t ? t : e) && void 0 !== a ? a : "unknown"
}
let j = {
        "/login": "Вход",
        "/promo": "Промо",
        "/register-company": "Регистрация компании",
        "/register-owner": "Регистрация владельца",
        "/register": "Регистрация сотрудника",
        "/owner-registration": "Регистрация владельца",
        "/register-co-owner": "Соучредитель",
        "/accept-co-owner-invitation": "Приглашение соучредителя",
        "/splash": "Старт (splash)",
        "/home": "Главная (приложение)"
    },
    N = [{
        value: "prod",
        label: "Только прод (.com / .ru)"
    }, {
        value: "not_beta",
        label: "Без беты и localhost"
    }, {
        value: "beta",
        label: "Только бета (pages.dev)"
    }, {
        value: "all",
        label: "Все хосты"
    }],
    f = new Set(["restodocks.com", "www.restodocks.com", "restodocks.ru", "www.restodocks.ru"]);

function _(e) {
    let t = (null != e ? e : "").trim().toLowerCase();
    return t ? ! function(e) {
        let t = (null != e ? e : "").trim().toLowerCase();
        return !!t && f.has(t)
    }(t) ? t.includes("pages.dev") ? "бета \xb7 ".concat(t) : "localhost" === t || t.startsWith("127.0.0.1") ? "localhost" : t : t : "—"
}

function w(e) {
    var t;
    let a = (null != e ? e : "").trim();
    return a ? null !== (t = j[a]) && void 0 !== t ? t : a : "—"
}
let k = {
    ru: "Русский",
    en: "English",
    es: "Espa\xf1ol",
    kk: "Қазақша",
    de: "Deutsch",
    fr: "Fran\xe7ais",
    it: "Italiano",
    tr: "T\xfcrk\xe7e",
    vi: "Tiếng Việt",
    pl: "Polski",
    ro: "Rom\xe2nă",
    pt: "Portugu\xeas",
    uk: "Українська"
};

function C(e) {
    var t;
    let a = (null != e ? e : "").trim().toLowerCase();
    return a ? null !== (t = k[a]) && void 0 !== t ? t : a.toUpperCase() : "—"
}
let S = [{
        id: "locale_chosen",
        label: "Выбор языка",
        legacyTypes: []
    }, {
        id: "registration_nav_start_using",
        label: "\xabНачать использование\xbb",
        legacyTypes: ["cta_start"]
    }, {
        id: "registration_nav_try_ultra",
        label: "\xabПопробовать ультра\xbb",
        legacyTypes: ["cta_start_try_ultra"]
    }, {
        id: "registration",
        label: "Регистрация",
        legacyTypes: []
    }],
    L = ([...S.map(e => e.id), ...S.flatMap(e => e.legacyTypes)], {
        locale_chosen: "Выбор языка",
        registration_nav_start_using: "\xabНачать использование\xbb",
        registration_nav_try_ultra: "\xabПопробовать ультра\xbb",
        registration: "Регистрация",
        cta_start: "\xabНачать использование\xbb",
        cta_start_try_ultra: "\xabПопробовать ультра\xbb",
        page_view: "Просмотр страницы",
        cta_demo: "Переход на \xabОбзор функционала\xbb",
        popup_shown: "Показ попапа (промокод)",
        popup_dismiss: "Уход со страницы",
        cta_about_promo: "Переход на страницу \xabО нас\xbb",
        login_intro_dismiss: "Уход со страницы",
        login_intro_shown: "Показ кнопки/диалога \xabО нас\xbb",
        app_login: "Вход в систему (email/пароль)",
        app_open: "Открытие приложения (уже залогинен)"
    }),
    T = {
        human: "Человек",
        bot: "Бот / проверка",
        uncertain: "Неясно"
    };

function P(e) {
    var t;
    let a = (null != e ? e : "").trim().toLowerCase();
    return a ? null !== (t = T[a]) && void 0 !== t ? t : a : "—"
}

function E(e) {
    var t;
    let a = (null != e ? e : "").trim().toLowerCase();
    return a ? null !== (t = L[a]) && void 0 !== t ? t : a : "—"
}
let I = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
};

function A(e, t) {
    try {
        return new Date(e).toLocaleString("ru-RU", {
            ...I,
            timeZone: t
        })
    } catch (e) {
        return null
    }
}

function D() {
    if ("undefined" == typeof Intl) return "UTC";
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    } catch (e) {
        return "UTC"
    }
}

function R(e, t) {
    var a;
    return e ? null !== (a = A(e, (null != t ? t : "").trim() || "UTC")) && void 0 !== a ? a : new Date(e).toLocaleString("ru-RU") : "—"
}

function U(e, t) {
    if (!e) return "—";
    let a = A(e, (null != t ? t : "").trim() || D());
    return a ? "у вас: ".concat(a) : "у вас: ".concat(new Date(e).toLocaleString("ru-RU"))
}

function O(e) {
    var t, a, r, s, l, n;
    let i = (null !== (l = e.location_label) && void 0 !== l ? l : "").trim();
    if (i) return i;
    let o = [];
    return ((null === (t = e.city) || void 0 === t ? void 0 : t.trim()) && o.push(e.city.trim()), (null === (a = e.region) || void 0 === a ? void 0 : a.trim()) && e.region.trim() !== (null === (r = e.city) || void 0 === r ? void 0 : r.trim()) && o.push(e.region.trim()), (null === (s = e.country_code) || void 0 === s ? void 0 : s.trim()) && o.push(e.country_code.trim().toUpperCase()), o.length > 0) ? o.join(", ") : (null !== (n = e.ip) && void 0 !== n ? n : "").trim() || "—"
}
let F = new Set(["example.com", "example.org", "example.net", "test.com", "test.test", "localhost"]),
    M = new Set(["test", "demo", "admin", "user", "asdf", "qwerty"]);

function q(e) {
    let t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : new Set,
        a = (null != e ? e : "").trim().toLowerCase();
    if (!a.includes("@") || t.has(a)) return !0;
    let r = a.lastIndexOf("@"),
        s = a.slice(0, r),
        l = a.slice(r + 1);
    return !!(!s || !l || F.has(l) || l.endsWith(".example.com") || l.endsWith(".test") || l.endsWith(".invalid") || l.endsWith(".local") || M.has(s) || /^(test|demo)[0-9._+-]/.test(s) || /^demo-ok/.test(s) || /(^|[._+-])test\d*([._+-]|$)/.test(s))
}
let H = ["ru", "en", "es", "kk", "de", "fr", "it", "tr", "vi", "pl", "ro", "pt", "uk"];

function W(e) {
    switch (e) {
        case "promo_landing":
            return "Страница /promo (гость)";
        case "app_shell":
            return "В приложении после входа";
        default:
            return e
    }
}

function J(e) {
    switch (e) {
        case "anonymous":
            return "Гость (без входа)";
        case "billing_owner":
            return "Владелец-оплатчик";
        default:
            return e
    }
}

function z(e) {
    switch (e) {
        case "simple":
            return "Текстовое уведомление";
        case "promo_code":
            return "Промокод (с копированием)";
        default:
            return e
    }
}

function G(e) {
    if (!e) return "";
    let t = new Date(e);
    if (Number.isNaN(t.getTime())) return "";
    let a = t.getFullYear(),
        r = String(t.getMonth() + 1).padStart(2, "0"),
        s = String(t.getDate()).padStart(2, "0");
    return "".concat(a, "-").concat(r, "-").concat(s)
}

function K() {
    return {
        slug: "",
        name: "",
        is_enabled: !0,
        priority: "50",
        placement: "promo_landing",
        audience: "anonymous",
        ui_type: "promo_code",
        active_from: "",
        active_until: "",
        promo_code: "WELCOME26",
        require_promo_available: !0,
        hours_before_promo_expiry: "",
        require_active_establishment_promo: !1,
        contentRu: {},
        contentEn: {},
        show_once: !0
    }
}

function V() {
    let [e, t] = (0, s.useState)([]), [a, l] = (0, s.useState)(!0), [n, i] = (0, s.useState)(!1), [o, d] = (0, s.useState)(null), [c, x] = (0, s.useState)(null), [m, u] = (0, s.useState)(K), [p, g] = (0, s.useState)(!1), h = (0, s.useCallback)(async () => {
        l(!0), d(null);
        let e = await fetch("/api/popup-campaigns"),
            a = await e.json();
        e.ok ? t(Array.isArray(a) ? a : []) : (d("string" == typeof(null == a ? void 0 : a.error) ? a.error : "Ошибка загрузки"), t([])), l(!1)
    }, []);
    (0, s.useEffect)(() => {
        h()
    }, [h]);
    let y = (0, s.useMemo)(() => [...e].sort((e, t) => t.priority - e.priority || t.updated_at.localeCompare(e.updated_at)), [e]);
    async function b() {
        i(!0), d(null);
        try {
            let e = function() {
                    let e = {};
                    Object.keys(m.contentRu).length && (e.ru = m.contentRu), Object.keys(m.contentEn).length && (e.en = m.contentEn);
                    let t = m.hours_before_promo_expiry.trim() ? parseInt(m.hours_before_promo_expiry.trim(), 10) : null;
                    return {
                        slug: m.slug.trim().toLowerCase(),
                        name: m.name.trim(),
                        is_enabled: m.is_enabled,
                        priority: parseInt(m.priority.trim() || "0", 10),
                        placement: m.placement,
                        audience: m.audience,
                        ui_type: m.ui_type,
                        active_from: m.active_from ? new Date(m.active_from).toISOString() : null,
                        active_until: m.active_until ? new Date(m.active_until).toISOString() : null,
                        show_once: m.show_once,
                        conditions: {
                            promo_code: m.promo_code.trim() || null,
                            require_promo_available: "promo_code" === m.ui_type || m.require_promo_available,
                            hours_before_promo_expiry: t,
                            require_active_establishment_promo: m.require_active_establishment_promo
                        },
                        content: e
                    }
                }(),
                t = await fetch("/api/popup-campaigns", {
                    method: c ? "PATCH" : "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(c ? {
                        id: c,
                        ...e
                    } : e)
                }),
                a = await t.json().catch(() => ({}));
            if (!t.ok) {
                d("string" == typeof(null == a ? void 0 : a.error) ? a.error : "Ошибка сохранения");
                return
            }
            g(!1), x(null), await h()
        } finally {
            i(!1)
        }
    }
    async function v(e) {
        await fetch("/api/popup-campaigns", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e.id,
                is_enabled: !e.is_enabled
            })
        }), await h()
    }
    async function j(e) {
        confirm("Удалить кампанию попапа?") && (await fetch("/api/popup-campaigns", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e
            })
        }), await h())
    }

    function N(e, t, a) {
        u(r => ({
            ...r,
            [e]: {
                ...r[e],
                [t]: a
            }
        }))
    }
    return (0, r.jsxs)("div", {
        className: "space-y-6",
        children: [(0, r.jsxs)("div", {
            className: "flex flex-wrap items-center justify-between gap-3",
            children: [(0, r.jsxs)("div", {
                children: [(0, r.jsx)("h2", {
                    className: "text-lg font-semibold",
                    children: "Попапы в приложении"
                }), (0, r.jsx)("p", {
                    className: "text-sm text-gray-400 mt-1 max-w-2xl",
                    children: "Кампании с условиями показа и текстами по языкам. Приоритет выше — проверяется раньше. Для промо на /promo: привязка к коду и лимиту погашений. Для app_shell: владелец-оплатчик, за N часов до окончания промо."
                })]
            }), (0, r.jsx)("button", {
                type: "button",
                onClick: function() {
                    x(null), u(K()), g(!0)
                },
                className: "px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium",
                children: "Новая кампания"
            })]
        }), o ? (0, r.jsx)("p", {
            className: "text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2",
            children: o
        }) : null, p ? (0, r.jsxs)("div", {
            className: "border border-gray-800 rounded-xl p-4 sm:p-6 bg-gray-900/60 space-y-4",
            children: [(0, r.jsx)("h3", {
                className: "font-medium",
                children: c ? "Редактирование" : "Новая кампания"
            }), (0, r.jsxs)("div", {
                className: "grid sm:grid-cols-2 gap-3",
                children: [(0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Slug (уникальный id)"
                    }), (0, r.jsx)("input", {
                        className: "mt-1 w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2",
                        value: m.slug,
                        onChange: e => u(t => ({
                            ...t,
                            slug: e.target.value
                        })),
                        disabled: !!c,
                        placeholder: "welcome26_promo_landing"
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Название (для админки)"
                    }), (0, r.jsx)("input", {
                        className: "mt-1 w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2",
                        value: m.name,
                        onChange: e => u(t => ({
                            ...t,
                            name: e.target.value
                        }))
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Приоритет"
                    }), (0, r.jsx)("input", {
                        type: "number",
                        className: "mt-1 w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2",
                        value: m.priority,
                        onChange: e => u(t => ({
                            ...t,
                            priority: e.target.value
                        }))
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm flex items-center gap-2 mt-6",
                    children: [(0, r.jsx)("input", {
                        type: "checkbox",
                        checked: m.is_enabled,
                        onChange: e => u(t => ({
                            ...t,
                            is_enabled: e.target.checked
                        }))
                    }), "Включена"]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Где показывать"
                    }), (0, r.jsxs)("select", {
                        className: "mt-1 w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2",
                        value: m.placement,
                        onChange: e => u(t => ({
                            ...t,
                            placement: e.target.value
                        })),
                        children: [(0, r.jsx)("option", {
                            value: "promo_landing",
                            children: W("promo_landing")
                        }), (0, r.jsx)("option", {
                            value: "app_shell",
                            children: W("app_shell")
                        })]
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Аудитория"
                    }), (0, r.jsxs)("select", {
                        className: "mt-1 w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2",
                        value: m.audience,
                        onChange: e => u(t => ({
                            ...t,
                            audience: e.target.value
                        })),
                        children: [(0, r.jsx)("option", {
                            value: "anonymous",
                            children: J("anonymous")
                        }), (0, r.jsx)("option", {
                            value: "billing_owner",
                            children: J("billing_owner")
                        })]
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Тип UI"
                    }), (0, r.jsxs)("select", {
                        className: "mt-1 w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2",
                        value: m.ui_type,
                        onChange: e => u(t => ({
                            ...t,
                            ui_type: e.target.value
                        })),
                        children: [(0, r.jsx)("option", {
                            value: "promo_code",
                            children: z("promo_code")
                        }), (0, r.jsx)("option", {
                            value: "simple",
                            children: z("simple")
                        })]
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Активна с (дата)"
                    }), (0, r.jsx)("input", {
                        type: "date",
                        className: "mt-1 w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2",
                        value: m.active_from,
                        onChange: e => u(t => ({
                            ...t,
                            active_from: e.target.value
                        }))
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Активна до (дата)"
                    }), (0, r.jsx)("input", {
                        type: "date",
                        className: "mt-1 w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2",
                        value: m.active_until,
                        onChange: e => u(t => ({
                            ...t,
                            active_until: e.target.value
                        }))
                    })]
                })]
            }), (0, r.jsxs)("fieldset", {
                className: "border border-gray-800 rounded-lg p-3 space-y-2",
                children: [(0, r.jsx)("legend", {
                    className: "text-sm text-gray-300 px-1",
                    children: "Условия"
                }), (0, r.jsxs)("label", {
                    className: "block text-sm sm:max-w-xs",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Промокод (для проверки лимита)"
                    }), (0, r.jsx)("input", {
                        className: "mt-1 w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2 uppercase",
                        value: m.promo_code,
                        onChange: e => u(t => ({
                            ...t,
                            promo_code: e.target.value
                        }))
                    })]
                }), (0, r.jsxs)("label", {
                    className: "flex items-center gap-2 text-sm",
                    children: [(0, r.jsx)("input", {
                        type: "checkbox",
                        checked: "promo_code" === m.ui_type || m.require_promo_available,
                        disabled: "promo_code" === m.ui_type,
                        onChange: e => u(t => ({
                            ...t,
                            require_promo_available: e.target.checked
                        }))
                    }), "Показывать только если промокод ещё доступен (лимит не исчерпан)"]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm sm:max-w-xs",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "За сколько часов до окончания промо (app_shell)"
                    }), (0, r.jsx)("input", {
                        type: "number",
                        className: "mt-1 w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2",
                        value: m.hours_before_promo_expiry,
                        onChange: e => u(t => ({
                            ...t,
                            hours_before_promo_expiry: e.target.value
                        })),
                        placeholder: "48"
                    })]
                }), (0, r.jsxs)("label", {
                    className: "flex items-center gap-2 text-sm",
                    children: [(0, r.jsx)("input", {
                        type: "checkbox",
                        checked: m.require_active_establishment_promo,
                        onChange: e => u(t => ({
                            ...t,
                            require_active_establishment_promo: e.target.checked
                        }))
                    }), "Требуется активное промо у заведения"]
                })]
            }), ["contentRu", "contentEn"].map(e => {
                let t = "contentRu" === e ? "Тексты RU" : "Тексты EN",
                    a = m[e],
                    s = "promo_code" === m.ui_type ? [{
                        key: "title",
                        label: "Заголовок"
                    }, {
                        key: "valid_until",
                        label: "Срок действия (строка)"
                    }, {
                        key: "promo_code",
                        label: "Код в попапе"
                    }, {
                        key: "how_to_btn",
                        label: "Кнопка \xabкак ввести\xbb"
                    }, {
                        key: "how_to_title",
                        label: "Заголовок инструкции"
                    }, {
                        key: "how_to_body",
                        label: "Текст инструкции"
                    }, {
                        key: "back",
                        label: "Назад"
                    }, {
                        key: "close",
                        label: "Закрыть"
                    }] : [{
                        key: "title",
                        label: "Заголовок"
                    }, {
                        key: "message",
                        label: "Текст ({date} — дата окончания)"
                    }, {
                        key: "close",
                        label: "Закрыть (необяз.)"
                    }];
                return (0, r.jsxs)("fieldset", {
                    className: "border border-gray-800 rounded-lg p-3 space-y-2",
                    children: [(0, r.jsx)("legend", {
                        className: "text-sm text-gray-300 px-1",
                        children: t
                    }), s.map(t => {
                        var s, l;
                        return (0, r.jsxs)("label", {
                            className: "block text-sm",
                            children: [(0, r.jsx)("span", {
                                className: "text-gray-400",
                                children: t.label
                            }), "how_to_body" === t.key || "message" === t.key ? (0, r.jsx)("textarea", {
                                className: "mt-1 w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2 min-h-[72px]",
                                value: null !== (s = a[t.key]) && void 0 !== s ? s : "",
                                onChange: a => N(e, t.key, a.target.value)
                            }) : (0, r.jsx)("input", {
                                className: "mt-1 w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2",
                                value: null !== (l = a[t.key]) && void 0 !== l ? l : "",
                                onChange: a => N(e, t.key, a.target.value)
                            })]
                        }, t.key)
                    })]
                }, e)
            }), (0, r.jsxs)("p", {
                className: "text-xs text-gray-500",
                children: ["Остальные языки (", H.filter(e => "ru" !== e && "en" !== e).join(", "), ") — fallback на EN, затем RU. Позже можно расширить форму."]
            }), (0, r.jsxs)("div", {
                className: "flex flex-wrap gap-2",
                children: [(0, r.jsx)("button", {
                    type: "button",
                    disabled: n,
                    onClick: () => void b(),
                    className: "px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm disabled:opacity-50",
                    children: n ? "Сохранение…" : "Сохранить"
                }), (0, r.jsx)("button", {
                    type: "button",
                    onClick: () => {
                        g(!1), x(null)
                    },
                    className: "px-4 py-2 rounded-lg border border-gray-700 text-sm",
                    children: "Отмена"
                })]
            })]
        }) : null, a ? (0, r.jsx)("p", {
            className: "text-gray-500 text-sm",
            children: "Загрузка…"
        }) : (0, r.jsx)("div", {
            className: "overflow-x-auto border border-gray-800 rounded-xl",
            children: (0, r.jsxs)("table", {
                className: "w-full text-sm",
                children: [(0, r.jsx)("thead", {
                    className: "bg-gray-900 text-gray-400",
                    children: (0, r.jsxs)("tr", {
                        children: [(0, r.jsx)("th", {
                            className: "text-left p-3",
                            children: "Название"
                        }), (0, r.jsx)("th", {
                            className: "text-left p-3",
                            children: "Место"
                        }), (0, r.jsx)("th", {
                            className: "text-left p-3",
                            children: "Аудитория"
                        }), (0, r.jsx)("th", {
                            className: "text-left p-3",
                            children: "Приор."
                        }), (0, r.jsx)("th", {
                            className: "text-left p-3",
                            children: "Статус"
                        }), (0, r.jsx)("th", {
                            className: "text-right p-3",
                            children: "Действия"
                        })]
                    })
                }), (0, r.jsxs)("tbody", {
                    children: [y.map(e => (0, r.jsxs)("tr", {
                        className: "border-t border-gray-800 hover:bg-gray-900/50",
                        children: [(0, r.jsxs)("td", {
                            className: "p-3",
                            children: [(0, r.jsx)("div", {
                                className: "font-medium",
                                children: e.name
                            }), (0, r.jsx)("div", {
                                className: "text-xs text-gray-500",
                                children: e.slug
                            })]
                        }), (0, r.jsx)("td", {
                            className: "p-3",
                            children: W(e.placement)
                        }), (0, r.jsx)("td", {
                            className: "p-3",
                            children: J(e.audience)
                        }), (0, r.jsx)("td", {
                            className: "p-3",
                            children: e.priority
                        }), (0, r.jsx)("td", {
                            className: "p-3",
                            children: e.is_enabled ? (0, r.jsx)("span", {
                                className: "text-emerald-400",
                                children: "Вкл"
                            }) : (0, r.jsx)("span", {
                                className: "text-gray-500",
                                children: "Выкл"
                            })
                        }), (0, r.jsxs)("td", {
                            className: "p-3 text-right space-x-2 whitespace-nowrap",
                            children: [(0, r.jsx)("button", {
                                type: "button",
                                className: "text-indigo-400 hover:underline",
                                onClick: () => {
                                    var t, a, r, s, l, n, i, o, d, c, m;
                                    x(e.id), u({
                                        slug: e.slug,
                                        name: e.name,
                                        is_enabled: e.is_enabled,
                                        priority: String(e.priority),
                                        placement: e.placement,
                                        audience: e.audience,
                                        ui_type: e.ui_type,
                                        active_from: G(e.active_from),
                                        active_until: G(e.active_until),
                                        promo_code: null !== (i = null === (t = e.conditions) || void 0 === t ? void 0 : t.promo_code) && void 0 !== i ? i : "",
                                        require_promo_available: "promo_code" === e.ui_type || null !== (o = null === (a = e.conditions) || void 0 === a ? void 0 : a.require_promo_available) && void 0 !== o && o,
                                        hours_before_promo_expiry: (null === (r = e.conditions) || void 0 === r ? void 0 : r.hours_before_promo_expiry) != null ? String(e.conditions.hours_before_promo_expiry) : "",
                                        require_active_establishment_promo: null !== (d = null === (s = e.conditions) || void 0 === s ? void 0 : s.require_active_establishment_promo) && void 0 !== d && d,
                                        contentRu: {
                                            ...null !== (c = null === (l = e.content) || void 0 === l ? void 0 : l.ru) && void 0 !== c ? c : {}
                                        },
                                        contentEn: {
                                            ...null !== (m = null === (n = e.content) || void 0 === n ? void 0 : n.en) && void 0 !== m ? m : {}
                                        },
                                        show_once: e.show_once
                                    }), g(!0)
                                },
                                children: "Изменить"
                            }), (0, r.jsx)("button", {
                                type: "button",
                                className: "text-amber-400 hover:underline",
                                onClick: () => void v(e),
                                children: e.is_enabled ? "Выкл" : "Вкл"
                            }), (0, r.jsx)("button", {
                                type: "button",
                                className: "text-red-400 hover:underline",
                                onClick: () => void j(e.id),
                                children: "Удалить"
                            })]
                        })]
                    }, e.id)), 0 === y.length ? (0, r.jsx)("tr", {
                        children: (0, r.jsx)("td", {
                            colSpan: 6,
                            className: "p-6 text-center text-gray-500",
                            children: "Нет кампаний. После миграции появятся seed WELCOME26 и предупреждение за 48 ч."
                        })
                    }) : null]
                })]
            })
        })]
    })
}

function B() {
    let [e, t] = (0, s.useState)([]), [a, l] = (0, s.useState)(0), [n, i] = (0, s.useState)(0), [o, d] = (0, s.useState)(0), [c, x] = (0, s.useState)(!0), [m, u] = (0, s.useState)(!1), [p, g] = (0, s.useState)(null), [h, y] = (0, s.useState)(null), [b, v] = (0, s.useState)(null), [j, N] = (0, s.useState)(null), f = (0, s.useCallback)(async e => {
        let a = (null == e ? void 0 : e.silent) === !0;
        g(null), a ? u(!0) : x(!0);
        try {
            let e = await fetch("/api/reviews?_=".concat(Date.now()), {
                    cache: "no-store"
                }),
                x = await e.json();
            if (e.ok) {
                var r, s, n, o, c, m, p, h;
                t((Array.isArray(x.rows) ? x.rows : []).map(e => ({
                    ...e,
                    allow_public_display: !1 !== e.allow_public_display
                }))), l(null !== (m = null !== (c = null === (r = x.summary) || void 0 === r ? void 0 : r.total) && void 0 !== c ? c : null === (s = x.rows) || void 0 === s ? void 0 : s.length) && void 0 !== m ? m : 0), i(null !== (p = null === (n = x.summary) || void 0 === n ? void 0 : n.demo) && void 0 !== p ? p : 0), d(null !== (h = null === (o = x.summary) || void 0 === o ? void 0 : o.on_promo) && void 0 !== h ? h : 0), y(new Date)
            } else g("string" == typeof(null == x ? void 0 : x.error) ? x.error : "Ошибка (".concat(e.status, ")")), a || (t([]), l(0), i(0), d(0))
        } catch (e) {
            g(e instanceof Error ? e.message : "load_failed")
        } finally {
            x(!1), u(!1)
        }
    }, []), _ = (0, s.useCallback)(async (e, a) => {
        if (a && !0 !== e.allow_public_display) {
            g("Нет согласия на публикацию — отзыв нельзя показать на промо.");
            return
        }
        N(e.id), g(null), t(t => t.map(t => t.id === e.id ? {
            ...t,
            show_on_promo: a
        } : t)), d(e => e + (a ? 1 : -1));
        try {
            let r = await fetch("/api/reviews", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id: e.id,
                        show_on_promo: a
                    })
                }),
                s = await r.json();
            r.ok || (t(t => t.map(t => t.id === e.id ? {
                ...t,
                show_on_promo: e.show_on_promo
            } : t)), d(e => e + (a ? -1 : 1)), g("string" == typeof(null == s ? void 0 : s.error) ? s.error : "Ошибка (".concat(r.status, ")")))
        } catch (r) {
            t(t => t.map(t => t.id === e.id ? {
                ...t,
                show_on_promo: e.show_on_promo
            } : t)), d(e => e + (a ? -1 : 1)), g(r instanceof Error ? r.message : "save_failed")
        } finally {
            N(null)
        }
    }, []);
    return (0, s.useEffect)(() => {
        f()
    }, [f]), (0, s.useEffect)(() => {
        let e = window.setInterval(() => {
            "visible" === document.visibilityState && f({
                silent: !0
            })
        }, 3e4);
        return () => window.clearInterval(e)
    }, [f]), (0, r.jsxs)("div", {
        className: "space-y-6",
        children: [(0, r.jsxs)("div", {
            className: "flex items-center justify-between gap-3 flex-wrap",
            children: [(0, r.jsxs)("div", {
                children: [(0, r.jsx)("h2", {
                    className: "text-lg font-semibold",
                    children: "Отзывы"
                }), (0, r.jsx)("p", {
                    className: "text-sm text-gray-500 mt-1 max-w-3xl",
                    children: "Сообщения из приложения: Настройки → \xabОставить отзыв\xbb. Колонка \xabПублично\xbb — согласие пользователя на показ отзыва (сайт, промо, открытые источники). Без согласия отзыв виден здесь, но галочку \xabНа промо\xbb поставить нельзя."
                })]
            }), (0, r.jsxs)("div", {
                className: "flex flex-col items-end gap-1",
                children: [(0, r.jsx)("button", {
                    type: "button",
                    onClick: () => void f(),
                    disabled: c || m,
                    className: "text-sm px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50",
                    children: c || m ? "Обновление…" : "Обновить"
                }), h ? (0, r.jsxs)("span", {
                    className: "text-xs text-gray-500",
                    children: ["Обновлено: ", h.toLocaleTimeString("ru-RU")]
                }) : null]
            })]
        }), p && (0, r.jsx)("p", {
            className: "text-red-400 text-sm whitespace-pre-wrap",
            children: p
        }), (0, r.jsxs)("div", {
            className: "grid grid-cols-2 sm:grid-cols-3 gap-3",
            children: [(0, r.jsxs)("div", {
                className: "rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3",
                children: [(0, r.jsx)("div", {
                    className: "text-xs text-gray-500",
                    children: "Всего"
                }), (0, r.jsx)("div", {
                    className: "text-xl font-semibold",
                    children: c && !e.length ? "—" : a
                })]
            }), (0, r.jsxs)("div", {
                className: "rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3",
                children: [(0, r.jsx)("div", {
                    className: "text-xs text-gray-500",
                    children: "Из демо"
                }), (0, r.jsx)("div", {
                    className: "text-xl font-semibold",
                    children: c && !e.length ? "—" : n
                })]
            }), (0, r.jsxs)("div", {
                className: "rounded-lg border border-gray-800 bg-gray-900/40 px-4 py-3",
                children: [(0, r.jsx)("div", {
                    className: "text-xs text-gray-500",
                    children: "На промо"
                }), (0, r.jsx)("div", {
                    className: "text-xl font-semibold",
                    children: c && !e.length ? "—" : o
                })]
            })]
        }), c && !e.length ? (0, r.jsx)("p", {
            className: "text-gray-500 text-sm",
            children: "Загрузка…"
        }) : 0 === e.length ? (0, r.jsx)("p", {
            className: "text-gray-500 text-sm",
            children: "Пока нет отзывов."
        }) : (0, r.jsx)("div", {
            className: "overflow-x-auto border border-gray-800 rounded-lg",
            children: (0, r.jsxs)("table", {
                className: "w-full text-sm",
                children: [(0, r.jsx)("thead", {
                    className: "bg-gray-900 text-gray-400 text-left",
                    children: (0, r.jsxs)("tr", {
                        children: [(0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "На промо"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Публично"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Дата"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Имя"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Страна"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Почта"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Источник"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Отзыв"
                        })]
                    })
                }), (0, r.jsx)("tbody", {
                    children: e.map(e => {
                        var t;
                        let a = b === e.id,
                            s = e.body.length > 160 && !a ? "".concat(e.body.slice(0, 160), "…") : e.body;
                        return (0, r.jsxs)("tr", {
                            className: "border-t border-gray-800 align-top",
                            children: [(0, r.jsx)("td", {
                                className: "px-3 py-2",
                                children: (0, r.jsx)("input", {
                                    type: "checkbox",
                                    checked: !0 === e.show_on_promo,
                                    disabled: j === e.id || !0 !== e.allow_public_display && !0 !== e.show_on_promo,
                                    onChange: t => void _(e, t.target.checked),
                                    title: !0 === e.allow_public_display ? "Показать на промостранице" : "Нет согласия на публикацию",
                                    "aria-label": "Показать на промостранице"
                                })
                            }), (0, r.jsx)("td", {
                                className: "px-3 py-2 whitespace-nowrap",
                                children: !0 === e.allow_public_display ? (0, r.jsx)("span", {
                                    className: "text-emerald-400",
                                    children: "Да"
                                }) : (0, r.jsx)("span", {
                                    className: "text-gray-500",
                                    children: "Нет"
                                })
                            }), (0, r.jsxs)("td", {
                                className: "px-3 py-2 text-gray-400 whitespace-nowrap",
                                children: [(t = e.created_at) ? new Date(t).toLocaleString("ru-RU") : "—", (0, r.jsxs)("div", {
                                    className: "text-[10px] text-gray-500 mt-0.5",
                                    children: [function(e) {
                                        switch ((null != e ? e : "").trim().toLowerCase()) {
                                            case "web":
                                                return "Веб";
                                            case "ios":
                                                return "iOS";
                                            case "android":
                                                return "Android";
                                            default:
                                                return (null == e ? void 0 : e.trim()) || "—"
                                        }
                                    }(e.platform), e.locale ? " \xb7 ".concat(e.locale) : ""]
                                })]
                            }), (0, r.jsx)("td", {
                                className: "px-3 py-2 text-gray-100 whitespace-nowrap",
                                children: e.name
                            }), (0, r.jsx)("td", {
                                className: "px-3 py-2 text-gray-300 whitespace-nowrap",
                                children: function(e) {
                                    var t, a;
                                    let r = (null !== (t = e.country_code) && void 0 !== t ? t : "").trim().toUpperCase(),
                                        s = (null !== (a = e.location_label) && void 0 !== a ? a : "").trim();
                                    return r && s ? "".concat(r, " \xb7 ").concat(s) : r || s || "—"
                                }(e)
                            }), (0, r.jsx)("td", {
                                className: "px-3 py-2 text-gray-300",
                                children: e.email
                            }), (0, r.jsx)("td", {
                                className: "px-3 py-2 whitespace-nowrap",
                                children: e.is_demo ? (0, r.jsx)("span", {
                                    className: "text-amber-400",
                                    children: "Демо"
                                }) : (0, r.jsx)("span", {
                                    className: "text-emerald-400",
                                    children: "Аккаунт"
                                })
                            }), (0, r.jsxs)("td", {
                                className: "px-3 py-2 text-gray-200 max-w-[36rem]",
                                children: [(0, r.jsx)("p", {
                                    className: "whitespace-pre-wrap break-words",
                                    children: s
                                }), e.body.length > 160 ? (0, r.jsx)("button", {
                                    type: "button",
                                    onClick: () => v(a ? null : e.id),
                                    className: "text-[11px] text-indigo-400 hover:text-indigo-300 mt-1",
                                    children: a ? "Свернуть" : "Показать полностью"
                                }) : null]
                            })]
                        }, e.id)
                    })
                })]
            })
        })]
    })
}
let Z = {
        daily_limit: 0,
        weekly_limit: 0,
        period_limit: 0,
        period_start: null,
        period_end: null,
        currency: "VND",
        landing: "demo",
        primary_language: "ru",
        geo_notes: "Outside Russia. Prefer markets where Lemon Squeezy / iOS billing works.",
        pause_if_no_result_days: 3,
        warn_daily_pct: 80,
        status: "idle",
        meta_ad_account_id: "665520004065928",
        meta_page_id: "",
        notes: "",
        updated_at: null
    },
    $ = {
        brand: "Красный RD Restodocks, как на facebook.com/Restodocks и на /promo.",
        ttk: "Экран списка ТТК / import-review: кривой Excel → чистые карточки (как demo_promo screenshot TTK).",
        cost: "Карточка блюда с себестоимостью (promo money / ttk cost).",
        prep: "Чеклист заготовок, не WhatsApp-чат.",
        lang: "Переключатель языка интерфейса + ТТК на языке повара.",
        inv: "Входящие / слияние бланков инвентаризации.",
        honest: "В тексте честно: демо по email, 1 день; не обещать \xabбез регистрации\xbb и \xab100 карт\xbb."
    },
    Y = ("".concat($.brand, " ").concat($.ttk, " ").concat($.honest), "".concat($.brand, " ").concat($.cost, " ").concat($.honest), "".concat($.brand, " ").concat($.prep, " ").concat($.honest), "".concat($.brand, " ").concat($.lang, " ").concat($.honest), "".concat($.brand, " ").concat($.inv, " ").concat($.honest), "".concat($.brand, " ").concat($.ttk, " ").concat($.honest), "".concat($.brand, " ").concat($.cost, " ").concat($.honest), "".concat($.brand, " ").concat($.prep, " ").concat($.honest), "".concat($.brand, " ").concat($.lang, " ").concat($.honest), "".concat($.brand, " ").concat($.inv, " ").concat($.honest), "".concat($.brand, " ").concat($.ttk, " ").concat($.honest), "".concat($.brand, " ").concat($.cost, " ").concat($.honest), "".concat($.brand, " ").concat($.prep, " ").concat($.honest), "".concat($.brand, " ").concat($.lang, " ").concat($.honest), "".concat($.brand, " ").concat($.inv, " ").concat($.honest), "".concat($.brand, " ").concat($.ttk, " ").concat($.honest), "".concat($.brand, " ").concat($.cost, " ").concat($.honest), "".concat($.brand, " ").concat($.prep, " ").concat($.honest), "".concat($.brand, " ").concat($.lang, " ").concat($.honest), "".concat($.brand, " ").concat($.inv, " ").concat($.honest), "".concat($.brand, " ").concat($.ttk, " ").concat($.honest), "".concat($.brand, " ").concat($.cost, " ").concat($.honest), "".concat($.brand, " ").concat($.prep, " ").concat($.honest), "".concat($.brand, " ").concat($.lang, " ").concat($.honest), "".concat($.brand, " ").concat($.inv, " ").concat($.honest), {
        idle: "Простой — нет бюджета",
        configured: "Настроено — ждут ваше \xabвооружить\xbb",
        awaiting_approval: "Ждёт одобрения черновиков",
        armed: "Вооружён — готов к API / ручному запуску по плану",
        paused: "Пауза"
    });

function Q() {
    var e, t, a;
    let [l, n] = (0, s.useState)(Z), [i, o] = (0, s.useState)(null), [d, c] = (0, s.useState)(""), [x, m] = (0, s.useState)(!0), [u, p] = (0, s.useState)(!1), [g, h] = (0, s.useState)(null), [y, b] = (0, s.useState)(null), v = (0, s.useCallback)(e => {
        var t, a;
        n(e.settings), o(e.plan), c(null !== (a = null === (t = e.meta_api) || void 0 === t ? void 0 : t.reason) && void 0 !== a ? a : "")
    }, []), j = (0, s.useCallback)(async () => {
        m(!0), h(null);
        let e = await fetch("/api/ads-agent"),
            t = await e.json();
        e.ok ? v(t) : (h("string" == typeof(null == t ? void 0 : t.error) ? t.error : "Ошибка загрузки"), n(Z), o(null)), m(!1)
    }, [v]);
    async function N(e, t) {
        p(!0), h(null), b(null);
        let a = await fetch("/api/ads-agent", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action: e,
                    settings: l,
                    draft_approvals: null == t ? void 0 : t.map(e => ({
                        id: e.id,
                        approved: e.approved
                    }))
                })
            }),
            r = await a.json();
        a.ok ? (v(r), b("arm" === e ? "План обновлён. Отметьте черновики и нажмите \xabОдобрить план\xbb." : "regenerate_offers" === e ? "Новые офферы по углам индустрии — только Ок/Нет." : "approve_plan" === e ? "Агент вооружён. Автосписание в Meta пока выключено — крутите по плану вручную или дождитесь токена." : "Сохранено.")) : h("string" == typeof(null == r ? void 0 : r.error) ? r.error : "Ошибка сохранения"), p(!1)
    }

    function f(e, t) {
        n(a => ({
            ...a,
            [e]: t
        }))
    }

    function _(e, t) {
        o(a => a ? {
            ...a,
            drafts: a.drafts.map(a => a.id === e ? {
                ...a,
                approved: t
            } : a)
        } : a)
    }
    return ((0, s.useEffect)(() => {
        j()
    }, [j]), x) ? (0, r.jsx)("p", {
        className: "text-gray-400 text-sm",
        children: "Загрузка Ads Agent…"
    }) : (0, r.jsxs)("div", {
        className: "space-y-8 max-w-3xl",
        children: [(0, r.jsxs)("div", {
            children: [(0, r.jsx)("h2", {
                className: "text-xl font-semibold text-white",
                children: "Ads Agent"
            }), (0, r.jsx)("p", {
                className: "text-sm text-gray-400 mt-1",
                children: "Свой бот Restodocks — не ИИ Meta/Google. Вы задаёте потолки бюджета и цели; агент держит план, тексты и правила \xabне слить\xbb. Автозапуск в кабинете — после Meta API."
            }), (0, r.jsxs)("p", {
                className: "text-sm mt-3 text-amber-200/90 bg-amber-950/40 border border-amber-800/50 rounded-lg px-3 py-2",
                children: ["Статус: ", (0, r.jsx)("span", {
                    className: "font-medium text-white",
                    children: Y[l.status]
                })]
            }), d ? (0, r.jsx)("p", {
                className: "text-xs text-gray-500 mt-2",
                children: d
            }) : null]
        }), g ? (0, r.jsx)("p", {
            className: "text-sm text-red-400 border border-red-900/50 rounded-lg px-3 py-2",
            children: g
        }) : null, y ? (0, r.jsx)("p", {
            className: "text-sm text-emerald-400 border border-emerald-900/40 rounded-lg px-3 py-2",
            children: y
        }) : null, (0, r.jsxs)("section", {
            className: "space-y-4 border border-gray-800 rounded-xl p-4",
            children: [(0, r.jsx)("h3", {
                className: "font-medium text-white",
                children: "Бюджет (вы задаёте вручную)"
            }), (0, r.jsx)("p", {
                className: "text-xs text-gray-500",
                children: "Агент не выбирает сумму за вас. Без лимита — не тратит. Оценки кликов — ориентир, не гарантия регистраций."
            }), (0, r.jsxs)("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                children: [(0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Валюта"
                    }), (0, r.jsxs)("select", {
                        className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2",
                        value: l.currency,
                        onChange: e => f("currency", e.target.value),
                        children: [(0, r.jsx)("option", {
                            value: "VND",
                            children: "₫ VND"
                        }), (0, r.jsx)("option", {
                            value: "USD",
                            children: "$ USD"
                        }), (0, r.jsx)("option", {
                            value: "EUR",
                            children: "€ EUR"
                        })]
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Лимит на день"
                    }), (0, r.jsx)("input", {
                        type: "number",
                        min: 0,
                        className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2",
                        value: l.daily_limit || "",
                        onChange: e => f("daily_limit", Number(e.target.value) || 0),
                        placeholder: "0 = выкл"
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Лимит на неделю"
                    }), (0, r.jsx)("input", {
                        type: "number",
                        min: 0,
                        className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2",
                        value: l.weekly_limit || "",
                        onChange: e => f("weekly_limit", Number(e.target.value) || 0),
                        placeholder: "0 = выкл"
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Лимит на период"
                    }), (0, r.jsx)("input", {
                        type: "number",
                        min: 0,
                        className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2",
                        value: l.period_limit || "",
                        onChange: e => f("period_limit", Number(e.target.value) || 0),
                        placeholder: "0 = выкл"
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Период с"
                    }), (0, r.jsx)("input", {
                        type: "date",
                        className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2",
                        value: null !== (t = l.period_start) && void 0 !== t ? t : "",
                        onChange: e => f("period_start", e.target.value || null)
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Период по"
                    }), (0, r.jsx)("input", {
                        type: "date",
                        className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2",
                        value: null !== (a = l.period_end) && void 0 !== a ? a : "",
                        onChange: e => f("period_end", e.target.value || null)
                    })]
                })]
            }), (null == i ? void 0 : null === (e = i.estimates) || void 0 === e ? void 0 : e.length) ? (0, r.jsx)("ul", {
                className: "text-sm text-gray-300 space-y-1 list-disc pl-5",
                children: i.estimates.map(e => (0, r.jsx)("li", {
                    children: e
                }, e))
            }) : null]
        }), (0, r.jsxs)("section", {
            className: "space-y-4 border border-gray-800 rounded-xl p-4",
            children: [(0, r.jsx)("h3", {
                className: "font-medium text-white",
                children: "Цель и гео"
            }), (0, r.jsxs)("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                children: [(0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Куда ведём"
                    }), (0, r.jsxs)("select", {
                        className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2",
                        value: l.landing,
                        onChange: e => f("landing", e.target.value),
                        children: [(0, r.jsx)("option", {
                            value: "demo",
                            children: "/demo — демо по email"
                        }), (0, r.jsx)("option", {
                            value: "register_owner",
                            children: "/register-owner — регистрация"
                        }), (0, r.jsx)("option", {
                            value: "promo",
                            children: "/promo — витрина"
                        })]
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Язык объявлений"
                    }), (0, r.jsxs)("select", {
                        className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2",
                        value: l.primary_language,
                        onChange: e => f("primary_language", e.target.value),
                        children: [(0, r.jsx)("option", {
                            value: "ru",
                            children: "Русский (не РФ)"
                        }), (0, r.jsx)("option", {
                            value: "en",
                            children: "English"
                        }), (0, r.jsx)("option", {
                            value: "tr",
                            children: "T\xfcrk\xe7e"
                        }), (0, r.jsx)("option", {
                            value: "vi",
                            children: "Tiếng Việt"
                        }), (0, r.jsx)("option", {
                            value: "es",
                            children: "Espa\xf1ol"
                        })]
                    })]
                })]
            }), (0, r.jsxs)("label", {
                className: "block text-sm",
                children: [(0, r.jsx)("span", {
                    className: "text-gray-400",
                    children: "Гео / заметки"
                }), (0, r.jsx)("textarea", {
                    className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 min-h-[72px]",
                    value: l.geo_notes,
                    onChange: e => f("geo_notes", e.target.value)
                })]
            }), (0, r.jsxs)("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                children: [(0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Meta ad account ID"
                    }), (0, r.jsx)("input", {
                        className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 font-mono text-xs",
                        value: l.meta_ad_account_id,
                        onChange: e => f("meta_ad_account_id", e.target.value)
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Page ID (когда будет)"
                    }), (0, r.jsx)("input", {
                        className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 font-mono text-xs",
                        value: l.meta_page_id,
                        onChange: e => f("meta_page_id", e.target.value),
                        placeholder: "опционально"
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Пауза без результата (дней)"
                    }), (0, r.jsx)("input", {
                        type: "number",
                        min: 1,
                        max: 30,
                        className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2",
                        value: l.pause_if_no_result_days,
                        onChange: e => f("pause_if_no_result_days", Number(e.target.value) || 3)
                    })]
                }), (0, r.jsxs)("label", {
                    className: "block text-sm",
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: "Предупреждение % дня"
                    }), (0, r.jsx)("input", {
                        type: "number",
                        min: 50,
                        max: 100,
                        className: "mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2",
                        value: l.warn_daily_pct,
                        onChange: e => f("warn_daily_pct", Number(e.target.value) || 80)
                    })]
                })]
            })]
        }), (0, r.jsxs)("div", {
            className: "flex flex-wrap gap-2",
            children: [(0, r.jsx)("button", {
                type: "button",
                disabled: u,
                onClick: () => void N("save"),
                className: "px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm disabled:opacity-50",
                children: "Сохранить лимиты"
            }), (0, r.jsx)("button", {
                type: "button",
                disabled: u,
                onClick: () => void N("arm"),
                className: "px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium disabled:opacity-50",
                children: "Собрать / обновить план"
            }), (0, r.jsx)("button", {
                type: "button",
                disabled: u,
                onClick: () => void N("regenerate_offers"),
                className: "px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-sm font-medium disabled:opacity-50",
                children: "Новые офферы (агент)"
            }), (0, r.jsx)("button", {
                type: "button",
                disabled: u || "armed" !== l.status,
                onClick: () => void N("pause"),
                className: "px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm disabled:opacity-50",
                children: "Пауза"
            }), (0, r.jsx)("button", {
                type: "button",
                disabled: u || "paused" !== l.status,
                onClick: () => void N("resume"),
                className: "px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm disabled:opacity-50",
                children: "Снять паузу"
            })]
        }), i ? (0, r.jsxs)("section", {
            className: "space-y-4 border border-gray-800 rounded-xl p-4",
            children: [(0, r.jsx)("h3", {
                className: "font-medium text-white",
                children: "План агента"
            }), i.offer_process ? (0, r.jsx)("p", {
                className: "text-sm text-violet-200/90 bg-violet-950/30 border border-violet-800/40 rounded-lg px-3 py-2",
                children: i.offer_process
            }) : null, (0, r.jsxs)("p", {
                className: "text-sm text-gray-300",
                children: [(0, r.jsx)("span", {
                    className: "text-gray-500",
                    children: "Цель:"
                }), " ", i.objective]
            }), (0, r.jsxs)("p", {
                className: "text-sm text-gray-300",
                children: [(0, r.jsx)("span", {
                    className: "text-gray-500",
                    children: "URL:"
                }), " ", (0, r.jsx)("a", {
                    className: "text-indigo-400 break-all",
                    href: i.landing_url,
                    target: "_blank",
                    rel: "noreferrer",
                    children: i.landing_url
                })]
            }), (0, r.jsx)("p", {
                className: "text-sm text-gray-300",
                children: i.audience_notes
            }), (0, r.jsx)("p", {
                className: "text-sm text-amber-200/80",
                children: i.budget_summary
            }), (0, r.jsxs)("div", {
                children: [(0, r.jsx)("p", {
                    className: "text-xs text-gray-500 mb-1",
                    children: "Правила анти-слива"
                }), (0, r.jsx)("ul", {
                    className: "text-sm text-gray-300 space-y-1 list-disc pl-5",
                    children: i.safety_rules.map(e => (0, r.jsx)("li", {
                        children: e
                    }, e))
                })]
            }), (0, r.jsxs)("div", {
                className: "space-y-3 pt-2",
                children: [(0, r.jsx)("p", {
                    className: "text-sm font-medium text-white",
                    children: "Офферы от агента (вы только проверяете)"
                }), i.drafts.map(e => (0, r.jsxs)("div", {
                    className: "rounded-lg border border-gray-700 bg-gray-900/50 p-3 space-y-2",
                    children: [(0, r.jsxs)("div", {
                        className: "flex flex-wrap gap-2 text-xs",
                        children: [(0, r.jsx)("span", {
                            className: "uppercase text-gray-500",
                            children: e.language
                        }), e.angle_label ? (0, r.jsx)("span", {
                            className: "text-violet-300",
                            children: e.angle_label
                        }) : null]
                    }), e.trend_note ? (0, r.jsx)("p", {
                        className: "text-xs text-gray-500",
                        children: e.trend_note
                    }) : null, (0, r.jsx)("p", {
                        className: "font-medium text-white",
                        children: e.headline
                    }), (0, r.jsx)("p", {
                        className: "text-sm text-gray-300 whitespace-pre-wrap",
                        children: e.primary_text
                    }), (0, r.jsxs)("p", {
                        className: "text-xs text-indigo-300",
                        children: ["CTA: ", e.cta]
                    }), e.creative_brief ? (0, r.jsxs)("p", {
                        className: "text-xs text-gray-400 border-t border-gray-800 pt-2",
                        children: [(0, r.jsx)("span", {
                            className: "text-gray-500",
                            children: "Креатив под сайт: "
                        }), e.creative_brief]
                    }) : null, (0, r.jsxs)("div", {
                        className: "flex gap-2 pt-1",
                        children: [(0, r.jsx)("button", {
                            type: "button",
                            className: "text-xs px-2 py-1 rounded ".concat(!0 === e.approved ? "bg-emerald-700 text-white" : "bg-gray-800 text-gray-300"),
                            onClick: () => _(e.id, !0),
                            children: "Ок"
                        }), (0, r.jsx)("button", {
                            type: "button",
                            className: "text-xs px-2 py-1 rounded ".concat(!1 === e.approved ? "bg-red-800 text-white" : "bg-gray-800 text-gray-300"),
                            onClick: () => _(e.id, !1),
                            children: "Нет"
                        })]
                    })]
                }, e.id)), (0, r.jsx)("button", {
                    type: "button",
                    disabled: u,
                    onClick: () => void N("approve_plan", i.drafts),
                    className: "px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm font-medium disabled:opacity-50",
                    children: "Одобрить выбранные (вооружить агента)"
                })]
            })]
        }) : null]
    })
}

function X(e) {
    let t = new Date(e).getTime();
    return Number.isNaN(t) ? 0 : t
}

function ee(e, t) {
    return X(t.created_at) - X(e.created_at)
}

function et(e) {
    var t;
    return (null === (t = e.owner_id) || void 0 === t ? void 0 : t.trim()) || e.id
}

function ea(e) {
    var t, a, r, s, l, n, i;
    if (0 === e.length) return [];
    let o = new Map(e.map(e => [e.id, e])),
        d = new Map;
    for (let r of e) {
        let e = null === (t = r.parent_establishment_id) || void 0 === t ? void 0 : t.trim();
        if (!e) continue;
        let s = null !== (a = d.get(e)) && void 0 !== a ? a : [];
        s.push(r), d.set(e, s)
    }
    for (let [e, t] of d) t.sort(ee), d.set(e, t);
    let c = new Map;
    for (let t of e) {
        let e = et(t),
            a = null !== (r = c.get(e)) && void 0 !== r ? r : [];
        a.push(t), c.set(e, a)
    }
    let x = [...c.keys()].sort((e, t) => {
            let a = c.get(e),
                r = c.get(t),
                s = Math.max(...a.map(e => X(e.created_at)));
            return Math.max(...r.map(e => X(e.created_at))) - s
        }),
        m = [],
        u = new Set;
    for (let e of x) {
        let t = c.get(e),
            a = t.filter(e => {
                var t;
                return !(null === (t = e.parent_establishment_id) || void 0 === t ? void 0 : t.trim())
            });
        a.sort(ee);
        let r = !1;
        for (let e of a) u.has(e.id) || (u.add(e.id), m.push({
            ...e,
            isOwnerGroupStart: !r,
            indentLevel: 0,
            parent_establishment_name: null
        }), r = !0, function e(t, a) {
            var r, s, l;
            let n = null !== (s = d.get(t)) && void 0 !== s ? s : [],
                i = null !== (l = null === (r = o.get(t)) || void 0 === r ? void 0 : r.name) && void 0 !== l ? l : null;
            for (let t of n) u.has(t.id) || (u.add(t.id), m.push({
                ...t,
                indentLevel: a,
                parent_establishment_name: i
            }), e(t.id, a + 1))
        }(e.id, 1));
        for (let e of t) {
            if (u.has(e.id)) continue;
            let t = null === (s = e.parent_establishment_id) || void 0 === s ? void 0 : s.trim(),
                a = t && null !== (n = null === (l = o.get(t)) || void 0 === l ? void 0 : l.name) && void 0 !== n ? n : null;
            u.add(e.id), m.push({
                ...e,
                isOwnerGroupStart: !r,
                indentLevel: +!!t,
                parent_establishment_name: a
            }), r = !0
        }
    }
    for (let t of e) u.has(t.id) || m.push({
        ...t,
        isOwnerGroupStart: !0,
        indentLevel: 0
    });
    let p = new Map;
    for (let t of e) {
        let e = et(t);
        p.set(e, (null !== (i = p.get(e)) && void 0 !== i ? i : 0) + 1)
    }
    return m.map(e => {
        var t;
        return {
            ...e,
            ownerGroupSize: null !== (t = p.get(et(e))) && void 0 !== t ? t : 1
        }
    })
}
async function er(e) {
    let t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "restodocks-establishments",
        r = await import('xlsx'),
        s = ea(e).map(e => {
            var t, a, r, s, l, n, i, o, d, c;
            let x = e.subscription_summary,
                m = e.indentLevel ? "  ".repeat(e.indentLevel) : "";
            return {
                ID: e.id,
                Название: "".concat(m).concat(e.name),
                Тип: function(e) {
                    switch (e) {
                        case "branch":
                            return "Филиал";
                        case "separate":
                            return "Отдельное";
                        case "main":
                            return "Основное";
                        default:
                            return "—"
                    }
                }(e.establishment_type),
                "Родительское заведение": null !== (t = e.parent_establishment_name) && void 0 !== t ? t : "",
                Владелец: "—" === e.owner_name ? "" : e.owner_name,
                Email: "—" === e.owner_email ? "" : e.owner_email,
                "Email (ожидает confirm)": e.owner_pending_confirmation ? "да" : "",
                Людей: e.employee_count,
                "Статус подписки": null !== (a = null == x ? void 0 : x.statusLabel) && void 0 !== a ? a : "",
                Оплата: null !== (r = null == x ? void 0 : x.paymentLabel) && void 0 !== r ? r : "",
                Промокод: null !== (s = null == x ? void 0 : x.promoCode) && void 0 !== s ? s : "",
                "Уровень реферала": e.referral_level ?? "",
                "С подпиской": e.effective_pro ? "да" : "нет",
                "Детали подписки": null !== (l = null == x ? void 0 : x.detail) && void 0 !== l ? l : "",
                Регистрация: e.created_at ? new Date(e.created_at).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }) : "",
                Клиент: function(e) {
                    switch (null == e ? void 0 : e.trim().toLowerCase()) {
                        case "ios_app":
                            return "iOS (приложение)";
                        case "android_app":
                            return "Android (приложение)";
                        case "web_mobile":
                            return "Сайт, телефон";
                        case "web_desktop":
                            return "Сайт, ПК";
                        case "native_other":
                            return "Нативно (другое)";
                        default:
                            return ""
                    }
                }(e.registration_client),
                "IP регистрации": null !== (n = e.registration_ip) && void 0 !== n ? n : "",
                Город: null !== (i = e.registration_city) && void 0 !== i ? i : "",
                Страна: null !== (o = e.registration_country) && void 0 !== o ? o : "",
                Адрес: null !== (d = e.address) && void 0 !== d ? d : "",
                Валюта: null !== (c = e.default_currency) && void 0 !== c ? c : ""
            }
        }),
        l = r.utils.json_to_sheet(s),
        n = r.utils.book_new();
    r.utils.book_append_sheet(n, l, "Заведения");
    let i = new Date().toISOString().slice(0, 10);
    r.writeFile(n, "".concat(t, "-").concat(i, ".xlsx"))
}

function es(e) {
    return e ? new Date(e).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }) : "—"
}

function el(e) {
    let {
        id: t
    } = e, [a, l] = (0, s.useState)(!1), n = t.length > 8 ? "".concat(t.slice(0, 8), "…") : t;
    async function i() {
        try {
            await navigator.clipboard.writeText(t)
        } catch (a) {
            let e = document.createElement("textarea");
            e.value = t, e.setAttribute("readonly", ""), e.style.position = "fixed", e.style.left = "-9999px", document.body.appendChild(e), e.select(), document.execCommand("copy"), document.body.removeChild(e)
        }
        l(!0), window.setTimeout(() => l(!1), 1500)
    }
    return (0, r.jsxs)("span", {
        className: "inline-flex items-center gap-1.5 max-w-full flex-wrap",
        children: [(0, r.jsx)("code", {
            className: "font-mono text-[10px] text-gray-300",
            title: t,
            children: n
        }), (0, r.jsx)("button", {
            type: "button",
            onClick: e => {
                e.stopPropagation(), i()
            },
            className: "shrink-0 px-1.5 py-0.5 rounded border border-gray-700 bg-gray-950 text-[10px] text-indigo-300 hover:text-white hover:border-indigo-500",
            title: t,
            children: a ? "Скопировано" : "Копировать"
        })]
    })
}

function en(e) {
    let t = e.owner_email;
    return t && "—" !== t ? e.owner_pending_confirmation ? (0, r.jsxs)("span", {
        className: "text-amber-200/90",
        title: "Email из pending_owner_registrations — ждёт подтверждения, сотрудник owner ещё не в employees",
        children: [t, (0, r.jsx)("span", {
            className: "text-amber-500/80 ml-1 whitespace-nowrap",
            children: "(confirm)"
        })]
    }) : t : "—"
}

function ei(e) {
    let t = e.owner_name;
    return t && "—" !== t ? e.owner_pending_confirmation ? (0, r.jsx)("span", {
        title: "ФИО из pending_owner_registrations до complete_pending_owner_registration",
        children: t
    }) : t : "—"
}

function eo(e) {
    let t = Number(null != e ? e : 0);
    return Number.isFinite(t) ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    }).format(t) : "$0.00"
}

function ed(e) {
    let t = new Date;
    t.setDate(t.getDate() + e);
    let a = t.getFullYear(),
        r = String(t.getMonth() + 1).padStart(2, "0"),
        s = String(t.getDate()).padStart(2, "0");
    return "".concat(a, "-").concat(r, "-").concat(s)
}

function ec(e) {
    return e ? new Date(e).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }) : "—"
}

function ex(e) {
    return !!e && new Date(e) < new Date
}

function em(e) {
    var t, a, r;
    return e.is_disabled ? "disabled" : (0, e.is_used) ? "used" : (null !== (t = e.redemption_count) && void 0 !== t ? t : 0) > 0 ? "partial" : (a = e.starts_at, r = e.expires_at, a && new Date(a) > new Date || r && new Date(r) < new Date) ? "expired" : "free"
}
let eu = "rd_admin_support_active";

function ep({
    user
}) {
    let e = (0, l.useRouter)(),
        [t, a] = (0, s.useState)(() => firstAllowedTab(user)),
        [n, i] = (0, s.useState)(!1);
    async function o() {
        await fetch("/api/auth", {
            method: "DELETE"
        }), e.push("/login")
    }
    return (0, s.useEffect)(() => {
        try {
            "1" === sessionStorage.getItem(eu) && i(!0)
        } catch (e) {}
    }, []), (0, r.jsxs)("div", {
        className: "min-h-screen bg-gray-950 text-white",
        children: [(0, r.jsxs)("header", {
            className: "px-4 py-3 flex items-center justify-between sticky top-0 z-10 border-b transition-colors ".concat(n ? "border-purple-500/70 bg-purple-950/95 shadow-[0_0_24px_rgba(147,51,234,0.25)]" : "border-amber-900/40 bg-gray-950"),
            children: [(0, r.jsxs)("div", {
                className: "flex items-center gap-2",
                children: [(0, r.jsx)("span", {
                    className: "font-bold text-base",
                    children: "Restodocks"
                }), (0, r.jsx)("span", {
                    className: "text-gray-500 text-sm hidden sm:inline",
                    children: "/ Admin"
                }), n ? (0, r.jsx)("span", {
                    className: "text-xs font-medium text-purple-200/95 hidden sm:inline",
                    children: "— сеанс техподдержки открыт"
                }) : null]
            }), (0, r.jsxs)("div", {
                className: "flex items-center gap-3",
                children: [(0, r.jsx)(LanguageSwitcher, {}), user?.email ? (0, r.jsx)("span", {
                    className: "text-sm text-gray-500 hidden sm:inline",
                    children: user.email
                }) : null, (0, r.jsx)("button", {
                    onClick: o,
                    className: "text-sm text-gray-500 hover:text-white transition",
                    children: "Выйти"
                })]
            })]
        }), (0, r.jsx)("nav", {
            className: "border-b border-gray-800 overflow-x-auto overscroll-x-contain touch-pan-x",
            "aria-label": "Вкладки админки",
            children: (0, r.jsx)("div", {
                className: "flex gap-1 px-4 w-max min-w-full flex-nowrap",
                children: [{
                    key: "reviews",
                    label: "Отзывы"
                }, {
                    key: "ads_agent",
                    label: "Ads Agent"
                }, {
                    key: "establishments",
                    label: "Заведения"
                }, {
                    key: "promo",
                    label: "Промокоды"
                }, {
                    key: "popups",
                    label: "Попапы"
                }, {
                    key: "ai_usage",
                    label: "AI Usage"
                }, {
                    key: "demo_sandboxes",
                    label: "Демо"
                }, {
                    key: "marketing_visits",
                    label: "Витрина"
                }, {
                    key: "broadcast",
                    label: "Рассылка"
                }, {
                    key: "support",
                    label: "Техподдержка"
                }, {
                    key: "security",
                    label: "Безопасность"
                }, {
                    key: "health",
                    label: "Нагрузка"
                }, ...(user?.isOwner ? [{
                    key: "staff",
                    label: "Админы"
                }] : [])].filter(item => item.key === "staff" || canAccessPage(user, item.key)).map(e => (0, r.jsx)("button", {
                    onClick: () => a(e.key),
                    className: "shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ".concat(t === e.key ? "border-indigo-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"),
                    children: e.label
                }, e.key))
            })
        }), (0, r.jsxs)("main", {
            className: "max-w-[min(1600px,calc(100vw-1.5rem))] mx-auto px-3 py-4 sm:px-6 sm:py-8",
                children: ["establishments" === t && canAccessPage(user, "establishments") && (0, r.jsxs)(s.Fragment, {
                children: [(0, r.jsx)(PartnerScopeBanner, {
                    user: user
                }), (0, r.jsx)(ey, {
                    user: user
                })]
            }), "ads_agent" === t && canAccessPage(user, "ads_agent") && (0, r.jsx)(Q, {}), "promo" === t && canAccessPage(user, "promo") && (0, r.jsx)(ej, {}), "popups" === t && canAccessPage(user, "popups") && (0, r.jsx)(V, {}), "ai_usage" === t && canAccessPage(user, "ai_usage") && (0, r.jsx)(e_, {}), "demo_sandboxes" === t && canAccessPage(user, "demo_sandboxes") && (0, r.jsx)(eS, {}), "marketing_visits" === t && canAccessPage(user, "marketing_visits") && (0, r.jsx)(eL, {}), "reviews" === t && canAccessPage(user, "reviews") && (0, r.jsx)(B, {}), "broadcast" === t && canAccessPage(user, "broadcast") && (0, r.jsx)(eT, {}), "support" === t && canAccessPage(user, "support") && (0, r.jsx)(eg, {
                onSupportShellActiveChange: e => {
                    i(e);
                    try {
                        e ? sessionStorage.setItem(eu, "1") : sessionStorage.removeItem(eu)
                    } catch (e) {}
                }
            }), "security" === t && canAccessPage(user, "security") && (0, r.jsx)(eN, {}), "health" === t && canAccessPage(user, "health") && (0, r.jsx)(ef, {}), "staff" === t && user?.isOwner && (0, r.jsx)(StaffTab, {})]
        })]
    })
}

function eg(e) {
    let {
        onSupportShellActiveChange: t
    } = e, [a, l] = (0, s.useState)(""), [n, i] = (0, s.useState)(""), [o, d] = (0, s.useState)("https://restodocks-beta.pages.dev"), [c, x] = (0, s.useState)(null), [m, u] = (0, s.useState)(null), [p, g] = (0, s.useState)([]), [h, y] = (0, s.useState)(null), [b, v] = (0, s.useState)(!1);
    async function j(e) {
        let t = await fetch("/api/support?establishment_id=".concat(encodeURIComponent(e))),
            a = await t.json();
        if (!t.ok) {
            y("string" == typeof(null == a ? void 0 : a.error) ? a.error : "Ошибка журнала");
            return
        }
        g(Array.isArray(a) ? a : [])
    }
    async function N() {
        v(!0), y(null);
        try {
            var e, r;
            let s = await fetch("/api/support", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        support_operator_login: a.trim() || "admin",
                        account_login: n.trim().toLowerCase(),
                        app_origin: o.trim()
                    })
                }),
                l = await s.json().catch(() => ({}));
            if (!s.ok) {
                y("string" == typeof(null == l ? void 0 : l.error) ? l.error : "Ошибка (".concat(s.status, ")"));
                return
            }
            let i = null == l ? void 0 : l.establishment;
            if (x(null !== (e = null == i ? void 0 : i.id) && void 0 !== e ? e : null), u(null !== (r = null == i ? void 0 : i.name) && void 0 !== r ? r : null), null == i ? void 0 : i.id) {
                try {
                    sessionStorage.setItem("rd_admin_support_meta", JSON.stringify({
                        id: i.id,
                        name: i.name
                    }))
                } catch (e) {}
                await j(i.id)
            }
            null == t || t(!0), "string" == typeof(null == l ? void 0 : l.warning) && l.warning.length > 0 && alert(l.warning), "string" == typeof(null == l ? void 0 : l.action_link) && l.action_link.length > 0 && window.open(l.action_link, "_blank", "noopener,noreferrer"), alert("Сеанс техподдержки открыт: верхняя панель админки подсвечена фиолетовым — так видно, что вы в режиме входа в аккаунт пользователя. Ссылка для входа открыта в новой вкладке.")
        } finally {
            v(!1)
        }
    }
    async function f() {
        if (c) {
            v(!0), y(null);
            try {
                let e = await fetch("/api/support", {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            establishment_id: c
                        })
                    }),
                    a = await e.json().catch(() => ({}));
                if (!e.ok) {
                    y("string" == typeof(null == a ? void 0 : a.error) ? a.error : "Ошибка (".concat(e.status, ")"));
                    return
                }
                try {
                    sessionStorage.removeItem("rd_admin_support_meta")
                } catch (e) {}
                null == t || t(!1), await j(c), alert("Сеанс техподдержки завершён.")
            } finally {
                v(!1)
            }
        }
    }
    return (0, s.useEffect)(() => {
        try {
            if ("1" !== sessionStorage.getItem(eu)) return;
            let t = sessionStorage.getItem("rd_admin_support_meta");
            if (!t) return;
            let a = JSON.parse(t);
            if (null == a ? void 0 : a.id) {
                var e;
                x(a.id), u(null !== (e = a.name) && void 0 !== e ? e : null), j(a.id)
            }
        } catch (e) {}
    }, []), (0, r.jsxs)("div", {
        className: "space-y-4 max-w-3xl",
        children: [h && (0, r.jsx)("div", {
            className: "p-3 rounded-lg border border-red-800 bg-red-950/40 text-red-200 text-sm",
            children: h
        }), (0, r.jsxs)("div", {
            className: "bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3",
            children: [(0, r.jsx)("h2", {
                className: "text-sm font-semibold text-white",
                children: "Доступ техподдержки"
            }), (0, r.jsx)("p", {
                className: "text-xs text-gray-500",
                children: "Введите логин учётной записи (email). PIN вводит владелец на своей стороне вместе с тумблером доступа."
            }), (0, r.jsxs)("div", {
                className: "grid sm:grid-cols-2 gap-2",
                children: [(0, r.jsx)("input", {
                    value: a,
                    onChange: e => l(e.target.value),
                    placeholder: "Логин оператора",
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                }), (0, r.jsx)("input", {
                    value: n,
                    onChange: e => i(e.target.value),
                    placeholder: "Логин учётной записи (email)",
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                })]
            }), (0, r.jsx)("input", {
                value: o,
                onChange: e => d(e.target.value),
                placeholder: "Origin веб-приложения, куда входить (например https://restodocks-beta.pages.dev)",
                className: "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs"
            }), (0, r.jsxs)("div", {
                className: "flex gap-2",
                children: [(0, r.jsx)("button", {
                    onClick: N,
                    disabled: b || !n.trim(),
                    className: "bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm",
                    children: "Открыть доступ"
                }), (0, r.jsx)("button", {
                    onClick: f,
                    disabled: b || !c,
                    className: "bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm",
                    children: "Закрыть доступ"
                })]
            })]
        }), c && (0, r.jsxs)("div", {
            className: "bg-gray-900 rounded-xl border border-gray-800 p-4",
            children: [(0, r.jsxs)("div", {
                className: "text-sm text-gray-300 mb-2",
                children: ["Активное заведение: ", (0, r.jsx)("span", {
                    className: "text-white",
                    children: null != m ? m : c
                })]
            }), (0, r.jsxs)("div", {
                className: "space-y-1 text-xs text-gray-400",
                children: [p.map(e => {
                    var t, a;
                    return (0, r.jsxs)("div", {
                        className: "flex flex-wrap gap-2 border-b border-gray-800 pb-1",
                        children: [(0, r.jsx)("span", {
                            children: e.event_type
                        }), (0, r.jsxs)("span", {
                            children: ["Оператор: ", null !== (t = e.support_operator_login) && void 0 !== t ? t : "—"]
                        }), (0, r.jsxs)("span", {
                            children: ["Логин: ", null !== (a = e.account_login) && void 0 !== a ? a : "—"]
                        }), (0, r.jsx)("span", {
                            children: ec(e.created_at)
                        })]
                    }, e.id)
                }), 0 === p.length && (0, r.jsx)("div", {
                    className: "text-gray-600",
                    children: "Записей пока нет"
                })]
            })]
        })]
    })
}
let eh = "УДАЛИТЬ";

function ey() {
    let {
        user
    } = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
    let canMutate = !!(null == user ? void 0 : user.isOwner);
    function e(e) {
        switch (e.establishment_type) {
            case "branch":
                return "Филиал";
            case "separate":
                return "Отдельное";
            default:
                return "Основное"
        }
    }

    function t(e) {
        let t = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border";
        switch (e.establishment_type) {
            case "branch":
                return "".concat(t, " bg-amber-950/70 text-amber-100 border-amber-600/45");
            case "separate":
                return "".concat(t, " bg-violet-950/70 text-violet-100 border-violet-600/45");
            default:
                return "".concat(t, " bg-emerald-950/70 text-emerald-100 border-emerald-600/45")
        }
    }

    function a(e) {
        var t;
        let {
            row: a
        } = e, s = a.subscription_summary;
        if (!s) return (0, r.jsx)("span", {
            className: "text-gray-600 text-xs",
            children: "—"
        });
        let l = "App Store (In-App Purchase)" === s.paymentLabel ? "Подписка через App Store (In-App Purchase). Дата окончания в БД обычно уже учитывает отсрочку оплаты (grace period), если она пришла в чеке из App Store Connect." : void 0;
        return (0, r.jsxs)("div", {
            className: "space-y-0.5 max-w-full min-w-0",
            children: [(0, r.jsx)("div", {
                className: "text-xs font-medium ".concat("Без подписки" === (t = s.statusLabel) || "Без Pro" === t ? "text-gray-500" : t.startsWith("Пробный") ? "text-sky-300" : t.includes("истёк") ? "text-red-300/90" : t.includes("промокод") && !t.includes("истёк") ? "text-amber-200" : t.includes("(оплата)") || t.includes("оплачен") ? "text-emerald-300" : t.includes("Без") ? "text-gray-200" : "text-emerald-200"),
                children: s.statusLabel
            }), (0, r.jsxs)("div", {
                className: "text-[11px] text-gray-500",
                title: l,
                children: [s.paymentLabel, s.promoCode ? (0, r.jsx)("span", {
                    className: "block font-mono text-amber-200/90 mt-0.5",
                    children: s.promoCode
                }) : null]
            }), s.detail ? (0, r.jsx)("div", {
                className: "text-[10px] text-gray-600 leading-snug",
                children: s.detail
            }) : null]
        })
    }
    let [l, n] = (0, s.useState)([]), [i, o] = (0, s.useState)(!0), [d, c] = (0, s.useState)(""), [x, m] = (0, s.useState)("all"), [u, b] = (0, s.useState)("all"), [v, j] = (0, s.useState)("all"), [N, f] = (0, s.useState)("all"), [_, w] = (0, s.useState)(null), [k, C] = (0, s.useState)(null), [S, L] = (0, s.useState)(!1), [T, P] = (0, s.useState)(!1), E = (0, s.useCallback)(async () => {
        o(!0), w(null);
        let e = await fetch("/api/establishments"),
            t = await e.json();
        e.ok ? n(Array.isArray(t) ? t : []) : (w("string" == typeof(null == t ? void 0 : t.error) ? t.error : "Ошибка загрузки"), n([])), o(!1)
    }, []);
    (0, s.useEffect)(() => {
        E()
    }, [E]);
    let I = (0, s.useMemo)(() => {
            let e = new Map;
            for (let t of p) e.set(t.value, "all" === t.value ? l.length : l.filter(e => h(e.subscription_filter_key, t.value)).length);
            return e
        }, [l]),
        A = (0, s.useMemo)(() => {
            let e = new Map;
            for (let t of g) e.set(t.value, "all" === t.value ? l.length : l.filter(e => y(e.subscription_filter_key, t.value)).length);
            return e
        }, [l]),
        D = l.filter(e => {
            var t, a, r, s, l, n;
            let i = d.toLowerCase(),
                o = e.subscription_summary,
                c = o ? [o.statusLabel, o.paymentLabel, o.promoCode, o.detail].filter(Boolean).join(" ").toLowerCase() : "";
            return !!((e.id.toLowerCase().includes(i) || e.name.toLowerCase().includes(i) || e.owner_email.toLowerCase().includes(i) || e.owner_name.toLowerCase().includes(i) || (null !== (t = e.registration_ip) && void 0 !== t ? t : "").toLowerCase().includes(i) || (null !== (a = e.registration_country) && void 0 !== a ? a : "").toLowerCase().includes(i) || (null !== (r = e.registration_city) && void 0 !== r ? r : "").toLowerCase().includes(i) || (null !== (s = e.registration_client) && void 0 !== s ? s : "").toLowerCase().includes(i) || H(e).toLowerCase().includes(i) || (null !== (l = e.created_at) && void 0 !== l ? l : "").toLowerCase().includes(i) || ec(e.created_at).toLowerCase().includes(i) || c.includes(i) || (e.referral_level ? "ур. ".concat(e.referral_level).includes(i) || String(e.referral_level) === i : false)) && ("all" === x || e.establishment_type === x) && h(e.subscription_filter_key, u) && y(e.subscription_filter_key, v)) && (n = e.employee_count, "all" === N || ("0" === N ? 0 === n : "1" === N ? 1 === n : "2-5" === N ? !!(n >= 2) && !!(n <= 5) : !!(n >= 6)))
        }),
        R = (0, s.useMemo)(() => new Set(D.map(e => e.id)), [D]),
        U = (0, s.useMemo)(() => ea(l).filter(e => R.has(e.id)), [l, R]);
    async function O() {
        if (0 !== l.length) {
            P(!0), w(null);
            try {
                await er(l)
            } catch (t) {
                let e = t instanceof Error ? t.message : "Ошибка выгрузки";
                w(e), alert("Не удалось выгрузить Excel.\n\n".concat(e))
            } finally {
                P(!1)
            }
        }
    }

    function F(e) {
        let t = [];
        return e.registration_city && t.push(e.registration_city), e.registration_country && e.registration_country !== e.registration_city && t.push(e.registration_country), t.length ? t.join(", ") : "—"
    }

    function M(e) {
        return (null == e ? void 0 : e.trim()) ? ec(e) : "—"
    }

    function q(e) {
        return (null == e ? void 0 : e.trim()) ? "Последний вход любого сотрудника заведения: ".concat(e) : "Нет входов в приложение / на сайт (last_login_at сотрудников)"
    }

    function H(e) {
        var t;
        switch (null === (t = e.registration_client) || void 0 === t ? void 0 : t.trim().toLowerCase()) {
            case "ios_app":
                return "iOS (приложение)";
            case "android_app":
                return "Android (приложение)";
            case "web_mobile":
                return "Сайт, телефон";
            case "web_desktop":
                return "Сайт, ПК";
            case "native_other":
                return "Нативно (другое)";
            default:
                return "—"
        }
    }
    let W = l.length,
        J = l.reduce((e, t) => e + t.employee_count, 0),
        z = l.filter(e => "paid_iap" === e.subscription_group).length,
        G = l.filter(e => {
            var t;
            return "promo" === e.subscription_group || (null !== (t = e.subscription_filter_key) && void 0 !== t ? t : "").startsWith("promo_addon|")
        }).length;
    async function K() {
        L(!0), w(null);
        try {
            var e, t, a, r, s, l;
            let n = await fetch("/api/establishments/refresh-geo", {
                    method: "POST"
                }),
                i = await n.json();
            if (!n.ok) throw Error((null == i ? void 0 : i.error) || "Ошибка");
            await E(), alert("IP подставлено из входа (владелец / сотрудники): ".concat(null !== (t = i.ip_backfilled) && void 0 !== t ? t : 0, "\n") + "Гео по IP обновлено: ".concat(null !== (r = null !== (a = i.geo_updated) && void 0 !== a ? a : i.updated) && void 0 !== r ? r : 0, "\n") + "Без IP в БД (никто не входил): ".concat(null !== (s = i.skipped_no_login_ip) && void 0 !== s ? s : 0, "\n") + "Всего заведений: ".concat(null !== (l = i.total) && void 0 !== l ? l : 0) + ((null === (e = i.errors) || void 0 === e ? void 0 : e.length) ? "\nОшибки: ".concat(i.errors.length) : ""))
        } catch (e) {
            w(e instanceof Error ? e.message : "Ошибка обновления гео")
        } finally {
            L(!1)
        }
    }
    async function V(e) {
        if (!confirm("Удалить заведение \xab".concat(e.name, "\xbb?\n\nБудут удалены все данные: номенклатура, ТТК, чеклисты, сотрудники и т.д. Действие необратимо."))) return;
        let t = prompt('Для подтверждения введите "'.concat(eh, '":'));
        if ((null == t ? void 0 : t.trim()) !== eh) {
            null !== t && alert("Отменено: текст не совпадает.");
            return
        }
        C(e.id);
        try {
            let t = await fetch("/api/establishments/".concat(e.id), {
                    method: "DELETE"
                }),
                a = await t.json().catch(() => ({}));
            if (!t.ok) {
                let e = [null == a ? void 0 : a.error, (null == a ? void 0 : a.code) ? "(".concat(a.code, ")") : ""].filter(Boolean);
                throw Error(e.join(" ") || "Ошибка удаления")
            }
            await E(), alert("Заведение \xab".concat(e.name, "\xbb удалено из базы (строка establishments)."))
        } catch (a) {
            let t = a instanceof Error ? a.message : "Ошибка удаления";
            w(t), alert("Не удалось удалить заведение \xab".concat(e.name, "\xbb.\n\n").concat(t, "\n\nЕсли здесь про миграцию или функцию admin_delete_establishment — выполните её в Supabase (см. репозиторий, папка supabase/migrations).")), await E()
        } finally {
            C(null)
        }
    }
    return (0, r.jsxs)(r.Fragment, {
        children: [_ && (0, r.jsxs)("div", {
            className: "mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm",
            children: [_, (0, r.jsxs)("span", {
                className: "block mt-2 text-gray-500 text-xs",
                children: ["Нет колонки или схема старая — открой Supabase → SQL Editor и выполни миграции:", " ", (0, r.jsx)("code", {
                    className: "text-gray-400",
                    children: "supabase/migrations/20260502120000_pro_paid_until_and_status_rpc.sql"
                }), " ", "(колонка ", (0, r.jsx)("code", {
                    className: "text-gray-500",
                    children: "pro_paid_until"
                }), "). Ошибка входа/401 — проверь Secrets в Cloudflare (", (0, r.jsx)("code", {
                    className: "text-gray-500",
                    children: "SUPABASE_URL"
                }), ",", " ", (0, r.jsx)("code", {
                    className: "text-gray-500",
                    children: "SERVICE_ROLE_KEY"
                }), ") и перелогинься в админке."]
            })]
        }), (0, r.jsxs)("div", {
            className: "grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 sm:gap-3 sm:mb-8",
            children: [(0, r.jsx)(eP, {
                label: "Заведений",
                value: W
            }), (0, r.jsx)(eP, {
                label: "Людей (влад.+сотр.)",
                value: J
            }), (0, r.jsx)(eP, {
                label: "С платной подпиской",
                value: z
            }), (0, r.jsx)(eP, {
                label: "С промокодом",
                value: G
            })]
        }), (0, r.jsxs)("div", {
            className: "mb-4 p-4 bg-gray-900/80 border border-gray-800 rounded-xl text-gray-400 text-sm leading-relaxed",
            children: [(0, r.jsx)("p", {
                className: "font-medium text-gray-300 mb-1",
                children: "Регистрация и пробный Pro"
            }), (0, r.jsxs)("p", {
                children: ["Колонка \xabРегистрация\xbb — дата и время создания ", (0, r.jsx)("span", {
                    className: "text-gray-500",
                    children: "записи заведения"
                }), " в базе (", (0, r.jsx)("code", {
                    className: "text-gray-500 text-xs",
                    children: "establishments.created_at"
                }), "). Для входа", " ", (0, r.jsx)("span", {
                    className: "text-gray-300",
                    children: "без промокода"
                }), " в продукте действует", " ", (0, r.jsx)("span", {
                    className: "text-gray-300",
                    children: "72 часа полного Pro"
                }), " с этого момента (в БД — поле", " ", (0, r.jsx)("code", {
                    className: "text-gray-500 text-xs",
                    children: "pro_trial_ends_at"
                }), "). С промокодом триал обычно не заполняется — тариф даёт промо."]
            }), (0, r.jsxs)("p", {
                className: "mt-2 text-xs text-gray-600",
                children: ["Если у старых аккаунтов без промо пропала дата окончания триала, выполни в Supabase миграцию", " ", (0, r.jsx)("code", {
                    className: "text-gray-500",
                    children: "20260621120000_backfill_pro_trial_ends_at_no_promo_main.sql"
                }), "."]
            }), (0, r.jsxs)("p", {
                className: "mt-2 text-xs text-gray-500",
                children: [(0, r.jsx)("span", {
                    className: "text-gray-400",
                    children: "Владелец / Email:"
                }), " из ", (0, r.jsx)("code", {
                    className: "text-gray-500",
                    children: "employees"
                }), " (роль owner или ", (0, r.jsx)("code", {
                    className: "text-gray-500",
                    children: "establishments.owner_id"
                }), "). До confirm — из", " ", (0, r.jsx)("code", {
                    className: "text-gray-500",
                    children: "pending_owner_registrations"
                }), " (", (0, r.jsx)("span", {
                    className: "text-amber-400/90",
                    children: "confirm"
                }), "). Под названием заведения — ", (0, r.jsx)("span", {
                    className: "text-gray-300",
                    children: "ID"
                }), " (полный UUID, клик копирует). Колонка \xabЛюди\xbb — уникальные ", (0, r.jsx)("span", {
                    className: "text-gray-300",
                    children: "активные"
                }), " сотрудники этого заведения (собственник + шеф в одной строке = 1; неактивные не считаются)."]
            }), (0, r.jsxs)("p", {
                className: "mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-800 pt-3",
                children: [(0, r.jsx)("span", {
                    className: "text-gray-400",
                    children: "Заведения и филиалы"
                }), " создаются только в приложении (регистрация, экран \xabМои заведения\xbb / добавление филиала). В этой админке нет кнопки \xabсоздать заведение\xbb — здесь только список из БД, удаление и гео. Если строка \xabвидна в админке, но не в приложении\xbb, это всё равно записи в Supabase; после успешного удаления появится подтверждение; при ошибке — текст в алерте и в красном блоке выше."]
            })]
        }), (0, r.jsxs)("div", {
            className: "flex flex-wrap gap-2 mb-3 md:hidden",
            children: [(0, r.jsxs)("select", {
                value: x,
                onChange: e => m(e.target.value),
                className: "bg-gray-900 border border-gray-800 rounded-lg px-2 py-2 text-white text-xs flex-1 min-w-[6rem]",
                children: [(0, r.jsx)("option", {
                    value: "all",
                    children: "Тип: все"
                }), (0, r.jsx)("option", {
                    value: "main",
                    children: "Основное"
                }), (0, r.jsx)("option", {
                    value: "branch",
                    children: "Филиал"
                }), (0, r.jsx)("option", {
                    value: "separate",
                    children: "Отдельное"
                })]
            }), (0, r.jsx)("select", {
                value: u,
                onChange: e => b(e.target.value),
                className: "bg-gray-900 border border-gray-800 rounded-lg px-2 py-2 text-white text-xs flex-1 min-w-[8rem]",
                children: p.map(e => {
                    var t;
                    return (0, r.jsxs)("option", {
                        value: e.value,
                        children: [e.label, " (", null !== (t = I.get(e.value)) && void 0 !== t ? t : 0, ")"]
                    }, e.value)
                })
            }), (0, r.jsx)("select", {
                value: v,
                onChange: e => j(e.target.value),
                className: "bg-gray-900 border border-gray-800 rounded-lg px-2 py-2 text-white text-xs flex-1 min-w-[7rem]",
                children: g.map(e => {
                    var t;
                    return (0, r.jsxs)("option", {
                        value: e.value,
                        children: ["Допы: ", e.label, " (", null !== (t = A.get(e.value)) && void 0 !== t ? t : 0, ")"]
                    }, e.value)
                })
            }), (0, r.jsxs)("select", {
                value: N,
                onChange: e => f(e.target.value),
                className: "bg-gray-900 border border-gray-800 rounded-lg px-2 py-2 text-white text-xs flex-1 min-w-[6rem]",
                children: [(0, r.jsx)("option", {
                    value: "all",
                    children: "Сотр.: все"
                }), (0, r.jsx)("option", {
                    value: "0",
                    children: "0"
                }), (0, r.jsx)("option", {
                    value: "1",
                    children: "1"
                }), (0, r.jsx)("option", {
                    value: "2-5",
                    children: "2–5"
                }), (0, r.jsx)("option", {
                    value: "6+",
                    children: "6+"
                })]
            })]
        }), (0, r.jsxs)("div", {
            className: "mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-emerald-800/50 bg-emerald-950/25",
            children: [(0, r.jsxs)("div", {
                className: "min-w-0",
                children: [(0, r.jsx)("p", {
                    className: "text-sm font-medium text-emerald-100",
                    children: "Выгрузка в Excel"
                }), (0, r.jsxs)("p", {
                    className: "text-xs text-gray-500 mt-0.5",
                    children: ["Все ", l.length, " заведений из базы (фильтры поиска не применяются). Формат .xlsx."]
                })]
            }), (0, r.jsx)("button", {
                type: "button",
                onClick: O,
                disabled: T || i || 0 === l.length,
                className: "shrink-0 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed",
                children: T ? "Формируем файл…" : "Скачать Excel (.xlsx)"
            })]
        }), (0, r.jsxs)("div", {
            className: "flex gap-2 mb-4 flex-wrap",
            children: [(0, r.jsx)("input", {
                type: "text",
                value: d,
                onChange: e => c(e.target.value),
                placeholder: "Поиск (название, email, ID)...",
                className: "bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 flex-1 min-w-0 text-sm"
            }), canMutate ? (0, r.jsx)("button", {
                onClick: K,
                disabled: S,
                className: "text-gray-500 hover:text-white transition px-3 py-2 rounded-lg border border-gray-800 text-sm shrink-0 disabled:opacity-50",
                title: "Догнать registration_ip из last_login (владелец по owner_id, любой сотрудник) и город/страну по IP",
                children: S ? "…" : "\uD83C\uDF10 IP и гео регистрации"
            }) : null, (0, r.jsx)("button", {
                onClick: E,
                className: "text-gray-500 hover:text-white transition px-3 py-2 rounded-lg border border-gray-800 text-sm shrink-0",
                children: "↻"
            })]
        }), (0, r.jsx)("p", {
            className: "text-[11px] text-gray-500 mb-3 -mt-2",
            children: "Список отсортирован по связям: один владелец — блоком, филиалы сразу под головным заведением (↳ и строка \xabголовное: …\xbb)."
        }), i ? (0, r.jsx)("div", {
            className: "p-12 text-center text-gray-500",
            children: "Загрузка..."
        }) : 0 === D.length ? (0, r.jsx)("div", {
            className: "p-12 text-center text-gray-500",
            children: "Заведений нет"
        }) : (0, r.jsxs)(r.Fragment, {
            children: [(0, r.jsx)("div", {
                className: "hidden md:block bg-gray-900 rounded-xl border border-gray-800 overflow-hidden",
                children: (0, r.jsxs)("table", {
                    className: "w-full table-fixed text-xs",
                    children: [(0, r.jsx)("thead", {
                        children: (0, r.jsxs)("tr", {
                            className: "border-b border-gray-800 text-gray-500 text-[10px] uppercase tracking-wide",
                            children: [(0, r.jsx)("th", {
                                className: "px-2 py-2 text-left w-[14%]",
                                children: "Заведение / ID"
                            }), (0, r.jsxs)("th", {
                                className: "px-2 py-2 text-left w-[7%] align-top",
                                children: [(0, r.jsx)("div", {
                                    className: "mb-1",
                                    children: "Тип"
                                }), (0, r.jsxs)("select", {
                                    value: x,
                                    onChange: e => m(e.target.value),
                                    title: "Фильтр по типу заведения",
                                    className: "w-full bg-gray-950 border border-gray-700 rounded-md px-1 py-0.5 text-[10px] text-gray-200 font-normal normal-case tracking-normal",
                                    children: [(0, r.jsx)("option", {
                                        value: "all",
                                        children: "Все"
                                    }), (0, r.jsx)("option", {
                                        value: "main",
                                        children: "Основное"
                                    }), (0, r.jsx)("option", {
                                        value: "branch",
                                        children: "Филиал"
                                    }), (0, r.jsx)("option", {
                                        value: "separate",
                                        children: "Отдельное"
                                    })]
                                })]
                            }), (0, r.jsxs)("th", {
                                className: "px-2 py-2 text-left w-[14%] align-top",
                                title: "Тариф; допы — второй список",
                                children: [(0, r.jsx)("div", {
                                    className: "mb-1",
                                    children: "Подписка"
                                }), (0, r.jsx)("select", {
                                    value: u,
                                    onChange: e => b(e.target.value),
                                    className: "w-full bg-gray-950 border border-gray-700 rounded-md px-1 py-0.5 text-[10px] text-gray-200 font-normal normal-case tracking-normal mb-1",
                                    children: p.map(e => {
                                        var t;
                                        return (0, r.jsxs)("option", {
                                            value: e.value,
                                            children: [e.label, " (", null !== (t = I.get(e.value)) && void 0 !== t ? t : 0, ")"]
                                        }, e.value)
                                    })
                                }), (0, r.jsx)("select", {
                                    value: v,
                                    onChange: e => j(e.target.value),
                                    className: "w-full bg-gray-950 border border-gray-700 rounded-md px-1 py-0.5 text-[10px] text-gray-200 font-normal normal-case tracking-normal",
                                    children: g.map(e => {
                                        var t;
                                        return (0, r.jsxs)("option", {
                                            value: e.value,
                                            children: [e.label, " (", null !== (t = A.get(e.value)) && void 0 !== t ? t : 0, ")"]
                                        }, e.value)
                                    })
                                })]
                            }), (0, r.jsx)("th", {
                                className: "px-2 py-2 text-left w-[9%]",
                                children: "Владелец"
                            }), (0, r.jsx)("th", {
                                className: "px-2 py-2 text-left w-[11%]",
                                children: "Email"
                            }), (0, r.jsxs)("th", {
                                className: "px-2 py-2 text-center w-[4%] align-top",
                                children: [(0, r.jsx)("div", {
                                    className: "mb-1",
                                    children: "Люди"
                                }), (0, r.jsxs)("select", {
                                    value: N,
                                    onChange: e => f(e.target.value),
                                    className: "w-full bg-gray-950 border border-gray-700 rounded-md px-0.5 py-0.5 text-[10px] text-gray-200 font-normal normal-case tracking-normal",
                                    children: [(0, r.jsx)("option", {
                                        value: "all",
                                        children: "Все"
                                    }), (0, r.jsx)("option", {
                                        value: "0",
                                        children: "0"
                                    }), (0, r.jsx)("option", {
                                        value: "1",
                                        children: "1"
                                    }), (0, r.jsx)("option", {
                                        value: "2-5",
                                        children: "2–5"
                                    }), (0, r.jsx)("option", {
                                        value: "6+",
                                        children: "6+"
                                    })]
                                })]
                            }), (0, r.jsx)("th", {
                                className: "px-2 py-2 text-left w-[9%]",
                                children: "Регистрация"
                            }), (0, r.jsx)("th", {
                                className: "px-2 py-2 text-left w-[7%]",
                                title: "max(last_login_at) сотрудников",
                                children: "Последний вход"
                            }), (0, r.jsx)("th", {
                                className: "px-2 py-2 text-left w-[6%]",
                                children: "Клиент"
                            }), (0, r.jsx)("th", {
                                className: "px-2 py-2 text-left w-[8%]",
                                children: "IP рег."
                            }), (0, r.jsx)("th", {
                                className: "px-1 py-2 text-right w-[3%] sticky right-0 z-20 bg-gray-900 border-l border-gray-800",
                                children: (0, r.jsx)("span", {
                                    className: "sr-only",
                                    children: "Действия"
                                })
                            })]
                        })
                    }), (0, r.jsx)("tbody", {
                        children: U.map((l, n) => {
                            var i, o, d, c, x, m;
                            return (0, r.jsxs)(s.Fragment, {
                                children: [l.isOwnerGroupStart && (null !== (o = l.ownerGroupSize) && void 0 !== o ? o : 0) > 1 ? (0, r.jsx)("tr", {
                                    className: "bg-indigo-950/35 border-b border-indigo-900/40",
                                    children: (0, r.jsxs)("td", {
                                        colSpan: 11,
                                        className: "px-3 py-2 text-xs text-indigo-200/90",
                                        children: [(0, r.jsx)("span", {
                                            className: "font-medium",
                                            children: "Связанные заведения"
                                        }), (0, r.jsx)("span", {
                                            className: "text-gray-500 mx-2",
                                            children: "\xb7"
                                        }), "—" !== l.owner_name ? l.owner_name : "владелец", l.owner_email && "—" !== l.owner_email ? (0, r.jsx)("span", {
                                            className: "text-indigo-300/80 ml-1",
                                            children: l.owner_email
                                        }) : null, (0, r.jsxs)("span", {
                                            className: "text-gray-500 ml-2",
                                            children: ["(", l.ownerGroupSize, " шт.)"]
                                        })]
                                    })
                                }) : null, (0, r.jsxs)("tr", {
                                    className: "group border-b border-gray-800/50 hover:bg-gray-800 transition ".concat(n === U.length - 1 ? "border-0" : "", " ").concat(l.isOwnerGroupStart && n > 0 ? "border-t border-gray-700/80" : "", " ").concat((null !== (d = l.ownerGroupSize) && void 0 !== d ? d : 0) > 1 ? "bg-gray-900/40" : ""),
                                    children: [(0, r.jsxs)("td", {
                                        className: "px-2 py-2 font-medium text-white min-w-0",
                                        children: [(0, r.jsxs)("div", {
                                            className: "min-w-0 truncate",
                                            style: {
                                                paddingLeft: l.indentLevel ? "".concat(.75 * Math.min(l.indentLevel, 3), "rem") : void 0
                                            },
                                            title: l.name,
                                            children: [l.indentLevel ? (0, r.jsx)("span", {
                                                className: "text-gray-500 font-normal mr-1",
                                                "aria-hidden": !0,
                                                children: "↳"
                                            }) : null, l.name]
                                        }), (0, r.jsx)("div", {
                                            className: "mt-1",
                                            style: {
                                                paddingLeft: l.indentLevel ? "".concat(.75 * Math.min(l.indentLevel, 3), "rem") : void 0
                                            },
                                            children: (0, r.jsx)(el, {
                                                id: l.id
                                            })
                                            }), l.parent_establishment_name ? (0, r.jsxs)("div", {
                                            className: "text-[10px] text-gray-500 font-normal mt-0.5 truncate",
                                            title: null !== (c = l.parent_establishment_id) && void 0 !== c ? c : "",
                                            children: ["головное: ", l.parent_establishment_name]
                                        }) : null, (0, r.jsx)(ReferralLevelBadge, {
                                            level: l.referral_level
                                        })]
                                    }), (0, r.jsx)("td", {
                                        className: "px-2 py-2 text-[10px] min-w-0",
                                        children: (0, r.jsx)("span", {
                                            className: "".concat(t(l), " whitespace-nowrap"),
                                            children: e(l)
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-2 py-2 align-top text-gray-300 min-w-0",
                                        children: (0, r.jsx)(a, {
                                            row: l
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-2 py-2 text-gray-300 truncate min-w-0",
                                        title: l.owner_name,
                                        children: ei(l)
                                    }), (0, r.jsx)("td", {
                                        className: "px-2 py-2 text-gray-400 text-[10px] min-w-0",
                                        children: (0, r.jsx)("div", {
                                            className: "truncate",
                                            title: l.owner_email,
                                            children: en(l)
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-2 py-2 text-center",
                                        children: (0, r.jsx)("span", {
                                            className: "bg-gray-800 px-1.5 py-0.5 rounded text-[10px] font-mono",
                                            title: "Активные сотрудники этого заведения (1 человек с несколькими ролями = 1)",
                                            children: l.employee_count
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-2 py-2 text-gray-500 text-[10px] leading-snug",
                                        title: l.created_at,
                                        children: ec(l.created_at)
                                    }), (0, r.jsx)("td", {
                                        className: "px-2 py-2 text-gray-400 text-[10px] leading-snug",
                                        title: q(l.last_activity_at),
                                        children: M(l.last_activity_at)
                                    }), (0, r.jsx)("td", {
                                        className: "px-2 py-2 text-gray-300 text-[10px] leading-snug",
                                        title: null !== (x = l.registration_client) && void 0 !== x ? x : "",
                                        children: H(l)
                                    }), (0, r.jsxs)("td", {
                                        className: "px-2 py-2 text-gray-400 text-[10px] font-mono leading-snug min-w-0",
                                        children: [(0, r.jsx)("div", {
                                            className: "truncate",
                                            title: null !== (m = l.registration_ip) && void 0 !== m ? m : void 0,
                                            children: (null === (i = l.registration_ip) || void 0 === i ? void 0 : i.trim()) || "—"
                                        }), (0, r.jsx)("div", {
                                            className: "text-gray-500 font-sans truncate mt-0.5",
                                            title: F(l),
                                            children: F(l)
                                        })]
                                    }), canMutate ? (0, r.jsx)("td", {
                                        className: "px-1 py-2 text-right sticky right-0 z-10 bg-gray-900 group-hover:bg-gray-800 border-l border-gray-800",
                                        children: (0, r.jsx)("button", {
                                            type: "button",
                                            onClick: () => V(l),
                                            disabled: k === l.id,
                                            className: "text-red-400 hover:text-red-300 text-xs disabled:opacity-50 px-0.5",
                                            title: "Удалить заведение",
                                            children: k === l.id ? "…" : "\uD83D\uDDD1"
                                        })
                                    }) : (0, r.jsx)("td", {
                                        className: "px-1 py-2 sticky right-0 z-10 bg-gray-900 border-l border-gray-800"
                                    })]
                                }, l.id)]
                            }, l.id)
                        })
                    })]
                })
            }), (0, r.jsx)("div", {
                className: "md:hidden space-y-2",
                children: U.map(l => {
                    var n, i;
                    return (0, r.jsxs)(s.Fragment, {
                        children: [l.isOwnerGroupStart && (null !== (n = l.ownerGroupSize) && void 0 !== n ? n : 0) > 1 ? (0, r.jsxs)("div", {
                            className: "px-3 py-2 rounded-lg bg-indigo-950/40 border border-indigo-900/50 text-xs text-indigo-200/90",
                            children: ["Связанные заведения \xb7 ", "—" !== l.owner_email ? l.owner_email : l.owner_name, " (", l.ownerGroupSize, " шт.)"]
                        }) : null, (0, r.jsxs)("div", {
                            className: "bg-gray-900 rounded-xl border border-gray-800 p-4 ".concat(l.isOwnerGroupStart ? "mt-3 first:mt-0 ring-1 ring-gray-700/40" : "", " ").concat((null !== (i = l.ownerGroupSize) && void 0 !== i ? i : 0) > 1 ? "border-indigo-900/30" : ""),
                            children: [(0, r.jsxs)("div", {
                                className: "flex items-start justify-between gap-2 mb-2",
                                children: [(0, r.jsxs)("span", {
                                    className: "font-medium text-white text-sm",
                                    style: {
                                        paddingLeft: l.indentLevel ? "".concat(.75 * Math.min(l.indentLevel, 3), "rem") : void 0
                                    },
                                    children: [l.indentLevel ? (0, r.jsx)("span", {
                                        className: "text-gray-500 font-normal mr-1",
                                        children: "↳"
                                    }) : null, l.name, (0, r.jsx)(ReferralLevelBadge, {
                                        level: l.referral_level
                                    })]
                                }), (0, r.jsxs)("span", {
                                    className: "flex items-center gap-2 shrink-0",
                                    children: [(0, r.jsxs)("span", {
                                        className: "bg-gray-800 px-2 py-0.5 rounded text-xs font-mono text-gray-400",
                                        children: [l.employee_count, " чел."]
                                    }), canMutate ? (0, r.jsx)("button", {
                                        onClick: () => V(l),
                                        disabled: k === l.id,
                                        className: "text-red-400 hover:text-red-300 text-sm disabled:opacity-50",
                                        title: "Удалить заведение",
                                        children: k === l.id ? "..." : "\uD83D\uDDD1"
                                    }) : null]
                                })]
                            }), (0, r.jsx)("div", {
                                className: "mb-1",
                                children: (0, r.jsx)(el, {
                                    id: l.id
                                })
                            }), (0, r.jsx)("div", {
                                className: "text-gray-400 text-xs",
                                children: ei(l)
                            }), l.parent_establishment_name ? (0, r.jsxs)("div", {
                                className: "text-[11px] text-gray-500 mb-1",
                                children: ["головное: ", l.parent_establishment_name]
                            }) : null, (0, r.jsx)("div", {
                                className: "mt-1",
                                children: (0, r.jsx)("span", {
                                    className: t(l),
                                    children: e(l)
                                })
                            }), (0, r.jsx)("div", {
                                className: "mt-2",
                                children: (0, r.jsx)(a, {
                                    row: l
                                })
                            }), (0, r.jsx)("div", {
                                className: "text-gray-500 text-xs",
                                children: en(l)
                            }), (0, r.jsxs)("div", {
                                className: "text-gray-600 text-xs mt-1",
                                title: l.created_at,
                                children: ["Регистрация: ", ec(l.created_at)]
                            }), (0, r.jsxs)("div", {
                                className: "text-gray-600 text-xs mt-1",
                                title: q(l.last_activity_at),
                                children: ["Последний вход: ", M(l.last_activity_at)]
                            }), (0, r.jsx)("div", {
                                className: "text-gray-400 text-xs mt-1",
                                children: H(l)
                            }), l.registration_ip && (0, r.jsxs)("div", {
                                className: "text-gray-500 text-xs mt-1 font-mono",
                                children: [(0, r.jsx)("div", {
                                    children: l.registration_ip
                                }), (0, r.jsx)("div", {
                                    className: "font-sans text-gray-600",
                                    children: F(l)
                                })]
                            })]
                        })]
                    }, l.id)
                })
            })]
        })]
    })
}

function eb(e) {
    var t;
    let {
        row: a,
        saving: s,
        onPick: l,
        selectableTiers: n,
        className: i
    } = e, c = (null !== (t = a.grants_subscription_type) && void 0 !== t ? t : "ultra").toLowerCase().trim(), x = ! function(e) {
        let t = o(e);
        return "pro" === t || "ultra" === t || "ultimate" === t
    }(c);
    return (0, r.jsxs)("select", {
        value: c,
        onChange: e => l(a, e.target.value),
        disabled: s,
        title: "Тариф при погашении кода (subscription_type в заведении на момент активации)",
        className: null != i ? i : "mt-0.5 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[10px] text-gray-200 max-w-[11rem]",
        children: [x && (0, r.jsxs)("option", {
            value: c,
            children: ["Текущий (legacy): ", d(c), " (", c, ")"]
        }), n.map(e => (0, r.jsxs)("option", {
            value: e,
            children: [d(e), " (", e, ")"]
        }, e))]
    })
}

function ev(e) {
    var t;
    let {
        row: a
    } = e, s = a.redemption_details;
    return s && s.length > 0 ? (0, r.jsxs)("div", {
        className: "space-y-1.5 max-w-[18rem]",
        children: [s.map((e, t) => {
            var a;
            return (0, r.jsxs)("div", {
                className: "leading-snug",
                children: [(0, r.jsxs)("div", {
                    className: "text-white text-[13px]",
                    children: [(null === (a = e.establishment_name) || void 0 === a ? void 0 : a.trim()) || "—", e.owner_email ? (0, r.jsxs)("span", {
                        className: "text-indigo-300/95",
                        children: [" \xb7 ", e.owner_email]
                    }) : null]
                }), e.owner_name && !e.owner_email ? (0, r.jsx)("div", {
                    className: "text-gray-500 text-[10px]",
                    children: e.owner_name
                }) : null, e.redeemed_at ? (0, r.jsx)("div", {
                    className: "text-gray-600 text-[10px]",
                    children: ec(e.redeemed_at)
                }) : null]
            }, "".concat(e.establishment_id, "-").concat(t))
        }), a.note ? (0, r.jsxs)("div", {
            className: "text-gray-600 text-[10px] pt-1 border-t border-gray-800/80 mt-1",
            children: ["Заметка: ", a.note]
        }) : null]
    }) : a.is_used && (null === (t = a.establishments) || void 0 === t ? void 0 : t.name) ? (0, r.jsx)("span", {
        className: "text-white",
        children: a.establishments.name
    }) : (0, r.jsx)("span", {
        className: "text-gray-500",
        children: a.note || "—"
    })
}

function ej() {
    var e;
    let t = [0, 5, 8, 12, 15],
        a = [0, 1, 3, 5, 10],
        l = (0, s.useMemo)(() => [...n], []),
        [i, o] = (0, s.useState)([]),
        [c, x] = (0, s.useState)(!0),
        [m, u] = (0, s.useState)(!1),
        [p, g] = (0, s.useState)(null),
        [h, y] = (0, s.useState)(""),
        [b, v] = (0, s.useState)(""),
        [j, N] = (0, s.useState)(""),
        [f, _] = (0, s.useState)(""),
        [w, k] = (0, s.useState)(""),
        [C, S] = (0, s.useState)("legacy"),
        [L, T] = (0, s.useState)("ultra"),
        [P, E] = (0, s.useState)(""),
        [I, A] = (0, s.useState)(""),
        [D, R] = (0, s.useState)("0"),
        [U, O] = (0, s.useState)("0"),
        [F, M] = (0, s.useState)(!1),
        [q, H] = (0, s.useState)(!1),
        [W, J] = (0, s.useState)("1"),
        [z, G] = (0, s.useState)(""),
        [K, V] = (0, s.useState)("all"),
        [B, Z] = (0, s.useState)(null),
        [$, Y] = (0, s.useState)(""),
        Q = (0, s.useCallback)(async () => {
            x(!0), g(null);
            let e = await fetch("/api/promo"),
                t = await e.json();
            e.ok ? o(Array.isArray(t) ? t : []) : (g("string" == typeof(null == t ? void 0 : t.error) ? t.error : "Ошибка загрузки"), o([])), x(!1)
        }, []);
    async function X() {
        if (!h.trim()) return;
        let e = D.trim() ? parseInt(D.trim(), 10) : 0,
            r = U.trim() ? parseInt(U.trim(), 10) : 0;
        if (Number.isNaN(e) || Number.isNaN(r) || !t.includes(e) || !a.includes(r)) {
            alert("Выберите пакет из списка для сотрудников и заведений.");
            return
        }
        if ("activation" === C) {
            let e = w.trim(),
                t = e ? parseInt(e, 10) : NaN;
            if (!e || Number.isNaN(t) || t < 1) {
                alert("Для нового типа укажи целое число дней Pro с активации (или переключись на \xabкак раньше\xbb).");
                return
            }
        }
        let s = W.trim() ? parseInt(W.trim(), 10) : NaN;
        if (Number.isNaN(s) || s < 1 || s > 1e5) {
            alert("\xabСколько учётных записей\xbb: целое число от 1 до 100000 (по умолчанию 1).");
            return
        }
        if ("" !== I.trim()) {
            let e = parseInt(I.trim(), 10);
            if (Number.isNaN(e) || e < 0 || e > 1e4) {
                alert("\xabМакс. фил.\xbb: целое от 0 до 10000 или оставь пустым.");
                return
            }
        }
        if (!f.trim()) {
            alert("Укажите дату окончания (\xabДействует до\xbb / \xabВвод кода до\xbb) — без неё промокод не создать.");
            return
        }
        u(!0), g(null);
        try {
            let t = await fetch("/api/promo", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        code: h.trim().toUpperCase(),
                        note: b.trim() || null,
                        starts_at: j || null,
                        expires_at: f || null,
                        max_employees: P ? parseInt(P) : null,
                        max_branches: "" !== I.trim() ? parseInt(I.trim(), 10) : null,
                        activation_duration_days: "activation" === C && w.trim() ? parseInt(w.trim(), 10) : null,
                        grants_subscription_type: L,
                        grants_employee_slot_packs: e,
                        grants_branch_slot_packs: r,
                        grants_additive_only: F,
                        grants_limits_renew_monthly: q,
                        max_redemptions: s
                    })
                }),
                a = await t.json().catch(() => ({}));
            if (!t.ok) {
                g("string" == typeof(null == a ? void 0 : a.error) ? a.error : "Не удалось создать промокод (".concat(t.status, ")"));
                return
            }
            y(""), v(""), N(""), _(""), k(""), S("legacy"), T("ultra"), E(""), A(""), R("0"), O("0"), M(!1), H(!1), J("1"), await Q()
        } finally {
            u(!1)
        }
    }
    async function ee(e) {
        confirm("Удалить промокод?") && (await fetch("/api/promo", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e
            })
        }), await Q())
    }
    async function et(e) {
        await fetch("/api/promo", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e.id,
                is_used: !e.is_used,
                used_at: e.is_used ? null : new Date().toISOString(),
                used_by_establishment_id: e.is_used ? null : e.used_by_establishment_id
            })
        }), await Q()
    }

    function ea(e) {
        Z(e), Y(function(e) {
            if (!e) return "";
            let t = new Date(e);
            if (Number.isNaN(t.getTime())) return "";
            let a = t.getFullYear(),
                r = String(t.getMonth() + 1).padStart(2, "0"),
                s = String(t.getDate()).padStart(2, "0");
            return "".concat(a, "-").concat(r, "-").concat(s)
        }(e.expires_at))
    }

    function er() {
        Z(null), Y("")
    }
    async function el(e) {
        if (!B) return;
        let t = B.id,
            a = void 0 !== e ? e : $.trim() || null;
        u(!0), g(null);
        try {
            let e = await fetch("/api/promo", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id: t,
                        expires_at: a
                    })
                }),
                r = await e.json().catch(() => ({}));
            if (!e.ok) {
                g("string" == typeof(null == r ? void 0 : r.error) ? r.error : "Не удалось сохранить дату (".concat(e.status, ")"));
                return
            }
            er(), await Q()
        } finally {
            u(!1)
        }
    }
    async function en(e, t) {
        var a;
        let r = (null !== (a = e.grants_subscription_type) && void 0 !== a ? a : "ultra").toLowerCase().trim(),
            s = t.trim().toLowerCase();
        if (r !== s) {
            u(!0), g(null);
            try {
                let t = await fetch("/api/promo", {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            id: e.id,
                            grants_subscription_type: s
                        })
                    }),
                    a = await t.json().catch(() => ({}));
                if (!t.ok) {
                    g("string" == typeof(null == a ? void 0 : a.error) ? a.error : "Не удалось сохранить тариф (".concat(t.status, ")"));
                    return
                }
                await Q()
            } finally {
                u(!1)
            }
        }
    }
    async function ei(e, t) {
        let a = prompt("Дней Pro с момента активации (1–36500). Пусто — вернуть промокод к классической логике (как раньше в базе), только дата \xabдействует до\xbb:", null != t ? String(t) : "");
        if (null === a) return;
        let r = a.trim(),
            s = "" === r ? null : parseInt(r, 10);
        if ("" !== r && (Number.isNaN(s) || s < 1 || s > 36500)) {
            alert("Введи целое от 1 до 36500 или оставь пустым");
            return
        }
        await fetch("/api/promo", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e,
                activation_duration_days: s
            })
        }), await Q()
    }
    async function eo(e, t) {
        let a = prompt("Сколько раз можно применить этот код (разные учётные записи). Уже погашенные не снимаются.", null != t ? String(t) : "1");
        if (null === a) return;
        let r = a.trim(),
            s = "" === r ? 1 : parseInt(r, 10);
        if (Number.isNaN(s) || s < 1 || s > 1e5) {
            alert("Введи целое от 1 до 100000");
            return
        }
        u(!0), g(null);
        try {
            let t = await fetch("/api/promo", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id: e,
                        max_redemptions: s
                    })
                }),
                a = await t.json().catch(() => ({}));
            if (!t.ok) {
                g("string" == typeof(null == a ? void 0 : a.error) ? a.error : "Не удалось сохранить лимит (".concat(t.status, ")"));
                return
            }
            await Q()
        } finally {
            u(!1)
        }
    }
    async function ed(e, t) {
        var a;
        let r = prompt("Макс. сотрудников (пусто — без ограничений):", null !== (a = null == t ? void 0 : t.toString()) && void 0 !== a ? a : "");
        if (null === r) return;
        let s = r.trim() ? parseInt(r.trim()) : null;
        if (r.trim() && (isNaN(s) || s < 1)) {
            alert("Введи целое число больше 0");
            return
        }
        await fetch("/api/promo", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e,
                max_employees: s
            })
        }), await Q()
    }
    async function eu(e, t) {
        var a;
        let r = prompt("Макс. доп. филиалов на владельца (пусто — только пакеты/IAP, без базы из промокода):", null !== (a = null == t ? void 0 : t.toString()) && void 0 !== a ? a : "");
        if (null === r) return;
        let s = r.trim() ? parseInt(r.trim(), 10) : null;
        if (r.trim() && (Number.isNaN(s) || s < 0 || s > 1e4)) {
            alert("Введи целое от 0 до 10000 или оставь пустым");
            return
        }
        await fetch("/api/promo", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e,
                max_branches: s
            })
        }), await Q()
    }
    async function ep(e, a) {
        t.includes(a) && (await fetch("/api/promo", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e,
                grants_employee_slot_packs: a
            })
        }), await Q())
    }
    async function eg(e, t) {
        a.includes(t) && (await fetch("/api/promo", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e,
                grants_branch_slot_packs: t
            })
        }), await Q())
    }
    async function eh(e) {
        let t = !e.grants_additive_only;
        (t ? confirm("Включить \xabтолько расширения\xbb? Код не меняет тариф Pro/Ultra — только начисляет подписки расширения (+5 сотр. / +1 филиал), если они заданы.") : confirm("Выключить \xabтолько расширения\xbb?")) && (await fetch("/api/promo", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e.id,
                grants_additive_only: t
            })
        }), await Q())
    }
    async function ey(e) {
        let t = !e.grants_limits_renew_monthly;
        await fetch("/api/promo", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e.id,
                grants_limits_renew_monthly: t
            })
        }), await Q()
    }
    async function ej(e) {
        var t;
        let a = !e.is_disabled;
        (!a || !e.is_used && !((null !== (t = e.redemption_count) && void 0 !== t ? t : 0) > 0) || confirm("Отключить промокод? У заведений, которые уже его применили, доступ будет заблокирован (как при истечении срока).")) && (u(!0), await fetch("/api/promo", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: e.id,
                is_disabled: a
            })
        }), await Q(), u(!1))
    }(0, s.useEffect)(() => {
        Q()
    }, [Q]);
    let eN = i.filter(e => {
            var t;
            if (!(e.code.includes(z.toUpperCase()) || (null !== (t = e.note) && void 0 !== t ? t : "").toLowerCase().includes(z.toLowerCase()))) return !1;
            let a = em(e);
            return "free" === K ? "free" === a || "partial" === a : "used" === K ? e.is_used : "expired" === K ? "expired" === a : "disabled" !== K || !0 === e.is_disabled
        }),
        ef = i.length,
        e_ = i.filter(e => e.is_used).length,
        ew = i.filter(e => {
            let t = em(e);
            return "free" === t || "partial" === t
        }).length,
        ek = i.filter(e => "expired" === em(e)).length,
        eC = i.filter(e => !0 === e.is_disabled).length;
    return (0, r.jsxs)(r.Fragment, {
        children: [p && (0, r.jsx)("div", {
            className: "mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm",
            children: p
        }), B && (0, r.jsx)("div", {
            className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "promo-expiry-title",
            onClick: () => {
                m || er()
            },
            children: (0, r.jsxs)("div", {
                className: "bg-gray-900 border border-gray-700 rounded-xl p-5 max-w-md w-full shadow-xl",
                onClick: e => e.stopPropagation(),
                children: [(0, r.jsx)("h3", {
                    id: "promo-expiry-title",
                    className: "text-white font-medium mb-2",
                    children: "Дата окончания / срок ввода"
                }), (0, r.jsx)("p", {
                    className: "text-gray-400 text-sm mb-3 leading-relaxed",
                    children: (null !== (e = B.activation_duration_days) && void 0 !== e ? e : 0) > 0 ? "Последний день, когда код ещё можно ввести. Без даты — нет ограничения по календарю." : "Действует до (классический промокод без режима \xabдней с активации\xbb). Без даты — без ограничения."
                }), (0, r.jsx)("p", {
                    className: "text-gray-500 text-xs font-mono mb-3",
                    children: B.code
                }), (0, r.jsx)("input", {
                    type: "date",
                    value: $,
                    onChange: e => Y(e.target.value),
                    disabled: m,
                    className: "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 mb-4 [color-scheme:dark]"
                }), (0, r.jsxs)("div", {
                    className: "flex flex-wrap gap-2 justify-end",
                    children: [(0, r.jsx)("button", {
                        type: "button",
                        onClick: () => {
                            m || er()
                        },
                        disabled: m,
                        className: "px-4 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm disabled:opacity-50",
                        children: "Отмена"
                    }), (0, r.jsx)("button", {
                        type: "button",
                        onClick: () => void el(null),
                        disabled: m,
                        className: "px-4 py-2 rounded-lg border border-amber-800/80 text-amber-200/90 hover:bg-amber-950/40 text-sm disabled:opacity-50",
                        children: "Без даты"
                    }), (0, r.jsx)("button", {
                        type: "button",
                        onClick: () => void el(),
                        disabled: m,
                        className: "px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm disabled:opacity-50",
                        children: m ? "…" : "Сохранить"
                    })]
                })]
            })
        }), (0, r.jsxs)("div", {
            className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4 sm:gap-3 sm:mb-6",
            children: [(0, r.jsx)(eP, {
                label: "Всего",
                value: ef
            }), (0, r.jsx)(eP, {
                label: "Свободно",
                value: ew
            }), (0, r.jsx)(eP, {
                label: "Использовано",
                value: e_
            }), (0, r.jsx)(eP, {
                label: "Истекло",
                value: ek
            }), (0, r.jsx)(eP, {
                label: "Отключено",
                value: eC
            })]
        }), (0, r.jsxs)("p", {
            className: "text-gray-500 text-sm mb-4 leading-relaxed",
            children: ["Регистрация ", (0, r.jsx)("span", {
                className: "text-gray-400",
                children: "без промокода"
            }), " в приложении даёт владельцу", " ", (0, r.jsx)("span", {
                className: "text-gray-400",
                children: "72 часа полного Pro"
            }), " (см. вкладку \xabЗаведения\xbb: колонка \xabРегистрация\xbb и поле ", (0, r.jsx)("code", {
                className: "text-gray-600 text-xs",
                children: "pro_trial_ends_at"
            }), "). Промокоды ниже — отдельный способ выдать тариф и срок."]
        }), (0, r.jsxs)("p", {
            className: "text-gray-600 text-xs mb-4 leading-relaxed border-l-2 border-gray-800 pl-3",
            children: ["Тариф в строке промокода задаёт, что запишется в", " ", (0, r.jsx)("code", {
                className: "text-gray-500 text-[10px]",
                children: "establishments.subscription_type"
            }), " в момент", " ", (0, r.jsx)("span", {
                className: "text-gray-500",
                children: "первого погашения"
            }), " кода. Уже активированный код не переписывает заведение — смена тарифа здесь влияет на новые активации и на отображение в админке."]
        }), (0, r.jsxs)("div", {
            className: "bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4",
            children: [(0, r.jsx)("h2", {
                className: "text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide",
                children: "Новый промокод"
            }), (0, r.jsxs)("p", {
                className: "text-[11px] text-gray-600 mb-3 leading-snug",
                children: [(0, r.jsx)("span", {
                    className: "text-gray-500 font-medium",
                    children: "Промокод"
                }), " — код выдачи тарифа (Pro/Ultra), сроков и при необходимости лимита сотрудников; это не то же самое, что платные подписки расширения в приложении. Уже созданные коды ", (0, r.jsx)("span", {
                    className: "text-gray-500",
                    children: "не меняются"
                }), " автоматически: у старых пустое \xabдней с активации\xbb. Ниже можно завести ", (0, r.jsx)("span", {
                    className: "text-gray-500",
                    children: "второй тип срока"
                }), " — дни Pro с момента активации кода."]
            }), (0, r.jsxs)("p", {
                className: "text-[11px] text-gray-600 mb-3 leading-snug border-l-2 border-indigo-700/50 pl-3",
                children: [(0, r.jsx)("span", {
                    className: "text-gray-500 font-medium",
                    children: "Подписки расширения Lite"
                }), ": выбор только из фиксированных пакетов. Для сотрудников: ", (0, r.jsx)("span", {
                    className: "text-gray-400",
                    children: "+5 / +8 / +12 / +15"
                }), ". Для заведений: ", (0, r.jsx)("span", {
                    className: "text-gray-400",
                    children: "+1 / +2 / +3 / +4"
                }), " (+5 / +10 — старые коды)."]
            }), (0, r.jsxs)("div", {
                className: "flex flex-col gap-2 mb-3",
                children: [(0, r.jsx)("span", {
                    className: "text-[11px] text-gray-500 uppercase tracking-wide",
                    children: "Логика"
                }), (0, r.jsxs)("div", {
                    className: "flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4",
                    children: [(0, r.jsxs)("label", {
                        className: "flex items-center gap-2 text-sm text-gray-300 cursor-pointer",
                        children: [(0, r.jsx)("input", {
                            type: "radio",
                            name: "promoLogic",
                            className: "accent-indigo-500",
                            checked: "legacy" === C,
                            onChange: () => {
                                S("legacy"), k("")
                            }
                        }), "Как раньше (классика)"]
                    }), (0, r.jsxs)("label", {
                        className: "flex items-center gap-2 text-sm text-gray-300 cursor-pointer",
                        children: [(0, r.jsx)("input", {
                            type: "radio",
                            name: "promoLogic",
                            className: "accent-indigo-500",
                            checked: "activation" === C,
                            onChange: () => S("activation")
                        }), "Новый тип: дни Pro с активации"]
                    })]
                }), (0, r.jsxs)("p", {
                    className: "text-[11px] text-gray-600 mb-2",
                    children: ["Тариф промокода — отдельно от \xabклассика / с активации\xbb: попадёт в", " ", (0, r.jsx)("span", {
                        className: "text-gray-500",
                        children: "subscription_type"
                    }), " заведения. Публичная линейка — только Lite / Pro / Ultra. Ultimate — скрытый тариф только по промокоду (POS Restodocks: столы, зал, заказы на prod; не показывать в витрине и прайсе)."]
                }), (0, r.jsxs)("div", {
                    className: "flex flex-col gap-1 mb-3 max-w-xs",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        children: "Выдаваемый тариф"
                    }), (0, r.jsx)("select", {
                        value: L,
                        onChange: e => T(e.target.value),
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500",
                        children: l.map(e => (0, r.jsxs)("option", {
                            value: e,
                            children: [d(e), " (", e, ")"]
                        }, e))
                    })]
                })]
            }), (0, r.jsx)("div", {
                className: "text-[10px] text-gray-500 uppercase tracking-wide mb-1",
                children: "Промокод — код, заметка, даты"
            }), (0, r.jsxs)("div", {
                className: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 sm:items-end",
                children: [(0, r.jsx)("input", {
                    type: "text",
                    value: h,
                    onChange: e => y(e.target.value.toUpperCase()),
                    placeholder: "BETA001",
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                }), (0, r.jsx)("input", {
                    type: "text",
                    value: b,
                    onChange: e => v(e.target.value),
                    placeholder: "Заметка",
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
                }), (0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        children: "legacy" === C ? "Действует с" : "Ввод кода с"
                    }), (0, r.jsx)("input", {
                        type: "date",
                        value: j,
                        onChange: e => N(e.target.value),
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    })]
                }), (0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        children: "legacy" === C ? "Действует до" : "Ввод кода до"
                    }), (0, r.jsx)("input", {
                        type: "date",
                        value: f,
                        onChange: e => _(e.target.value),
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    })]
                }), "activation" === C && (0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        title: "Только для нового типа: длина Pro от момента применения кода",
                        children: "Дней Pro с активации"
                    }), (0, r.jsx)("input", {
                        type: "number",
                        min: "1",
                        max: "36500",
                        value: w,
                        onChange: e => k(e.target.value),
                        placeholder: "напр. 30",
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm w-full sm:w-28"
                    })]
                }), (0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        children: "Макс. сотр."
                    }), (0, r.jsx)("input", {
                        type: "number",
                        min: "1",
                        value: P,
                        onChange: e => E(e.target.value),
                        placeholder: "∞",
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm w-full sm:w-24"
                    })]
                }), (0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        title: "Базовое число дополнительных филиалов на владельца (не пакет +1 в блоке расширений)",
                        children: "Макс. фил."
                    }), (0, r.jsx)("input", {
                        type: "number",
                        min: "0",
                        value: I,
                        onChange: e => A(e.target.value),
                        placeholder: "—",
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm w-full sm:w-24"
                    })]
                }), (0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        title: "Один и тот же строковый код можно применить к указанному числу разных заведений (регистраций).",
                        children: "Учётных записей"
                    }), (0, r.jsx)("input", {
                        type: "number",
                        min: "1",
                        max: "100000",
                        value: W,
                        onChange: e => J(e.target.value),
                        placeholder: "1",
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm w-full sm:w-28"
                    })]
                })]
            }), (0, r.jsx)("div", {
                className: "text-[10px] text-gray-500 uppercase tracking-wide mt-3 mb-1",
                children: "Подписки расширения (отдельно от промокода тарифа)"
            }), (0, r.jsxs)("div", {
                className: "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 sm:items-end rounded-lg border border-gray-800 bg-gray-950/40 p-3",
                children: [(0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-400",
                        children: "Увеличение сотрудников (пакет)"
                    }), (0, r.jsx)("select", {
                        value: D,
                        onChange: e => R(e.target.value),
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm w-full sm:w-28",
                        children: t.map(e => (0, r.jsx)("option", {
                            value: e,
                            children: 0 === e ? "нет" : "+".concat(e)
                        }, e))
                    })]
                }), (0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-400",
                        children: "Доп. заведения/филиалы (пакет)"
                    }), (0, r.jsx)("select", {
                        value: U,
                        onChange: e => O(e.target.value),
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-sm w-full sm:w-28",
                        children: a.map(e => (0, r.jsx)("option", {
                            value: e,
                            children: 0 === e ? "нет" : "+".concat(e)
                        }, e))
                    })]
                }), (0, r.jsxs)("label", {
                    className: "flex items-center gap-2 text-xs text-gray-400 cursor-pointer sm:mb-0 col-span-2 sm:col-auto",
                    children: [(0, r.jsx)("input", {
                        type: "checkbox",
                        className: "accent-indigo-500 rounded",
                        checked: F,
                        onChange: e => M(e.target.checked)
                    }), "Только расширения (без смены тарифа промокодом)"]
                }), (0, r.jsxs)("label", {
                    className: "flex items-center gap-2 text-xs text-gray-400 cursor-pointer sm:mb-0 col-span-2 sm:col-auto",
                    title: "ИИ-лимиты тарифа (ТТК с ИИ, меню-ИИ и др.): если включено — сброс каждый месяц в календарное число погашения; если выкл. — одноразовый пул на весь срок промо",
                    children: [(0, r.jsx)("input", {
                        type: "checkbox",
                        className: "accent-indigo-500 rounded",
                        checked: q,
                        onChange: e => H(e.target.checked)
                    }), "Возобновляемые ИИ-лимиты каждый месяц (от даты применения)"]
                }), (0, r.jsx)("button", {
                    onClick: X,
                    disabled: m || !h.trim(),
                    className: "col-span-2 sm:col-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-lg font-medium transition text-sm",
                    children: m ? "..." : "+ Создать"
                })]
            }), (0, r.jsxs)("div", {
                className: "text-[11px] text-gray-600 mt-3 border-t border-gray-800 pt-3 leading-snug space-y-1.5",
                children: [(0, r.jsxs)("div", {
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-500",
                        children: "Промокод при погашении: "
                    }), (0, r.jsx)("span", {
                        className: "text-gray-400",
                        children: F ? "только расширения (тариф по коду не меняется)" : "тариф ".concat(d(L), "; даты, макс. сотр. и макс. фил. — как в полях выше")
                    })]
                }), (() => {
                    let e = "" === D.trim() ? 0 : parseInt(D.trim(), 10),
                        s = "" === U.trim() ? 0 : parseInt(U.trim(), 10);
                    return Number.isNaN(e) || Number.isNaN(s) || !t.includes(e) || !a.includes(s) ? (0, r.jsx)("div", {
                        className: "text-amber-600/90",
                        children: "Выберите пакеты только из фиксированного списка."
                    }) : (0, r.jsxs)(r.Fragment, {
                        children: [(0, r.jsxs)("div", {
                            children: [(0, r.jsx)("span", {
                                className: "text-gray-500",
                                children: "Пакет сотрудников: "
                            }), (0, r.jsx)("span", {
                                className: "text-gray-400",
                                children: 0 === e ? "не включен" : "+".concat(e)
                            })]
                        }), (0, r.jsxs)("div", {
                            children: [(0, r.jsx)("span", {
                                className: "text-gray-500",
                                children: "Пакет заведений: "
                            }), (0, r.jsx)("span", {
                                className: "text-gray-400",
                                children: 0 === s ? "не включен" : "+".concat(s)
                            })]
                        })]
                    })
                })()]
            })]
        }), (0, r.jsxs)("div", {
            className: "flex gap-2 mb-3 flex-wrap",
            children: [(0, r.jsx)("input", {
                type: "text",
                value: z,
                onChange: e => G(e.target.value),
                placeholder: "Поиск...",
                className: "bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 flex-1 min-w-32 text-sm"
            }), (0, r.jsx)("div", {
                className: "flex gap-1 flex-wrap",
                children: ["all", "free", "used", "expired", "disabled"].map(e => (0, r.jsx)("button", {
                    onClick: () => V(e),
                    className: "px-2.5 py-1.5 rounded-lg text-xs transition ".concat(K === e ? "bg-indigo-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"),
                    children: {
                        all: "Все",
                        free: "Своб.",
                        used: "Исп.",
                        expired: "Истёк",
                        disabled: "Выкл."
                    } [e]
                }, e))
            })]
        }), c ? (0, r.jsx)("div", {
            className: "p-12 text-center text-gray-500",
            children: "Загрузка..."
        }) : 0 === eN.length ? (0, r.jsx)("div", {
            className: "p-12 text-center text-gray-500",
            children: "Промокодов нет"
        }) : (0, r.jsxs)(r.Fragment, {
            children: [(0, r.jsx)("div", {
                className: "hidden md:block bg-gray-900 rounded-xl border border-gray-800 overflow-hidden",
                children: (0, r.jsx)("div", {
                    className: "overflow-x-auto",
                    children: (0, r.jsxs)("table", {
                        className: "w-full min-w-[72rem] text-sm",
                        children: [(0, r.jsx)("thead", {
                            children: (0, r.jsxs)("tr", {
                                className: "border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide",
                                children: [(0, r.jsx)("th", {
                                    className: "px-4 py-3 text-left",
                                    children: "Код"
                                }), (0, r.jsx)("th", {
                                    className: "px-4 py-3 text-left",
                                    children: "Статус"
                                }), (0, r.jsx)("th", {
                                    className: "px-4 py-3 text-center text-[10px] uppercase max-w-[6rem]",
                                    title: "Сколько раз код уже применён / максимум разных учётных записей",
                                    children: "Активации"
                                }), (0, r.jsx)("th", {
                                    className: "px-4 py-3 text-left",
                                    children: "Кому применён"
                                }), (0, r.jsx)("th", {
                                    className: "px-4 py-3 text-left",
                                    title: "Классика: дата \xabдействует до\xbb. Новый тип: дни с активации и при необходимости срок ввода кода.",
                                    children: "Логика / срок"
                                }), (0, r.jsx)("th", {
                                    className: "px-4 py-3 text-center",
                                    children: "Сотр."
                                }), (0, r.jsx)("th", {
                                    className: "px-4 py-3 text-center",
                                    title: "Базовое число доп. филиалов на владельца (не пакет +1)",
                                    children: "Фил."
                                }), (0, r.jsx)("th", {
                                    className: "px-4 py-3 text-center text-[10px] uppercase max-w-[5.5rem]",
                                    title: "Отдельная подписка расширения Lite: число активаций в коде, каждая даёт +5 к лимиту сотрудников на заведение погашения",
                                    children: "+5 сотр."
                                }), (0, r.jsx)("th", {
                                    className: "px-4 py-3 text-center text-[10px] uppercase max-w-[5.5rem]",
                                    title: "Отдельная подписка расширения: число активаций в коде, каждая даёт +1 филиал на владельца",
                                    children: "+1 фил."
                                }), (0, r.jsx)("th", {
                                    className: "px-4 py-3 text-center text-[10px] uppercase",
                                    title: "Только подписки расширения в коде, без выдачи тарифа Pro/Ultra",
                                    children: "Только расш."
                                }), (0, r.jsx)("th", {
                                    className: "px-4 py-3 text-center text-[10px] uppercase max-w-[6rem]",
                                    title: "ИИ-лимиты: ежемесячно от даты погашения или одноразовый пул",
                                    children: "ИИ/мес"
                                }), (0, r.jsx)("th", {
                                    className: "px-4 py-3 text-left",
                                    children: "Создан"
                                }), (0, r.jsx)("th", {
                                    className: "px-4 py-3 text-right",
                                    children: "Действия"
                                })]
                            })
                        }), (0, r.jsx)("tbody", {
                            children: eN.map((e, s) => {
                                var n, i, o, d, c;
                                let x = {
                                        disabled: {
                                            label: "Отключён",
                                            cls: "bg-amber-900/40 text-amber-200"
                                        },
                                        used: {
                                            label: "Закончился",
                                            cls: "bg-blue-900/40 text-blue-300"
                                        },
                                        partial: {
                                            label: "Есть активации",
                                            cls: "bg-cyan-900/40 text-cyan-200"
                                        },
                                        expired: {
                                            label: "Истёк",
                                            cls: "bg-red-900/40 text-red-300"
                                        },
                                        free: {
                                            label: "Свободен",
                                            cls: "bg-emerald-900/40 text-emerald-300"
                                        }
                                    } [em(e)],
                                    u = e.is_disabled ? "font-mono font-bold text-red-400 hover:text-red-300 transition" : "font-mono font-bold text-white hover:text-indigo-400 transition",
                                    p = (null !== (n = e.activation_duration_days) && void 0 !== n ? n : 0) > 0;
                                return (0, r.jsxs)("tr", {
                                    className: "border-b border-gray-800/50 hover:bg-gray-800/30 transition ".concat(s === eN.length - 1 ? "border-0" : ""),
                                    children: [(0, r.jsx)("td", {
                                        className: "px-4 py-3",
                                        children: (0, r.jsxs)("div", {
                                            className: "flex flex-col gap-0.5 items-start",
                                            children: [(0, r.jsx)("button", {
                                                type: "button",
                                                onClick: () => navigator.clipboard.writeText(e.code),
                                                className: u,
                                                children: e.code
                                            }), (0, r.jsx)("span", {
                                                className: "text-[10px] text-gray-600 font-normal tracking-normal",
                                                children: p ? "тип: с активации" : "тип: классика"
                                            }), (0, r.jsx)("span", {
                                                className: "text-[10px] text-gray-500",
                                                children: "тариф"
                                            }), (0, r.jsx)(eb, {
                                                row: e,
                                                saving: m,
                                                onPick: en,
                                                selectableTiers: l
                                            })]
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-4 py-3",
                                        children: (0, r.jsx)("span", {
                                            className: "px-2 py-0.5 rounded text-xs font-medium ".concat(x.cls),
                                            children: x.label
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-4 py-3 text-center align-top",
                                        children: (0, r.jsxs)("button", {
                                            type: "button",
                                            title: "Изменить лимит активаций",
                                            onClick: () => {
                                                var t;
                                                return eo(e.id, null !== (t = e.max_redemptions) && void 0 !== t ? t : 1)
                                            },
                                            className: "text-xs font-mono tabular-nums hover:text-indigo-400 transition",
                                            children: [(0, r.jsx)("span", {
                                                className: "text-gray-300",
                                                children: null !== (i = e.redemption_count) && void 0 !== i ? i : 0
                                            }), (0, r.jsx)("span", {
                                                className: "text-gray-600",
                                                children: "/"
                                            }), (0, r.jsx)("span", {
                                                className: "text-gray-400",
                                                children: null !== (o = e.max_redemptions) && void 0 !== o ? o : 1
                                            })]
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-4 py-3 text-gray-400 align-top",
                                        children: (0, r.jsx)(ev, {
                                            row: e
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-4 py-3 text-gray-400 align-top",
                                        children: null != e.activation_duration_days && e.activation_duration_days > 0 ? (0, r.jsxs)("div", {
                                            className: "space-y-1",
                                            children: [(0, r.jsxs)("button", {
                                                type: "button",
                                                onClick: () => {
                                                    var t;
                                                    return ei(e.id, null !== (t = e.activation_duration_days) && void 0 !== t ? t : null)
                                                },
                                                className: "block text-left text-emerald-300/95 hover:text-emerald-200 text-xs",
                                                children: [e.activation_duration_days, " дн. с активации"]
                                            }), e.expires_at ? (0, r.jsxs)("button", {
                                                type: "button",
                                                onClick: () => ea(e),
                                                className: "block text-[10px] text-gray-500 hover:text-gray-300 ".concat(ex(e.expires_at) ? "text-red-400" : ""),
                                                children: ["ввести до ", es(e.expires_at)]
                                            }) : (0, r.jsx)("span", {
                                                className: "text-[10px] text-gray-600",
                                                children: "ввод кода без крайней даты"
                                            })]
                                        }) : (0, r.jsx)("button", {
                                            type: "button",
                                            onClick: () => ea(e),
                                            className: "hover:text-white transition text-xs ".concat(ex(e.expires_at) ? "text-red-400" : ""),
                                            children: es(e.expires_at)
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-4 py-3 text-center",
                                        children: (0, r.jsx)("button", {
                                            onClick: () => ed(e.id, e.max_employees),
                                            className: "text-xs font-mono hover:text-indigo-400 transition",
                                            children: null != e.max_employees ? (0, r.jsxs)("span", {
                                                className: "bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded",
                                                children: ["≤", e.max_employees]
                                            }) : (0, r.jsx)("span", {
                                                className: "text-gray-600",
                                                children: "∞"
                                            })
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-4 py-3 text-center",
                                        children: (0, r.jsx)("button", {
                                            onClick: () => eu(e.id, e.max_branches),
                                            className: "text-xs font-mono hover:text-indigo-400 transition",
                                            children: null != e.max_branches ? (0, r.jsxs)("span", {
                                                className: "bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded",
                                                children: ["≤", e.max_branches]
                                            }) : (0, r.jsx)("span", {
                                                className: "text-gray-600",
                                                children: "—"
                                            })
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-4 py-3 text-center align-top",
                                        children: (0, r.jsx)("select", {
                                            title: "Пакет сотрудников",
                                            value: String(null !== (d = e.grants_employee_slot_packs) && void 0 !== d ? d : 0),
                                            onChange: t => ep(e.id, parseInt(t.target.value, 10)),
                                            className: "bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200",
                                            children: t.map(e => (0, r.jsx)("option", {
                                                value: e,
                                                children: 0 === e ? "нет" : "+".concat(e)
                                            }, e))
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-4 py-3 text-center align-top",
                                        children: (0, r.jsx)("select", {
                                            title: "Пакет заведений",
                                            value: String(null !== (c = e.grants_branch_slot_packs) && void 0 !== c ? c : 0),
                                            onChange: t => eg(e.id, parseInt(t.target.value, 10)),
                                            className: "bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200",
                                            children: a.map(e => (0, r.jsx)("option", {
                                                value: e,
                                                children: 0 === e ? "нет" : "+".concat(e)
                                            }, e))
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-4 py-3 text-center",
                                        children: (0, r.jsx)("button", {
                                            type: "button",
                                            title: "Только подписки расширения, без смены тарифа",
                                            onClick: () => eh(e),
                                            className: "text-[10px] px-2 py-0.5 rounded border transition ".concat(e.grants_additive_only ? "border-amber-600/60 text-amber-200 bg-amber-950/40" : "border-gray-700 text-gray-600 hover:border-gray-500"),
                                            children: e.grants_additive_only ? "да" : "нет"
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-4 py-3 text-center",
                                        children: (0, r.jsx)("label", {
                                            className: "inline-flex items-center justify-center cursor-pointer",
                                            title: "Возобновляемые ИИ-лимиты каждый месяц (от даты применения промокода)",
                                            children: (0, r.jsx)("input", {
                                                type: "checkbox",
                                                className: "accent-emerald-500 rounded",
                                                checked: !!e.grants_limits_renew_monthly,
                                                onChange: () => void ey(e)
                                            })
                                        })
                                    }), (0, r.jsx)("td", {
                                        className: "px-4 py-3 text-gray-500 text-xs whitespace-nowrap",
                                        title: e.created_at,
                                        children: ec(e.created_at)
                                    }), (0, r.jsx)("td", {
                                        className: "px-4 py-3",
                                        children: (0, r.jsxs)("div", {
                                            className: "flex gap-2 justify-end flex-wrap",
                                            children: [(0, r.jsx)("button", {
                                                type: "button",
                                                title: e.is_disabled ? "Включить промокод" : "Отключить промокод",
                                                onClick: () => ej(e),
                                                disabled: m,
                                                className: "text-xs px-2 py-1 rounded border transition ".concat(e.is_disabled ? "border-amber-700 text-amber-300 hover:bg-amber-900/30" : "border-gray-700 text-gray-500 hover:text-amber-200 hover:border-amber-800"),
                                                children: "⏻"
                                            }), (0, r.jsx)("button", {
                                                onClick: () => et(e),
                                                className: "text-gray-500 hover:text-white transition text-xs px-2 py-1 rounded border border-gray-700 hover:border-gray-500",
                                                children: e.is_used ? "↩" : "✓"
                                            }), (0, r.jsx)("button", {
                                                onClick: () => ee(e.id),
                                                className: "text-gray-500 hover:text-red-400 transition text-xs px-2 py-1 rounded border border-gray-700 hover:border-red-800",
                                                children: "✕"
                                            })]
                                        })
                                    })]
                                }, e.id)
                            })
                        })]
                    })
                })
            }), (0, r.jsx)("div", {
                className: "md:hidden space-y-2",
                children: eN.map(e => {
                    var s, n, i, o, d, c, x, u;
                    let p = {
                            disabled: {
                                label: "Отключён",
                                cls: "bg-amber-900/40 text-amber-200"
                            },
                            used: {
                                label: "Закончился",
                                cls: "bg-blue-900/40 text-blue-300"
                            },
                            partial: {
                                label: "Есть активации",
                                cls: "bg-cyan-900/40 text-cyan-200"
                            },
                            expired: {
                                label: "Истёк",
                                cls: "bg-red-900/40 text-red-300"
                            },
                            free: {
                                label: "Свободен",
                                cls: "bg-emerald-900/40 text-emerald-300"
                            }
                        } [em(e)],
                        g = e.is_disabled ? "font-mono font-bold text-red-400 text-base active:text-red-300" : "font-mono font-bold text-white text-base active:text-indigo-400";
                    return (0, r.jsxs)("div", {
                        className: "bg-gray-900 rounded-xl border border-gray-800 p-4",
                        children: [(0, r.jsxs)("div", {
                            className: "flex items-start justify-between gap-2 mb-2",
                            children: [(0, r.jsx)("button", {
                                type: "button",
                                onClick: () => navigator.clipboard.writeText(e.code),
                                className: g,
                                children: e.code
                            }), (0, r.jsx)("span", {
                                className: "px-2 py-0.5 rounded text-xs font-medium shrink-0 ".concat(p.cls),
                                children: p.label
                            })]
                        }), (0, r.jsxs)("div", {
                            className: "text-[11px] text-gray-500 mb-2",
                            children: ["Активации:", " ", (0, r.jsxs)("button", {
                                type: "button",
                                className: "font-mono text-gray-300 hover:text-indigo-400",
                                onClick: () => {
                                    var t;
                                    return eo(e.id, null !== (t = e.max_redemptions) && void 0 !== t ? t : 1)
                                },
                                children: [null !== (s = e.redemption_count) && void 0 !== s ? s : 0, "/", null !== (n = e.max_redemptions) && void 0 !== n ? n : 1]
                            })]
                        }), (0, r.jsx)("div", {
                            className: "text-gray-400 text-xs mb-2",
                            children: (0, r.jsx)(ev, {
                                row: e
                            })
                        }), (0, r.jsxs)("div", {
                            className: "text-[10px] text-gray-600 mb-1 space-y-1",
                            children: [(0, r.jsx)("div", {
                                children: (null !== (i = e.activation_duration_days) && void 0 !== i ? i : 0) > 0 ? "тип: с активации" : "тип: классика"
                            }), (0, r.jsxs)("div", {
                                className: "flex flex-col gap-0.5",
                                children: [(0, r.jsx)("span", {
                                    className: "text-gray-500",
                                    children: "Тариф"
                                }), (0, r.jsx)(eb, {
                                    row: e,
                                    saving: m,
                                    onPick: en,
                                    selectableTiers: l,
                                    className: "bg-gray-950 border border-gray-700 rounded-lg px-2 py-2 text-xs text-gray-200 w-full max-w-[16rem]"
                                })]
                            })]
                        }), (0, r.jsxs)("div", {
                            className: "flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mb-3",
                            children: [null != e.activation_duration_days && e.activation_duration_days > 0 && (0, r.jsxs)("button", {
                                type: "button",
                                onClick: () => {
                                    var t;
                                    return ei(e.id, null !== (t = e.activation_duration_days) && void 0 !== t ? t : null)
                                },
                                className: "text-emerald-300",
                                children: [e.activation_duration_days, " дн. с активации"]
                            }), e.expires_at && (0, r.jsxs)("span", {
                                className: ex(e.expires_at) ? "text-red-400" : "",
                                children: [(null !== (o = e.activation_duration_days) && void 0 !== o ? o : 0) > 0 ? "ввести до " : "до ", es(e.expires_at)]
                            }), null != e.max_employees && (0, r.jsxs)("span", {
                                className: "text-indigo-300",
                                children: ["≤", e.max_employees, " сотр."]
                            }), null != e.max_branches && (0, r.jsxs)("span", {
                                className: "text-indigo-300",
                                children: ["≤", e.max_branches, " фил."]
                            }), (0, r.jsxs)("span", {
                                className: "text-gray-600 block",
                                children: ["Пакет сотрудников: ", (null !== (d = e.grants_employee_slot_packs) && void 0 !== d ? d : 0) > 0 ? "+".concat(e.grants_employee_slot_packs) : "нет"]
                            }), (0, r.jsxs)("span", {
                                className: "text-gray-600 block",
                                children: ["Пакет заведений: ", (null !== (c = e.grants_branch_slot_packs) && void 0 !== c ? c : 0) > 0 ? "+".concat(e.grants_branch_slot_packs) : "нет", e.grants_additive_only ? " \xb7 только расширения" : ""]
                            }), (0, r.jsxs)("label", {
                                className: "flex items-center gap-2 text-xs text-gray-500 cursor-pointer",
                                children: [(0, r.jsx)("input", {
                                    type: "checkbox",
                                    className: "accent-emerald-500 rounded",
                                    checked: !!e.grants_limits_renew_monthly,
                                    onChange: () => void ey(e)
                                }), "ИИ-лимиты/мес"]
                            }), (0, r.jsxs)("span", {
                                children: ["создан ", es(e.created_at)]
                            })]
                        }), (0, r.jsxs)("div", {
                            className: "flex gap-2 flex-wrap",
                            children: [(0, r.jsx)("button", {
                                type: "button",
                                onClick: () => ej(e),
                                disabled: m,
                                className: "px-3 py-2 rounded-lg border text-sm ".concat(e.is_disabled ? "border-amber-700 text-amber-300" : "border-gray-700 text-gray-400 hover:text-amber-200"),
                                title: e.is_disabled ? "Включить" : "Отключить",
                                children: "⏻"
                            }), (0, r.jsx)("button", {
                                onClick: () => et(e),
                                className: "flex-1 min-w-[8rem] text-center text-gray-400 hover:text-white active:text-white transition text-sm py-2 rounded-lg border border-gray-700 active:border-gray-500",
                                children: e.is_used ? "↩ Сбросить" : "✓ Отметить исп."
                            }), (0, r.jsx)("button", {
                                onClick: () => ea(e),
                                className: "px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white active:text-white text-sm",
                                title: "Дата окончания / ввода",
                                children: "\uD83D\uDCC5"
                            }), (0, r.jsx)("button", {
                                onClick: () => ed(e.id, e.max_employees),
                                className: "px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white active:text-white text-sm",
                                title: "Макс. сотрудников (промо)",
                                children: "\uD83D\uDC65"
                            }), (0, r.jsx)("button", {
                                onClick: () => eu(e.id, e.max_branches),
                                className: "px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white active:text-white text-sm",
                                title: "Макс. филиалов (промо)",
                                children: "\uD83C\uDFE2"
                            }), (0, r.jsx)("select", {
                                value: String(null !== (x = e.grants_employee_slot_packs) && void 0 !== x ? x : 0),
                                onChange: t => ep(e.id, parseInt(t.target.value, 10)),
                                className: "px-3 py-2 rounded-lg border border-gray-700 bg-gray-900 text-gray-200 text-sm",
                                title: "Пакет сотрудников",
                                children: t.map(e => (0, r.jsx)("option", {
                                    value: e,
                                    children: 0 === e ? "Сотр.: нет" : "Сотр.: +".concat(e)
                                }, e))
                            }), (0, r.jsx)("select", {
                                value: String(null !== (u = e.grants_branch_slot_packs) && void 0 !== u ? u : 0),
                                onChange: t => eg(e.id, parseInt(t.target.value, 10)),
                                className: "px-3 py-2 rounded-lg border border-gray-700 bg-gray-900 text-gray-200 text-sm",
                                title: "Пакет заведений",
                                children: a.map(e => (0, r.jsx)("option", {
                                    value: e,
                                    children: 0 === e ? "Филиалы: нет" : "Филиалы: +".concat(e)
                                }, e))
                            }), (0, r.jsx)("button", {
                                type: "button",
                                onClick: () => eh(e),
                                className: "px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-amber-200 text-sm",
                                title: "Только подписки расширения",
                                children: "+"
                            }), (0, r.jsx)("button", {
                                onClick: () => ee(e.id),
                                className: "px-3 py-2 rounded-lg border border-red-900/50 text-red-500 hover:text-red-400 active:text-red-400 text-sm",
                                children: "✕"
                            })]
                        })]
                    }, e.id)
                })
            })]
        })]
    })
}

function eN() {
    let [e, t] = (0, s.useState)(null), [a, l] = (0, s.useState)(!0), [n, i] = (0, s.useState)(null), o = (0, s.useCallback)(async () => {
        l(!0), i(null);
        let e = await fetch("/api/security-snapshot"),
            a = await e.json();
        e.ok ? t(a) : (i("string" == typeof(null == a ? void 0 : a.error) ? a.error : "Ошибка загрузки"), t(null)), l(!1)
    }, []);
    if ((0, s.useEffect)(() => {
            o()
        }, [o]), a) return (0, r.jsx)("div", {
        className: "p-12 text-center text-gray-500",
        children: "Загрузка..."
    });
    if (n) return (0, r.jsxs)("div", {
        className: "space-y-4",
        children: [(0, r.jsx)("p", {
            className: "text-red-300 text-sm",
            children: n
        }), (0, r.jsx)("button", {
            type: "button",
            onClick: () => o(),
            className: "bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium",
            children: "Обновить"
        })]
    });
    if (!e) return null;
    let d = e.cloudflare,
        c = "number" == typeof d.requests24hApprox ? d.requests24hApprox.toLocaleString("ru-RU") : "—",
        x = e.monitoring,
        m = "alert" === x.alertLevel ? "border-red-800/60 bg-red-950/30 text-red-100" : "attention" === x.alertLevel ? "border-amber-800/50 bg-amber-950/20 text-amber-100" : "border-emerald-800/50 bg-emerald-950/20 text-emerald-100";
    return (0, r.jsxs)("div", {
        className: "space-y-6 max-w-4xl",
        children: [(0, r.jsxs)("section", {
            className: "rounded-xl border p-4 ".concat(m),
            children: [(0, r.jsxs)("h2", {
                className: "text-base font-semibold mb-1",
                children: ["Периметр: ", x.alertLevelLabel]
            }), (0, r.jsxs)("p", {
                className: "text-sm opacity-90 leading-relaxed",
                children: ["Постоянная защита: WAF и rate limit (Cloudflare), лимиты Edge и Auth, RLS. При лавине боты получают block/429 — приложение для своих работает. Снимок ниже — для справки; дежурить не нужно. Запасной сигнал: ", x.watchdogSchedule, " → issue в GitHub."]
            }), x.alertReasons.length > 0 ? (0, r.jsx)("ul", {
                className: "mt-2 text-xs opacity-90 list-disc list-inside space-y-1",
                children: x.alertReasons.map((e, t) => (0, r.jsx)("li", {
                    children: e
                }, t))
            }) : null, (0, r.jsxs)("p", {
                className: "text-xs mt-2 opacity-70",
                children: ["Один раз: ", x.docPath]
            })]
        }), (0, r.jsx)("p", {
            className: "text-gray-400 text-sm leading-relaxed",
            children: "Сводка периметра: трафик и WAF (Cloudflare, если заданы CLOUDFLARE_API_TOKEN и CLOUDFLARE_ZONE_ID в секретах Worker), эвристики и ссылки в консоли. Полные сырые логи — в Cloudflare и Supabase."
        }), (0, r.jsxs)("p", {
            className: "text-gray-500 text-xs",
            children: ["Снимок: ", e.generatedAt]
        }), (0, r.jsxs)("section", {
            children: [(0, r.jsx)("h2", {
                className: "text-base font-semibold text-white mb-2",
                children: "Cloudflare"
            }), d.configured ? (0, r.jsxs)("div", {
                className: "space-y-2",
                children: [(0, r.jsxs)("p", {
                    className: "text-gray-200 text-sm",
                    children: ["Запросы (~24 ч): ", (0, r.jsx)("span", {
                        className: "font-mono text-indigo-300",
                        children: c
                    })]
                }), d.graphqlErrors && d.graphqlErrors.length > 0 && (0, r.jsx)("p", {
                    className: "text-amber-300/90 text-xs",
                    children: d.graphqlErrors.join("; ")
                })]
            }) : (0, r.jsx)("p", {
                className: "text-gray-400 text-sm",
                children: "API Cloudflare не настроен. В Secrets/переменных Worker задайте CLOUDFLARE_API_TOKEN и CLOUDFLARE_ZONE_ID (Analytics + Firewall Read) — появятся счётчик и события WAF. Опционально CLOUDFLARE_ACCOUNT_ID — для прямых ссылок в дашборд."
            })]
        }), e.hint ? (0, r.jsx)("p", {
            className: "text-amber-200/90 text-sm border border-amber-800/50 rounded-lg p-3 bg-amber-950/20",
            children: e.hint
        }) : null, (0, r.jsxs)("section", {
            children: [(0, r.jsx)("h2", {
                className: "text-base font-semibold text-white mb-3",
                children: "Интерпретация"
            }), (0, r.jsx)("ul", {
                className: "space-y-3",
                children: e.insights.map((e, t) => (0, r.jsxs)("li", {
                    className: "flex gap-2 text-sm text-gray-300",
                    children: [(0, r.jsx)("span", {
                        className: "shrink-0",
                        title: e.severity,
                        children: "warning" === e.severity ? "⚠️" : "ℹ️"
                    }), (0, r.jsx)("span", {
                        children: function(e) {
                            switch (e.kind) {
                                case "traffic_volume":
                                    return "За ~24 ч около ".concat(e.requests24h.toLocaleString("ru-RU"), " HTTP-запросов к зоне. Сравните с обычным днём: резкий рост часто совпадает с ботами или парсингом.");
                                case "waf_activity":
                                    return "Срабатывания WAF: блокировок ".concat(e.blocks, ", challenge ").concat(e.challenges, ". Возможны сканирование, перебор или нетипичный клиент — смотрите Security в Cloudflare.");
                                case "ip_noisy":
                                    return "IP ".concat(e.ip, " даёт ").concat(e.events, " событий в выборке — проверьте rate limit / правило для IP (возможен парсинг или скрипт).");
                                case "probe_path":
                                    return "В выборке есть запрос к подозрительному пути (".concat(e.pathSample, ") — похоже на сканирование уязвимостей.");
                                case "db_attack_note":
                                    return "Прямой доступ к БД из интернета здесь обычно не виден: Postgres за закрытым API. Риски — через ключи и эндпоинты; полные логи Auth/Edge — в Supabase.";
                                default:
                                    return ""
                            }
                        }(e)
                    })]
                }, t))
            })]
        }), (0, r.jsxs)("section", {
            children: [(0, r.jsx)("h2", {
                className: "text-base font-semibold text-white mb-2",
                children: "События WAF (последние)"
            }), d.configured && 0 !== d.firewallEvents.length ? (0, r.jsx)("div", {
                className: "overflow-x-auto bg-gray-900 rounded-xl border border-gray-800",
                children: (0, r.jsxs)("table", {
                    className: "w-full text-xs",
                    children: [(0, r.jsx)("thead", {
                        children: (0, r.jsxs)("tr", {
                            className: "border-b border-gray-800 text-gray-500 text-left",
                            children: [(0, r.jsx)("th", {
                                className: "px-3 py-2",
                                children: "Действие"
                            }), (0, r.jsx)("th", {
                                className: "px-3 py-2",
                                children: "IP"
                            }), (0, r.jsx)("th", {
                                className: "px-3 py-2",
                                children: "Путь"
                            }), (0, r.jsx)("th", {
                                className: "px-3 py-2",
                                children: "Время"
                            })]
                        })
                    }), (0, r.jsx)("tbody", {
                        children: d.firewallEvents.slice(0, 25).map((e, t) => {
                            var a, s, l, n;
                            let i = (null !== (a = e.clientRequestPath) && void 0 !== a ? a : "").toString(),
                                o = i.length > 56 ? "".concat(i.slice(0, 56), "…") : i;
                            return (0, r.jsxs)("tr", {
                                className: "border-b border-gray-800/60",
                                children: [(0, r.jsx)("td", {
                                    className: "px-3 py-2 text-gray-300",
                                    children: null !== (s = e.action) && void 0 !== s ? s : "—"
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 font-mono text-gray-400",
                                    children: null !== (l = e.clientIP) && void 0 !== l ? l : "—"
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 text-gray-400 max-w-[14rem] truncate",
                                    title: i,
                                    children: o || "—"
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 text-gray-500 whitespace-nowrap",
                                    children: null !== (n = e.datetime) && void 0 !== n ? n : "—"
                                })]
                            }, t)
                        })
                    })]
                })
            }) : (0, r.jsx)("p", {
                className: "text-gray-500 text-sm",
                children: d.configured ? "Нет событий в выборке или недоступно на тарифе/API." : "—"
            })]
        }), (0, r.jsxs)("section", {
            children: [(0, r.jsx)("h2", {
                className: "text-base font-semibold text-white mb-2",
                children: "Полные логи"
            }), (0, r.jsxs)("ul", {
                className: "space-y-2 text-sm",
                children: [(0, r.jsx)("li", {
                    children: (0, r.jsx)("a", {
                        href: e.links.cloudflareSecurity,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-indigo-400 hover:text-indigo-300 underline",
                        children: "Cloudflare — Security / Analytics"
                    })
                }), (0, r.jsx)("li", {
                    children: (0, r.jsx)("a", {
                        href: e.links.cloudflareWaf,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-indigo-400 hover:text-indigo-300 underline",
                        children: "Cloudflare — WAF"
                    })
                }), (0, r.jsx)("li", {
                    children: (0, r.jsx)("a", {
                        href: e.links.supabaseLogs,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-indigo-400 hover:text-indigo-300 underline",
                        children: "Supabase — Logs"
                    })
                }), (0, r.jsx)("li", {
                    children: (0, r.jsx)("a", {
                        href: e.links.supabaseAuth,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-indigo-400 hover:text-indigo-300 underline",
                        children: "Supabase — Auth"
                    })
                })]
            })]
        }), (0, r.jsx)("button", {
            type: "button",
            onClick: () => o(),
            className: "bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-sm",
            children: "Обновить данные"
        })]
    })
}

function ef() {
    var e, t;
    let [a, l] = (0, s.useState)(null), [n, i] = (0, s.useState)(!0), [o, d] = (0, s.useState)(null), c = (0, s.useCallback)(async () => {
        i(!0), d(null);
        let e = await fetch("/api/system-health"),
            t = await e.json();
        e.ok ? l(t) : (d("string" == typeof(null == t ? void 0 : t.error) ? t.error : "Ошибка загрузки"), l(null)), i(!1)
    }, []);
    if ((0, s.useEffect)(() => {
            c()
        }, [c]), n) return (0, r.jsx)("div", {
        className: "p-12 text-center text-gray-500",
        children: "Загрузка..."
    });
    if (o) return (0, r.jsxs)("div", {
        className: "space-y-4",
        children: [(0, r.jsx)("p", {
            className: "text-red-300 text-sm",
            children: o
        }), (0, r.jsx)("button", {
            type: "button",
            onClick: () => c(),
            className: "bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium",
            children: "Повторить"
        })]
    });
    if (!a) return null;
    let x = "number" == typeof a.cloudflare.requests24hApprox ? a.cloudflare.requests24hApprox.toLocaleString("ru-RU") : "—";

    function m(e, t) {
        return t ? e >= 1200 ? "text-amber-300" : "text-emerald-300" : "text-red-400"
    }
    return (0, r.jsxs)("div", {
        className: "space-y-6 max-w-4xl",
        children: [(0, r.jsx)("p", {
            className: "text-gray-400 text-sm leading-relaxed",
            children: "Быстрые проверки из админки: доступность Supabase (Auth и API к БД) и объём HTTP-запросов к зоне сайта в Cloudflare за ~24 ч. Это не замена мониторингу в Supabase (CPU, квоты, логи Edge), но помогает заметить отказ или аномальный трафик до того, как \xabляжет\xbb приложение у пользователей."
        }), (0, r.jsxs)("div", {
            className: "flex flex-wrap items-center gap-3",
            children: [(0, r.jsx)("span", {
                className: "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ".concat(a.ok ? "bg-emerald-950/60 text-emerald-200 border border-emerald-800/50" : "bg-red-950/60 text-red-200 border border-red-800/50"),
                children: a.ok ? "Критичные проверки пройдены" : "Есть проблемы доступности"
            }), (0, r.jsxs)("span", {
                className: "text-gray-500 text-xs",
                children: ["Снимок: ", a.generatedAt]
            })]
        }), (0, r.jsxs)("div", {
            className: "grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3",
            children: [(0, r.jsx)(eP, {
                label: "Auth (GoTrue)",
                value: a.authHealth ? "".concat(a.authHealth.latencyMs, " мс") : "—",
                dimmed: !(null === (e = a.authHealth) || void 0 === e ? void 0 : e.ok)
            }), (0, r.jsx)(eP, {
                label: "API БД (PostgREST)",
                value: a.restSmoke ? "".concat(a.restSmoke.latencyMs, " мс") : "—",
                dimmed: !(null === (t = a.restSmoke) || void 0 === t ? void 0 : t.ok)
            }), (0, r.jsx)(eP, {
                label: "Заведений (оценка)",
                value: null != a.restRowEstimate ? a.restRowEstimate : "—"
            }), (0, r.jsx)(eP, {
                label: "HTTP к зоне (~24 ч)",
                value: x
            })]
        }), (a.authHealth || a.restSmoke) && (0, r.jsxs)("div", {
            className: "text-xs text-gray-500 space-y-1 font-mono",
            children: [a.authHealth ? (0, r.jsxs)("p", {
                className: m(a.authHealth.latencyMs, a.authHealth.ok),
                children: ["Auth: ", a.authHealth.ok ? "OK" : "FAIL", null != a.authHealth.status ? " ".concat(a.authHealth.status) : "", a.authHealth.detail ? " — ".concat(a.authHealth.detail) : ""]
            }) : null, a.restSmoke ? (0, r.jsxs)("p", {
                className: m(a.restSmoke.latencyMs, a.restSmoke.ok),
                children: ["REST HEAD establishments: ", a.restSmoke.ok ? "OK" : "FAIL", null != a.restSmoke.status ? " ".concat(a.restSmoke.status) : "", a.restSmoke.detail ? " — ".concat(a.restSmoke.detail) : ""]
            }) : null, a.supabaseUrlHost ? (0, r.jsxs)("p", {
                className: "text-gray-600 truncate",
                title: a.supabaseUrlHost,
                children: ["Хост: ", a.supabaseUrlHost]
            }) : null]
        }), !a.cloudflare.configured && (0, r.jsx)("p", {
            className: "text-amber-200/90 text-sm border border-amber-800/50 rounded-lg p-3 bg-amber-950/20",
            children: "Трафик Cloudflare не подключён: добавьте CLOUDFLARE_API_TOKEN и CLOUDFLARE_ZONE_ID в секреты Worker — как для вкладки \xabБезопасность\xbb."
        }), a.cloudflare.configured && a.cloudflare.graphqlError && (0, r.jsx)("p", {
            className: "text-amber-300/90 text-xs",
            children: a.cloudflare.graphqlError
        }), a.hints.length > 0 && (0, r.jsxs)("section", {
            children: [(0, r.jsx)("h2", {
                className: "text-base font-semibold text-white mb-2",
                children: "Подсказки"
            }), (0, r.jsx)("ul", {
                className: "space-y-2",
                children: a.hints.map((e, t) => (0, r.jsx)("li", {
                    className: "text-sm text-gray-400 border-l-2 border-gray-700 pl-3",
                    children: e
                }, t))
            })]
        }), (0, r.jsxs)("section", {
            children: [(0, r.jsx)("h2", {
                className: "text-base font-semibold text-white mb-2",
                children: "Где смотреть полные метрики"
            }), (0, r.jsxs)("ul", {
                className: "space-y-2 text-sm",
                children: [(0, r.jsx)("li", {
                    children: (0, r.jsx)("a", {
                        href: a.links.supabaseProject,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-indigo-400 hover:text-indigo-300 underline",
                        children: "Supabase — проект (отчёты, логи, биллинг)"
                    })
                }), (0, r.jsx)("li", {
                    children: (0, r.jsx)("a", {
                        href: a.links.supabaseAdvisor,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-indigo-400 hover:text-indigo-300 underline",
                        children: "Supabase — Advisors (медленные запросы, индексы)"
                    })
                }), (0, r.jsx)("li", {
                    children: (0, r.jsx)("a", {
                        href: a.links.cloudflareAnalytics,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-indigo-400 hover:text-indigo-300 underline",
                        children: "Cloudflare — аналитика трафика зоны"
                    })
                }), (0, r.jsx)("li", {
                    children: (0, r.jsx)("a", {
                        href: a.links.cloudflareWorkersOverview,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-indigo-400 hover:text-indigo-300 underline",
                        children: "Cloudflare — Workers & Pages (в т.ч. эта админка)"
                    })
                })]
            })]
        }), (0, r.jsx)("button", {
            type: "button",
            onClick: () => c(),
            className: "bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-sm",
            children: "Обновить проверки"
        })]
    })
}

function e_() {
    var e, t, a, l, n, i, o, d, c;
    let x = D(),
        [m, u] = (0, s.useState)(() => ed(-30)),
        [p, g] = (0, s.useState)(() => ed(0)),
        [h, y] = (0, s.useState)("00:00"),
        [b, j] = (0, s.useState)("23:59"),
        [N, f] = (0, s.useState)(""),
        [_, w] = (0, s.useState)(""),
        [k, C] = (0, s.useState)(null),
        [S, L] = (0, s.useState)(!0),
        [T, P] = (0, s.useState)(null),
        E = e => {
            u(ed(-e)), g(ed(0)), y("00:00"), j("23:59")
        },
        I = (0, s.useCallback)(async () => {
            if (!m || !p) {
                P("Укажите даты \xabС\xbb и \xabПо\xbb");
                return
            }
            if (m > p) {
                P("Дата \xabС\xbb не может быть позже \xabПо\xbb");
                return
            }
            if (m === p && h >= b && "23:59" !== b) {
                P("Время \xabС\xbb должно быть раньше \xabПо\xbb");
                return
            }
            L(!0), P(null);
            try {
                let e = new URLSearchParams;
                e.set("from", m), e.set("to", p), e.set("fromTime", h), e.set("toTime", b), e.set("tz", x), N.trim() && e.set("provider", N.trim().toLowerCase()), _.trim() && e.set("context", _.trim().toLowerCase()), e.set("limit", "500");
                let t = await fetch("/api/ai-usage?".concat(e.toString()), {
                        cache: "no-store"
                    }),
                    a = await t.json();
                t.ok ? C(a) : (P("string" == typeof(null == a ? void 0 : a.error) ? a.error : "Ошибка (".concat(t.status, ")")), C(null))
            } finally {
                L(!1)
            }
        }, [m, p, h, b, x, N, _]);
    (0, s.useEffect)(() => {
        I()
    }, [I]);
    let A = (null == k ? void 0 : k.summary.requests) ? Math.round(k.summary.successRequests / k.summary.requests * 1e3) / 10 : 0,
        R = (0, s.useMemo)(() => {
            var e, t, a, r, s;
            if (!(null == k ? void 0 : null === (e = k.meta) || void 0 === e ? void 0 : e.rangeFrom) || !(null == k ? void 0 : null === (t = k.meta) || void 0 === t ? void 0 : t.rangeTo)) return (null == k ? void 0 : null === (a = k.meta) || void 0 === a ? void 0 : a.fromIso) ? "с ".concat(es(k.meta.fromIso)) : null;
            let l = null !== (r = k.meta.rangeFromTime) && void 0 !== r ? r : "00:00",
                n = null !== (s = k.meta.rangeToTime) && void 0 !== s ? s : "23:59",
                i = k.meta.rangeFrom === k.meta.rangeTo,
                o = "00:00" === l && "23:59" === n;
            return i && !o ? "".concat(es(k.meta.rangeFrom), " ").concat(l, " — ").concat(n) : o && k.meta.rangeFrom === k.meta.rangeTo ? es(k.meta.rangeFrom) : o ? "".concat(es(k.meta.rangeFrom), " — ").concat(es(k.meta.rangeTo)) : "".concat(es(k.meta.rangeFrom), " ").concat(l, " — ").concat(es(k.meta.rangeTo), " ").concat(n)
        }, [null == k ? void 0 : k.meta]);
    return (0, r.jsxs)("div", {
        className: "space-y-6",
        children: [(0, r.jsxs)("div", {
            className: "bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-wrap items-end gap-3",
            children: [(0, r.jsxs)("div", {
                className: "flex items-end gap-2",
                children: [(0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        children: "С"
                    }), (0, r.jsx)("input", {
                        type: "date",
                        value: m,
                        onChange: e => u(e.target.value),
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    })]
                }), (0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        children: "время"
                    }), (0, r.jsx)("input", {
                        type: "time",
                        value: h,
                        onChange: e => y(e.target.value),
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    })]
                }), (0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        children: "По"
                    }), (0, r.jsx)("input", {
                        type: "date",
                        value: p,
                        onChange: e => g(e.target.value),
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    })]
                }), (0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        children: "время"
                    }), (0, r.jsx)("input", {
                        type: "time",
                        value: b,
                        onChange: e => j(e.target.value),
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    })]
                })]
            }), (0, r.jsxs)("div", {
                className: "flex flex-col gap-1",
                children: [(0, r.jsx)("label", {
                    className: "text-xs text-gray-500",
                    children: "Быстрый период"
                }), (0, r.jsxs)("select", {
                    defaultValue: "",
                    onChange: e => {
                        let t = Number(e.target.value);
                        t && (E(t), e.target.value = "")
                    },
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm min-w-[10rem]",
                    children: [(0, r.jsx)("option", {
                        value: "",
                        children: "выбрать…"
                    }), (0, r.jsx)("option", {
                        value: 7,
                        children: "последние 7 дней"
                    }), (0, r.jsx)("option", {
                        value: 14,
                        children: "последние 14 дней"
                    }), (0, r.jsx)("option", {
                        value: 30,
                        children: "последние 30 дней"
                    }), (0, r.jsx)("option", {
                        value: 90,
                        children: "последние 90 дней"
                    }), (0, r.jsx)("option", {
                        value: 180,
                        children: "последние 180 дней"
                    })]
                })]
            }), (0, r.jsxs)("div", {
                className: "flex flex-col gap-1",
                children: [(0, r.jsx)("label", {
                    className: "text-xs text-gray-500",
                    children: "Провайдер"
                }), (0, r.jsxs)("select", {
                    value: N,
                    onChange: e => f(e.target.value),
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm min-w-[10rem]",
                    children: [(0, r.jsx)("option", {
                        value: "",
                        children: "все"
                    }), (0, r.jsx)("option", {
                        value: "deepseek",
                        children: "deepseek"
                    }), (0, r.jsx)("option", {
                        value: "openai",
                        children: "openai"
                    }), (0, r.jsx)("option", {
                        value: "gemini",
                        children: "gemini"
                    }), (0, r.jsx)("option", {
                        value: "groq",
                        children: "groq"
                    }), (0, r.jsx)("option", {
                        value: "claude",
                        children: "claude"
                    })]
                })]
            }), (0, r.jsxs)("div", {
                className: "flex flex-col gap-1",
                children: [(0, r.jsx)("label", {
                    className: "text-xs text-gray-500",
                    children: "Контекст"
                }), (0, r.jsxs)("select", {
                    value: _,
                    onChange: e => w(e.target.value),
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm min-w-[10rem]",
                    children: [(0, r.jsx)("option", {
                        value: "",
                        children: "все"
                    }), (0, r.jsx)("option", {
                        value: "translation",
                        children: "translation"
                    }), (0, r.jsx)("option", {
                        value: "ttk",
                        children: "ttk"
                    }), (0, r.jsx)("option", {
                        value: "menu",
                        children: "menu"
                    }), (0, r.jsx)("option", {
                        value: "chat",
                        children: "chat"
                    }), (0, r.jsx)("option", {
                        value: "other",
                        children: "other"
                    })]
                })]
            }), (0, r.jsx)("button", {
                type: "button",
                onClick: () => void I(),
                className: "bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium",
                disabled: S,
                children: S ? "Обновление…" : "Обновить"
            }), (null == k ? void 0 : k.meta) ? (0, r.jsxs)("div", {
                className: "text-xs text-gray-500 ml-auto max-w-xs text-right",
                children: [R ? (0, r.jsx)("div", {
                    children: R
                }) : null, k.meta.truncated ? (0, r.jsxs)("div", {
                    className: "text-amber-500/90",
                    children: ["Учтено ", k.meta.aggregatedRows.toLocaleString("ru-RU"), " из ", k.meta.totalRows.toLocaleString("ru-RU")]
                }) : k.meta.totalRows > 0 ? (0, r.jsxs)("div", {
                    children: ["Все ", k.meta.totalRows.toLocaleString("ru-RU"), " записей учтены"]
                }) : null]
            }) : null]
        }), T ? (0, r.jsx)("div", {
            className: "p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm",
            children: T
        }) : null, k && !T ? (0, r.jsxs)("div", {
            className: "bg-gradient-to-br from-amber-950/50 to-gray-900 border border-amber-800/40 rounded-xl p-6",
            children: [(0, r.jsx)("div", {
                className: "text-xs text-amber-200/70 uppercase tracking-wide",
                children: "Затраты за период"
            }), (0, r.jsx)("div", {
                className: "text-4xl font-bold text-amber-300 mt-2",
                children: eo(k.summary.estimatedCostUsd)
            }), R ? (0, r.jsx)("div", {
                className: "text-sm text-gray-400 mt-2",
                children: R
            }) : null, (0, r.jsxs)("div", {
                className: "text-xs text-gray-500 mt-1",
                children: ["часовой пояс: ", x]
            }), (0, r.jsxs)("div", {
                className: "text-xs text-gray-500 mt-2",
                children: [k.summary.requests.toLocaleString("ru-RU"), " вызовов \xb7", " ", k.summary.totalTokens.toLocaleString("ru-RU"), " токенов"]
            })]
        }) : null, (0, r.jsxs)("div", {
            className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3",
            children: [(0, r.jsx)(eP, {
                label: "Запросов",
                value: null !== (t = null == k ? void 0 : k.summary.requests) && void 0 !== t ? t : "—"
            }), (0, r.jsx)(eP, {
                label: "Успешных",
                value: null !== (a = null == k ? void 0 : k.summary.successRequests) && void 0 !== a ? a : "—"
            }), (0, r.jsx)(eP, {
                label: "Ошибок",
                value: null !== (l = null == k ? void 0 : k.summary.failedRequests) && void 0 !== l ? l : "—",
                dimmed: (null !== (n = null == k ? void 0 : k.summary.failedRequests) && void 0 !== n ? n : 0) === 0
            }), (0, r.jsx)(eP, {
                label: "Токены (всего)",
                value: null !== (i = null == k ? void 0 : null === (e = k.summary.totalTokens) || void 0 === e ? void 0 : e.toLocaleString("ru-RU")) && void 0 !== i ? i : "—"
            }), (0, r.jsx)(eP, {
                label: "Успешность",
                value: "".concat(A, "%")
            }), (0, r.jsx)(eP, {
                label: "Оценка расходов",
                value: eo(null == k ? void 0 : k.summary.estimatedCostUsd)
            })]
        }), (0, r.jsxs)("div", {
            className: "grid lg:grid-cols-2 gap-4",
            children: [(0, r.jsxs)("section", {
                className: "bg-gray-900 rounded-xl border border-gray-800 overflow-hidden",
                children: [(0, r.jsx)("div", {
                    className: "px-4 py-3 border-b border-gray-800 text-sm text-gray-300",
                    children: "По контекстам"
                }), (0, r.jsx)("div", {
                    className: "max-h-72 overflow-auto",
                    children: (0, r.jsxs)("table", {
                        className: "w-full text-xs sm:text-sm",
                        children: [(0, r.jsx)("thead", {
                            className: "bg-gray-950 text-gray-500",
                            children: (0, r.jsxs)("tr", {
                                children: [(0, r.jsx)("th", {
                                    className: "text-left px-3 py-2 font-medium",
                                    children: "Контекст"
                                }), (0, r.jsx)("th", {
                                    className: "text-right px-3 py-2 font-medium",
                                    children: "Запросы"
                                }), (0, r.jsx)("th", {
                                    className: "text-right px-3 py-2 font-medium",
                                    children: "Токены"
                                }), (0, r.jsx)("th", {
                                    className: "text-right px-3 py-2 font-medium",
                                    children: "$"
                                })]
                            })
                        }), (0, r.jsx)("tbody", {
                            children: (null !== (o = null == k ? void 0 : k.byContext) && void 0 !== o ? o : []).map(e => (0, r.jsxs)("tr", {
                                className: "border-t border-gray-800/70",
                                children: [(0, r.jsxs)("td", {
                                    className: "px-3 py-2 text-gray-300",
                                    title: e.context,
                                    children: [v(e.context), (0, r.jsx)("span", {
                                        className: "block text-[10px] text-gray-500 font-mono",
                                        children: e.context
                                    })]
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 text-right",
                                    children: e.requests.toLocaleString("ru-RU")
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 text-right",
                                    children: e.totalTokens.toLocaleString("ru-RU")
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 text-right text-emerald-300",
                                    children: eo(e.estimatedCostUsd)
                                })]
                            }, e.context))
                        })]
                    })
                })]
            }), (0, r.jsxs)("section", {
                className: "bg-gray-900 rounded-xl border border-gray-800 overflow-hidden",
                children: [(0, r.jsx)("div", {
                    className: "px-4 py-3 border-b border-gray-800 text-sm text-gray-300",
                    children: "По дням"
                }), (0, r.jsx)("div", {
                    className: "max-h-72 overflow-auto",
                    children: (0, r.jsxs)("table", {
                        className: "w-full text-xs sm:text-sm",
                        children: [(0, r.jsx)("thead", {
                            className: "bg-gray-950 text-gray-500",
                            children: (0, r.jsxs)("tr", {
                                children: [(0, r.jsx)("th", {
                                    className: "text-left px-3 py-2 font-medium",
                                    children: "Дата"
                                }), (0, r.jsx)("th", {
                                    className: "text-right px-3 py-2 font-medium",
                                    children: "Запросы"
                                }), (0, r.jsx)("th", {
                                    className: "text-right px-3 py-2 font-medium",
                                    children: "Токены"
                                }), (0, r.jsx)("th", {
                                    className: "text-right px-3 py-2 font-medium",
                                    children: "$"
                                })]
                            })
                        }), (0, r.jsx)("tbody", {
                            children: (null !== (d = null == k ? void 0 : k.byDay) && void 0 !== d ? d : []).map(e => (0, r.jsxs)("tr", {
                                className: "border-t border-gray-800/70",
                                children: [(0, r.jsx)("td", {
                                    className: "px-3 py-2 text-gray-300",
                                    children: es(e.date)
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 text-right",
                                    children: e.requests.toLocaleString("ru-RU")
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 text-right",
                                    children: e.totalTokens.toLocaleString("ru-RU")
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 text-right text-emerald-300",
                                    children: eo(e.estimatedCostUsd)
                                })]
                            }, e.date))
                        })]
                    })
                })]
            })]
        }), (0, r.jsxs)("section", {
            className: "bg-gray-900 rounded-xl border border-gray-800 overflow-hidden",
            children: [(0, r.jsx)("div", {
                className: "px-4 py-3 border-b border-gray-800 text-sm text-gray-300",
                children: "Последние вызовы (до 200)"
            }), (0, r.jsx)("div", {
                className: "max-h-[420px] overflow-auto",
                children: (0, r.jsxs)("table", {
                    className: "w-full text-xs sm:text-sm",
                    children: [(0, r.jsx)("thead", {
                        className: "bg-gray-950 text-gray-500 sticky top-0",
                        children: (0, r.jsxs)("tr", {
                            children: [(0, r.jsx)("th", {
                                className: "text-left px-3 py-2 font-medium",
                                children: "Время"
                            }), (0, r.jsx)("th", {
                                className: "text-left px-3 py-2 font-medium",
                                children: "Provider"
                            }), (0, r.jsx)("th", {
                                className: "text-left px-3 py-2 font-medium",
                                children: "Model"
                            }), (0, r.jsx)("th", {
                                className: "text-left px-3 py-2 font-medium",
                                children: "Context"
                            }), (0, r.jsx)("th", {
                                className: "text-right px-3 py-2 font-medium",
                                children: "Токены"
                            }), (0, r.jsx)("th", {
                                className: "text-right px-3 py-2 font-medium",
                                children: "$"
                            }), (0, r.jsx)("th", {
                                className: "text-left px-3 py-2 font-medium",
                                children: "Статус"
                            })]
                        })
                    }), (0, r.jsx)("tbody", {
                        children: (null !== (c = null == k ? void 0 : k.recent) && void 0 !== c ? c : []).map((e, t) => {
                            var a, s, l, n, i, o;
                            return (0, r.jsxs)("tr", {
                                className: "border-t border-gray-800/70",
                                children: [(0, r.jsx)("td", {
                                    className: "px-3 py-2 text-gray-400 whitespace-nowrap",
                                    children: new Date(e.created_at).toLocaleString("ru-RU")
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2",
                                    children: e.provider
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 text-gray-400",
                                    children: null !== (a = e.model) && void 0 !== a ? a : "—"
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 text-gray-400",
                                    title: null !== (s = e.context) && void 0 !== s ? s : void 0,
                                    children: v(e.context)
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 text-right",
                                    children: Number(null !== (l = e.total_tokens) && void 0 !== l ? l : 0).toLocaleString("ru-RU")
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 text-right text-emerald-300",
                                    children: eo(null !== (n = e.estimated_cost_usd) && void 0 !== n ? n : 0)
                                }), (0, r.jsx)("td", {
                                    className: "px-3 py-2 ".concat("ok" === String(null !== (i = e.status) && void 0 !== i ? i : "ok").toLowerCase() ? "text-emerald-300" : "text-amber-300"),
                                    children: null !== (o = e.status) && void 0 !== o ? o : "ok"
                                })]
                            }, "".concat(e.created_at, "-").concat(t))
                        })
                    })]
                })
            })]
        })]
    })
}
let ew = "admin_marketing_exclude_ips",
    ek = "admin_demo_exclude_emails",
    eC = "admin_demo_hide_checks";

function eS() {
    var e, t, a, l;
    let [n, i] = (0, s.useState)(null), [o, d] = (0, s.useState)(!0), [c, x] = (0, s.useState)(!1), [m, u] = (0, s.useState)(null), [p, g] = (0, s.useState)(!0), [h, y] = (0, s.useState)(""), [b, v] = (0, s.useState)(null), j = (0, s.useCallback)(async e => {
        let t = (null == e ? void 0 : e.silent) === !0;
        u(null), t ? x(!0) : d(!0);
        try {
            let e = await fetch("/api/demo-sandboxes?_=".concat(Date.now()), {
                cache: "no-store"
            });
            if (!e.ok) throw Error(await e.text());
            i(await e.json()), v(new Date)
        } catch (e) {
            u(e instanceof Error ? e.message : "load_failed")
        } finally {
            d(!1), x(!1)
        }
    }, []);
    (0, s.useEffect)(() => {
        j()
    }, [j]), (0, s.useEffect)(() => {
        let e = window.setInterval(() => {
            "visible" === document.visibilityState && j({
                silent: !0
            })
        }, 3e4);
        return () => window.clearInterval(e)
    }, [j]), (0, s.useEffect)(() => {
        try {
            let e = localStorage.getItem(eC);
            "0" === e && g(!1);
            let t = localStorage.getItem(ek);
            (null == t ? void 0 : t.trim()) && y(t.trim())
        } catch (e) {}
    }, []), (0, s.useEffect)(() => {
        try {
            localStorage.setItem(eC, p ? "1" : "0"), localStorage.setItem(ek, h.trim())
        } catch (e) {}
    }, [p, h]);
    let N = (0, s.useMemo)(() => (function(e) {
            let t = new Set;
            for (let a of (null != e ? e : "").split(",")) {
                let e = a.trim().toLowerCase();
                e.includes("@") && t.add(e)
            }
            return t
        })(h), [h]),
        f = (0, s.useCallback)(e => {
            let t = e.trim().toLowerCase();
            t.includes("@") && (y(e => {
                let a = e.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
                return a.includes(t) ? e : [...a, t].join(", ")
            }), g(!0))
        }, []),
        _ = (0, s.useMemo)(() => {
            var e;
            let t = null !== (e = null == n ? void 0 : n.rows) && void 0 !== e ? e : [];
            return p ? t.filter(e => !q(e.email, N)) : t
        }, [null == n ? void 0 : n.rows, p, N]),
        w = (null !== (a = null == n ? void 0 : null === (e = n.rows) || void 0 === e ? void 0 : e.length) && void 0 !== a ? a : 0) - _.length,
        k = function(e) {
            let t = Date.now();
            return {
                total: e.length,
                active: e.filter(e => "active" === e.status && new Date(e.expires_at).getTime() > t).length,
                expired: e.filter(e => "expired" === e.status || new Date(e.expires_at).getTime() <= t).length,
                converted: e.filter(e => !0 === e.registered || null != e.converted_at).length,
                notConvertedExpired: e.filter(e => !0 !== e.registered && null == e.converted_at && ("expired" === e.status || new Date(e.expires_at).getTime() <= t)).length
            }
        }(_);
    return (0, r.jsxs)("div", {
        className: "space-y-6",
        children: [(0, r.jsxs)("div", {
            className: "flex items-center justify-between gap-3 flex-wrap",
            children: [(0, r.jsxs)("div", {
                children: [(0, r.jsx)("h2", {
                    className: "text-lg font-semibold",
                    children: "Демо"
                }), (0, r.jsx)("p", {
                    className: "text-sm text-gray-500 mt-1 max-w-3xl",
                    children: "Отдельный учёт песочниц: почта, с которой запросили демо, был ли вход по ссылке и зарегистрировали ли потом свой кабинет. В \xabВитрину\xbb эти заходы не попадают."
                })]
            }), (0, r.jsxs)("div", {
                className: "flex flex-col items-end gap-1",
                children: [(0, r.jsx)("button", {
                    type: "button",
                    onClick: () => void j(),
                    disabled: o || c,
                    className: "text-sm px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50",
                    children: o || c ? "Обновление…" : "Обновить"
                }), b ? (0, r.jsxs)("span", {
                    className: "text-xs text-gray-500",
                    children: ["Обновлено: ", b.toLocaleTimeString("ru-RU")]
                }) : null]
            })]
        }), (0, r.jsxs)("div", {
            className: "flex flex-wrap items-end gap-4 border border-gray-800 rounded-lg p-3",
            children: [(0, r.jsxs)("label", {
                className: "text-sm text-gray-400 flex items-center gap-2",
                children: [(0, r.jsx)("input", {
                    type: "checkbox",
                    checked: p,
                    onChange: e => g(e.target.checked),
                    className: "rounded border-gray-600"
                }), "Скрыть проверки"]
            }), (0, r.jsxs)("div", {
                className: "flex flex-col gap-1 min-w-[16rem] flex-1",
                children: [(0, r.jsx)("label", {
                    className: "text-xs text-gray-500",
                    children: "Ещё скрыть почты (ваши тесты)"
                }), (0, r.jsx)("input", {
                    type: "text",
                    value: h,
                    onChange: e => y(e.target.value),
                    placeholder: "you@gmail.com, qa@…",
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono",
                    title: "Через запятую. Клик \xabскрыть\xbb в таблице добавит почту сюда."
                })]
            }), w > 0 ? (0, r.jsxs)("p", {
                className: "text-xs text-gray-500",
                children: ["Скрыто проверок: ", w]
            }) : null]
        }), m && (0, r.jsx)("p", {
            className: "text-red-400 text-sm",
            children: m
        }), (0, r.jsxs)("div", {
            className: "grid grid-cols-2 sm:grid-cols-5 gap-3",
            children: [(0, r.jsx)(eP, {
                label: "Всего демо",
                value: n ? k.total : "—"
            }), (0, r.jsx)(eP, {
                label: "Идут сейчас",
                value: n ? k.active : "—"
            }), (0, r.jsx)(eP, {
                label: "Срок вышел",
                value: n ? k.expired : "—"
            }), (0, r.jsx)(eP, {
                label: "Потом зарегистрировались",
                value: n ? k.converted : "—"
            }), (0, r.jsx)(eP, {
                label: "Не зарегистрировались",
                value: n ? k.notConvertedExpired : "—"
            })]
        }), o && !n ? (0, r.jsx)("p", {
            className: "text-gray-500 text-sm",
            children: "Загрузка…"
        }) : (0, r.jsx)("div", {
            className: "overflow-x-auto border border-gray-800 rounded-lg",
            children: (0, r.jsxs)("table", {
                className: "w-full text-sm",
                children: [(0, r.jsx)("thead", {
                    className: "bg-gray-900 text-gray-400 text-left",
                    children: (0, r.jsxs)("tr", {
                        children: [(0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Почта входа в демо"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Язык"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Запросили"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Вход по ссылке"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "До"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Период"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Тур"
                        }), (0, r.jsx)("th", {
                            className: "px-3 py-2",
                            children: "Регистрация кабинета"
                        })]
                    })
                }), (0, r.jsxs)("tbody", {
                    children: [_.map(e => {
                        let t = "expired" === e.status || new Date(e.expires_at).getTime() <= Date.now(),
                            a = !0 === e.registered || null != e.converted_at,
                            s = q(e.email, N);
                        return (0, r.jsxs)("tr", {
                            className: "border-t border-gray-800",
                            children: [(0, r.jsxs)("td", {
                                className: "px-3 py-2 text-gray-100",
                                children: [(0, r.jsx)("div", {
                                    children: e.email
                                }), s ? (0, r.jsx)("span", {
                                    className: "text-[10px] text-amber-400/90",
                                    children: "проверка"
                                }) : null, (0, r.jsx)("button", {
                                    type: "button",
                                    onClick: () => f(e.email),
                                    className: "block text-[10px] text-indigo-400 hover:text-indigo-300 mt-0.5",
                                    children: "скрыть"
                                })]
                            }), (0, r.jsx)("td", {
                                className: "px-3 py-2",
                                children: e.locale
                            }), (0, r.jsx)("td", {
                                className: "px-3 py-2 text-gray-400 whitespace-nowrap",
                                children: new Date(e.created_at).toLocaleString("ru-RU")
                            }), (0, r.jsx)("td", {
                                className: "px-3 py-2 whitespace-nowrap",
                                children: e.first_entered_at ? (0, r.jsx)("span", {
                                    className: "text-emerald-400",
                                    children: new Date(e.first_entered_at).toLocaleString("ru-RU")
                                }) : (0, r.jsx)("span", {
                                    className: "text-gray-500",
                                    children: "ещё не заходили"
                                })
                            }), (0, r.jsx)("td", {
                                className: "px-3 py-2 text-gray-400 whitespace-nowrap",
                                children: new Date(e.expires_at).toLocaleString("ru-RU")
                            }), (0, r.jsx)("td", {
                                className: "px-3 py-2",
                                children: t ? (0, r.jsx)("span", {
                                    className: "text-amber-400",
                                    children: "завершён"
                                }) : (0, r.jsx)("span", {
                                    className: "text-emerald-400",
                                    children: "идёт"
                                })
                            }), (0, r.jsx)("td", {
                                className: "px-3 py-2 text-gray-400",
                                children: e.tour_completed_at ? "готово" : "шаг ".concat(e.tour_step)
                            }), (0, r.jsx)("td", {
                                className: "px-3 py-2",
                                children: a ? (0, r.jsxs)("span", {
                                    className: "text-emerald-400",
                                    children: ["да", e.converted_at ? " \xb7 ".concat(new Date(e.converted_at).toLocaleString("ru-RU")) : ""]
                                }) : (0, r.jsx)("span", {
                                    className: "text-gray-500",
                                    children: "нет"
                                })
                            })]
                        }, e.id)
                    }), 0 === _.length && (0, r.jsx)("tr", {
                        children: (0, r.jsx)("td", {
                            colSpan: 8,
                            className: "px-3 py-6 text-center text-gray-500",
                            children: (null !== (l = null == n ? void 0 : null === (t = n.rows) || void 0 === t ? void 0 : t.length) && void 0 !== l ? l : 0) === 0 ? "Пока никто не запрашивал демо" : "Сейчас видны только проверки. Снимите \xabСкрыть проверки\xbb, чтобы увидеть все строки."
                        })
                    })]
                })]
            })
        })]
    })
}

function eL() {
    var e, t, a, l, n, i, o, d, c, x, m, u, p, g, h, y, b;
    let [v, j] = (0, s.useState)(() => ed(-30)), [f, k] = (0, s.useState)(() => ed(0)), [L, T] = (0, s.useState)(""), [I, A] = (0, s.useState)("all"), [F, M] = (0, s.useState)(!1), [q, H] = (0, s.useState)(!1), [W, J] = (0, s.useState)(""), [z, G] = (0, s.useState)("time_desc"), [K, V] = (0, s.useState)(null), [B, Z] = (0, s.useState)(!0), [$, Y] = (0, s.useState)(!1), [Q, X] = (0, s.useState)(null), [ee, et] = (0, s.useState)(null), ea = D();
    (0, s.useEffect)(() => {
        try {
            let e = localStorage.getItem(ew);
            (null == e ? void 0 : e.trim()) && J(e.trim())
        } catch (e) {}
    }, []), (0, s.useEffect)(() => {
        try {
            localStorage.setItem(ew, W.trim())
        } catch (e) {}
    }, [W]);
    let er = (0, s.useCallback)(e => {
            let t = e.trim();
            t && (J(e => {
                let a = e.split(",").map(e => e.trim()).filter(Boolean);
                return a.includes(t) ? e : [...a, t].join(", ")
            }), H(!0))
        }, []),
        el = (0, s.useMemo)(() => {
            var e;
            let t = [...null !== (e = null == K ? void 0 : K.recent) && void 0 !== e ? e : []];
            return t.sort((e, t) => {
                switch (z) {
                    case "time_asc":
                        return e.created_at.localeCompare(t.created_at);
                    case "path_asc":
                        return e.path.localeCompare(t.path) || t.created_at.localeCompare(e.created_at);
                    case "host_asc":
                        var a, r;
                        return (null !== (a = e.client_host) && void 0 !== a ? a : "").localeCompare(null !== (r = t.client_host) && void 0 !== r ? r : "") || t.created_at.localeCompare(e.created_at);
                    case "event_asc":
                        return E(e.event_type).localeCompare(E(t.event_type), "ru") || t.created_at.localeCompare(e.created_at);
                    default:
                        return t.created_at.localeCompare(e.created_at)
                }
            }), t
        }, [null == K ? void 0 : K.recent, z]),
        en = e => {
            j(ed(-e)), k(ed(0))
        },
        ei = (0, s.useCallback)(async e => {
            if (!v || !f) {
                et("Укажите даты \xabС\xbb и \xabПо\xbb");
                return
            }
            let t = ed(0),
                a = f;
            a < t && (a = t, k(t));
            let r = (null == e ? void 0 : e.silent) === !0;
            r ? Y(!0) : Z(!0), et(null);
            try {
                let e = new URLSearchParams;
                e.set("from", v), e.set("to", a), L.trim() && e.set("path", L.trim()), e.set("host", I.trim() || "all"), F && e.set("excludeBots", "1"), q && W.trim() && e.set("excludeIps", W.trim()), e.set("limit", "2000");
                let t = await fetch("/api/marketing-visits?".concat(e.toString()), {
                        cache: "no-store"
                    }),
                    s = await t.json();
                t.ok ? (V(s), X(new Date)) : (et("string" == typeof(null == s ? void 0 : s.error) ? s.error : "Ошибка (".concat(t.status, ")")), r || V(null))
            } finally {
                r ? Y(!1) : Z(!1)
            }
        }, [v, f, L, I, F, q, W]);
    (0, s.useEffect)(() => {
        ei()
    }, [ei]), (0, s.useEffect)(() => {
        let e = window.setInterval(() => {
                "visible" === document.visibilityState && ei({
                    silent: !0
                })
            }, 3e4),
            t = () => {
                "visible" === document.visibilityState && ei({
                    silent: !0
                })
            };
        return document.addEventListener("visibilitychange", t), () => {
            window.clearInterval(e), document.removeEventListener("visibilitychange", t)
        }
    }, [ei]);
    let eo = (null == K ? void 0 : null === (e = K.meta) || void 0 === e ? void 0 : e.rangeFrom) && (null == K ? void 0 : null === (t = K.meta) || void 0 === t ? void 0 : t.rangeTo) ? "".concat(es(K.meta.rangeFrom), " — ").concat(es(K.meta.rangeTo)) : (null == K ? void 0 : null === (a = K.meta) || void 0 === a ? void 0 : a.fromIso) ? "с ".concat(es(K.meta.fromIso)) : null;
    return (0, r.jsxs)("div", {
        className: "space-y-6 pb-12",
        children: [(0, r.jsxs)("p", {
            className: "text-sm text-gray-400",
            children: ["Данные в ", (0, r.jsx)("strong", {
                className: "text-gray-300",
                children: "Supabase"
            }), " (", (0, r.jsx)("code", {
                className: "text-gray-500",
                children: "marketing_visits"
            }), "), автообновление каждые 30 сек.", (0, r.jsx)("strong", {
                className: "text-gray-300",
                children: " Анонимные визиты"
            }), " (язык, промо, регистрация) и", " ", (0, r.jsx)("strong", {
                className: "text-gray-300",
                children: "входы сотрудников"
            }), " (", (0, r.jsx)("code", {
                className: "text-gray-500",
                children: "app_login"
            }), " — пароль,", " ", (0, r.jsx)("code", {
                className: "text-gray-500",
                children: "app_open"
            }), " — уже залогинен, открыл /home). \xabСкрыть мои IP\xbb работает только при ", (0, r.jsx)("strong", {
                className: "text-gray-300",
                children: "включённой"
            }), " ", "галочке; IP в поле — через запятую. Колонка \xabПоследний вход\xbb по заведениям — вкладка", " ", (0, r.jsx)("strong", {
                className: "text-gray-300",
                children: "Заведения"
            }), "."]
        }), (0, r.jsxs)("div", {
            className: "bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-wrap items-end gap-3",
            children: [(0, r.jsxs)("div", {
                className: "flex items-end gap-2",
                children: [(0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        children: "С"
                    }), (0, r.jsx)("input", {
                        type: "date",
                        value: v,
                        onChange: e => j(e.target.value),
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    })]
                }), (0, r.jsxs)("div", {
                    className: "flex flex-col gap-1",
                    children: [(0, r.jsx)("label", {
                        className: "text-xs text-gray-500",
                        children: "По"
                    }), (0, r.jsx)("input", {
                        type: "date",
                        value: f,
                        onChange: e => k(e.target.value),
                        className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    })]
                })]
            }), (0, r.jsxs)("div", {
                className: "flex flex-col gap-1",
                children: [(0, r.jsx)("label", {
                    className: "text-xs text-gray-500",
                    children: "Быстрый период"
                }), (0, r.jsxs)("select", {
                    defaultValue: "",
                    onChange: e => {
                        let t = Number(e.target.value);
                        t && (en(t), e.target.value = "")
                    },
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm min-w-[10rem]",
                    children: [(0, r.jsx)("option", {
                        value: "",
                        children: "выбрать…"
                    }), (0, r.jsx)("option", {
                        value: 7,
                        children: "последние 7 дней"
                    }), (0, r.jsx)("option", {
                        value: 14,
                        children: "последние 14 дней"
                    }), (0, r.jsx)("option", {
                        value: 30,
                        children: "последние 30 дней"
                    }), (0, r.jsx)("option", {
                        value: 90,
                        children: "последние 90 дней"
                    })]
                })]
            }), (0, r.jsxs)("div", {
                className: "flex flex-col gap-1",
                children: [(0, r.jsx)("label", {
                    className: "text-xs text-gray-500",
                    children: "Страница входа"
                }), (0, r.jsxs)("select", {
                    value: L,
                    onChange: e => T(e.target.value),
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm min-w-[10rem]",
                    children: [(0, r.jsx)("option", {
                        value: "",
                        children: "все страницы"
                    }), (0, r.jsx)("option", {
                        value: "/login",
                        children: "Вход /login"
                    }), (0, r.jsx)("option", {
                        value: "/promo",
                        children: "Промо /promo"
                    }), (0, r.jsx)("option", {
                        value: "/register-company",
                        children: "Регистрация /register-company"
                    }), (0, r.jsx)("option", {
                        value: "/register",
                        children: "Регистрация сотрудника"
                    }), (0, r.jsx)("option", {
                        value: "/owner-registration",
                        children: "Регистрация владельца"
                    })]
                })]
            }), (0, r.jsxs)("div", {
                className: "flex flex-col gap-1",
                children: [(0, r.jsx)("label", {
                    className: "text-xs text-gray-500",
                    children: "Сортировка"
                }), (0, r.jsxs)("select", {
                    value: z,
                    onChange: e => G(e.target.value),
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm min-w-[10rem]",
                    children: [(0, r.jsx)("option", {
                        value: "time_desc",
                        children: "время ↓ новые"
                    }), (0, r.jsx)("option", {
                        value: "time_asc",
                        children: "время ↑ старые"
                    }), (0, r.jsx)("option", {
                        value: "path_asc",
                        children: "страница A→Z"
                    }), (0, r.jsx)("option", {
                        value: "host_asc",
                        children: "хост A→Z"
                    }), (0, r.jsx)("option", {
                        value: "event_asc",
                        children: "событие A→Z"
                    })]
                })]
            }), (0, r.jsx)("div", {
                className: "flex flex-col gap-1 min-w-[12rem]",
                children: (0, r.jsxs)("label", {
                    className: "text-xs text-gray-500 flex items-center gap-2",
                    children: [(0, r.jsx)("input", {
                        type: "checkbox",
                        checked: F,
                        onChange: e => M(e.target.checked),
                        className: "rounded border-gray-600"
                    }), "Скрыть ботов"]
                })
            }), (0, r.jsxs)("div", {
                className: "flex flex-col gap-1 min-w-[12rem]",
                children: [(0, r.jsxs)("label", {
                    className: "text-xs text-gray-500 flex items-center gap-2",
                    children: [(0, r.jsx)("input", {
                        type: "checkbox",
                        checked: q,
                        onChange: e => H(e.target.checked),
                        className: "rounded border-gray-600"
                    }), "Скрыть мои IP"]
                }), (0, r.jsx)("input", {
                    type: "text",
                    value: W,
                    onChange: e => J(e.target.value),
                    placeholder: "1.2.3.4, 5.6.7.8",
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono",
                    title: "Через запятую. Клик \xabскрыть\xbb в таблице добавит IP сюда."
                })]
            }), (0, r.jsxs)("div", {
                className: "flex flex-col gap-1",
                children: [(0, r.jsx)("label", {
                    className: "text-xs text-gray-500",
                    children: "Сайт (хост)"
                }), (0, r.jsx)("select", {
                    value: I,
                    onChange: e => A(e.target.value),
                    className: "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm min-w-[11rem]",
                    children: N.map(e => (0, r.jsx)("option", {
                        value: e.value,
                        children: e.label
                    }, e.value))
                })]
            }), (0, r.jsx)("button", {
                type: "button",
                onClick: () => void ei(),
                disabled: B,
                className: "bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium",
                children: B ? "Обновление…" : $ ? "Обновление…" : "Обновить"
            }), (null == K ? void 0 : K.meta) ? (0, r.jsxs)("div", {
                className: "text-xs text-gray-500 ml-auto text-right",
                children: [(0, r.jsxs)("div", {
                    children: ["Записей: ", K.meta.sampleSize]
                }), eo ? (0, r.jsx)("div", {
                    className: "mt-0.5",
                    children: eo
                }) : null, Q ? (0, r.jsxs)("div", {
                    className: "mt-0.5",
                    title: "Автообновление каждые 30 сек",
                    children: ["Обновлено: ", Q.toLocaleTimeString("ru-RU"), $ ? " …" : null]
                }) : null]
            }) : null]
        }), ee ? (0, r.jsx)("div", {
            className: "bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 text-amber-200 text-sm",
            children: ee
        }) : null, K ? (0, r.jsxs)(r.Fragment, {
            children: [(0, r.jsx)("div", {
                className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
                children: S.map(e => {
                    var t;
                    return (0, r.jsx)(eP, {
                        label: e.label,
                        value: function(e, t) {
                            var a, r;
                            let s = S.find(e => e.id === t);
                            if (!s) return 0;
                            let l = new Map(e.map(e => [e.event_type, e.count])),
                                n = null !== (a = l.get(s.id)) && void 0 !== a ? a : 0;
                            for (let e of s.legacyTypes) n += null !== (r = l.get(e)) && void 0 !== r ? r : 0;
                            return n
                        }(null !== (t = K.byEventType) && void 0 !== t ? t : [], e.id)
                    }, e.id)
                })
            }), (null !== (m = null === (l = K.byVisitorKind) || void 0 === l ? void 0 : l.length) && void 0 !== m ? m : 0) > 0 ? (0, r.jsx)("div", {
                className: "flex flex-wrap gap-2 text-xs",
                children: (null !== (u = K.byVisitorKind) && void 0 !== u ? u : []).map(e => (0, r.jsxs)("span", {
                    className: "rounded-lg border px-2 py-1 ".concat("human" === e.visitor_kind ? "bg-emerald-950/50 border-emerald-800 text-emerald-200" : "bot" === e.visitor_kind ? "bg-rose-950/40 border-rose-800 text-rose-200" : "bg-gray-800 border-gray-700 text-gray-300"),
                    children: [P(e.visitor_kind), ":", " ", (0, r.jsx)("strong", {
                        className: "text-white",
                        children: e.count
                    })]
                }, e.visitor_kind))
            }) : null]
        }) : null, (0, r.jsxs)("section", {
            children: [(0, r.jsx)("h2", {
                className: "text-base font-semibold text-white mb-2",
                children: "Последние визиты"
            }), (0, r.jsx)("div", {
                className: "md:hidden space-y-2",
                children: 0 === el.length ? (0, r.jsx)("div", {
                    className: "bg-gray-900 rounded-xl border border-gray-800 px-4 py-6 text-center text-gray-500 text-sm",
                    children: B ? "Загрузка…" : "Нет записей за период"
                }) : el.map(e => {
                    var t;
                    return (0, r.jsxs)("div", {
                        className: "bg-gray-900 rounded-xl border border-gray-800 p-3 space-y-2 text-xs",
                        children: [(0, r.jsxs)("div", {
                            className: "flex items-start justify-between gap-2",
                            children: [(0, r.jsxs)("div", {
                                className: "min-w-0",
                                children: [(0, r.jsx)("div", {
                                    className: "text-gray-300 font-mono text-[11px]",
                                    children: R(e.created_at, e.timezone)
                                }), (0, r.jsx)("div", {
                                    className: "text-[10px] text-gray-500 mt-0.5",
                                    children: U(e.created_at, ea)
                                })]
                            }), (0, r.jsx)("span", {
                                className: "text-gray-100 font-medium shrink-0 text-right",
                                children: E(e.event_type)
                            })]
                        }), (0, r.jsxs)("div", {
                            className: "text-gray-400 leading-snug",
                            title: O(e),
                            children: [O(e), (null === (t = e.ip) || void 0 === t ? void 0 : t.trim()) ? (0, r.jsxs)("button", {
                                type: "button",
                                onClick: () => er(e.ip.trim()),
                                className: "block text-[10px] text-indigo-400 hover:text-indigo-300 mt-0.5",
                                title: "Добавить IP в \xabСкрыть мои IP\xbb",
                                children: ["скрыть ", e.ip.trim()]
                            }) : null]
                        }), (0, r.jsxs)("div", {
                            className: "grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]",
                            children: [(0, r.jsxs)("div", {
                                children: [(0, r.jsx)("span", {
                                    className: "text-gray-600",
                                    children: "Посетитель: "
                                }), (0, r.jsx)("span", {
                                    className: "human" === e.visitor_kind ? "text-emerald-300" : "bot" === e.visitor_kind ? "text-rose-300" : "text-amber-200",
                                    children: P(e.visitor_kind)
                                })]
                            }), (0, r.jsxs)("div", {
                                children: [(0, r.jsx)("span", {
                                    className: "text-gray-600",
                                    children: "Страница: "
                                }), (0, r.jsx)("span", {
                                    className: "text-gray-200",
                                    children: w(e.path)
                                })]
                            }), (0, r.jsxs)("div", {
                                children: [(0, r.jsx)("span", {
                                    className: "text-gray-600",
                                    children: "Язык: "
                                }), (0, r.jsx)("span", {
                                    children: C(e.language_code)
                                })]
                            }), (0, r.jsxs)("div", {
                                children: [(0, r.jsx)("span", {
                                    className: "text-gray-600",
                                    children: "Экран: "
                                }), (0, r.jsx)("span", {
                                    className: "text-gray-400",
                                    children: null != e.viewport_width && null != e.viewport_height ? "".concat(e.viewport_width, "\xd7").concat(e.viewport_height) : "—"
                                })]
                            }), (0, r.jsxs)("div", {
                                className: "col-span-2",
                                children: [(0, r.jsx)("span", {
                                    className: "text-gray-600",
                                    children: "Хост: "
                                }), (0, r.jsx)("span", {
                                    className: "text-gray-500",
                                    children: _(e.client_host)
                                })]
                            })]
                        })]
                    }, e.id)
                })
            }), (0, r.jsx)("div", {
                className: "hidden md:block bg-gray-900 rounded-xl border border-gray-800 overflow-hidden",
                children: (0, r.jsx)("div", {
                    className: "overflow-x-auto",
                    children: (0, r.jsxs)("table", {
                        className: "w-full min-w-[56rem] text-xs",
                        children: [(0, r.jsx)("thead", {
                            children: (0, r.jsxs)("tr", {
                                className: "border-b border-gray-800 text-gray-500 text-left",
                                children: [(0, r.jsx)("th", {
                                    className: "px-3 py-2 whitespace-nowrap w-[9rem]",
                                    children: "Время"
                                }), (0, r.jsx)("th", {
                                    className: "px-3 py-2 w-[11rem]",
                                    children: "Место"
                                }), (0, r.jsx)("th", {
                                    className: "px-3 py-2 whitespace-nowrap w-[8rem]",
                                    children: "Событие"
                                }), (0, r.jsx)("th", {
                                    className: "px-3 py-2 whitespace-nowrap w-[6rem]",
                                    children: "Посетитель"
                                }), (0, r.jsx)("th", {
                                    className: "px-3 py-2 whitespace-nowrap w-[6rem]",
                                    children: "Страница"
                                }), (0, r.jsx)("th", {
                                    className: "px-3 py-2 whitespace-nowrap w-[5rem]",
                                    children: "Язык"
                                }), (0, r.jsx)("th", {
                                    className: "px-3 py-2 whitespace-nowrap w-[5rem]",
                                    children: "Экран"
                                }), (0, r.jsx)("th", {
                                    className: "px-3 py-2 whitespace-nowrap w-[6rem]",
                                    children: "Хост"
                                })]
                            })
                        }), (0, r.jsx)("tbody", {
                            children: 0 === el.length ? (0, r.jsx)("tr", {
                                children: (0, r.jsx)("td", {
                                    colSpan: 8,
                                    className: "px-3 py-6 text-center text-gray-500",
                                    children: B ? "Загрузка…" : "Нет записей за период"
                                })
                            }) : el.map(e => {
                                var t, a;
                                return (0, r.jsxs)("tr", {
                                    className: "border-t border-gray-800/70 align-top",
                                    children: [(0, r.jsxs)("td", {
                                        className: "px-3 py-2 text-gray-300 whitespace-nowrap",
                                        children: [(0, r.jsx)("div", {
                                            children: R(e.created_at, e.timezone)
                                        }), (0, r.jsx)("div", {
                                            className: "text-[10px] text-gray-500 leading-snug mt-0.5",
                                            children: U(e.created_at, ea)
                                        })]
                                    }), (0, r.jsxs)("td", {
                                        className: "px-3 py-2 text-gray-400 min-w-[9rem] max-w-[14rem]",
                                        title: O(e),
                                        children: [(0, r.jsx)("div", {
                                            className: "break-words leading-snug",
                                            children: O(e)
                                        }), (null === (t = e.ip) || void 0 === t ? void 0 : t.trim()) ? (0, r.jsxs)("button", {
                                            type: "button",
                                            onClick: () => er(e.ip.trim()),
                                            className: "text-[10px] text-indigo-400 hover:text-indigo-300 mt-0.5 whitespace-nowrap",
                                            title: "Добавить IP в \xabСкрыть мои IP\xbb",
                                            children: ["скрыть ", e.ip.trim()]
                                        }) : null]
                                    }), (0, r.jsx)("td", {
                                        className: "px-3 py-2 text-gray-100 font-medium whitespace-nowrap",
                                        children: E(e.event_type)
                                    }), (0, r.jsxs)("td", {
                                        className: "px-3 py-2 whitespace-nowrap",
                                        title: null !== (a = e.visitor_hint) && void 0 !== a ? a : void 0,
                                        children: [(0, r.jsx)("span", {
                                            className: "human" === e.visitor_kind ? "text-emerald-300" : "bot" === e.visitor_kind ? "text-rose-300" : "text-amber-200",
                                            children: P(e.visitor_kind)
                                        }), e.visitor_hint ? (0, r.jsx)("span", {
                                            className: "block text-[10px] text-gray-500",
                                            children: e.visitor_hint
                                        }) : null]
                                    }), (0, r.jsx)("td", {
                                        className: "px-3 py-2 text-gray-200 whitespace-nowrap",
                                        children: w(e.path)
                                    }), (0, r.jsx)("td", {
                                        className: "px-3 py-2 whitespace-nowrap",
                                        children: C(e.language_code)
                                    }), (0, r.jsx)("td", {
                                        className: "px-3 py-2 text-gray-400 whitespace-nowrap",
                                        children: null != e.viewport_width && null != e.viewport_height ? "".concat(e.viewport_width, "\xd7").concat(e.viewport_height) : "—"
                                    }), (0, r.jsx)("td", {
                                        className: "px-3 py-2 text-gray-500 whitespace-nowrap",
                                        children: _(e.client_host)
                                    })]
                                }, e.id)
                            })
                        })]
                    })
                })
            }), el.length > 0 ? (0, r.jsx)("div", {
                className: "border-t-2 border-gray-700 px-4 py-4 text-center text-sm text-gray-300 bg-gray-950/60 rounded-b-xl border border-t-0 border-gray-800 md:rounded-t-none md:-mt-px",
                children: (null !== (p = null == K ? void 0 : null === (n = K.meta) || void 0 === n ? void 0 : n.sampleSize) && void 0 !== p ? p : 0) >= (null !== (g = null == K ? void 0 : null === (i = K.meta) || void 0 === i ? void 0 : i.limit) && void 0 !== g ? g : 0) ? (0, r.jsxs)(r.Fragment, {
                    children: ["Показаны первые ", null == K ? void 0 : null === (o = K.meta) || void 0 === o ? void 0 : o.limit, " записей за выбранный период.", (0, r.jsx)("span", {
                        className: "block text-gray-500 text-xs mt-1",
                        children: "Сузьте диапазон дат или уточните фильтр \xabСтраница\xbb."
                    })]
                }) : (0, r.jsxs)(r.Fragment, {
                    children: [(0, r.jsx)("span", {
                        className: "text-gray-200",
                        children: "— Конец списка —"
                    }), (0, r.jsxs)("span", {
                        className: "block text-gray-500 text-xs mt-1",
                        children: [null !== (h = null == K ? void 0 : null === (d = K.meta) || void 0 === d ? void 0 : d.sampleSize) && void 0 !== h ? h : 0, " ", (null !== (y = null == K ? void 0 : null === (c = K.meta) || void 0 === c ? void 0 : c.sampleSize) && void 0 !== y ? y : 0) === 1 ? "запись" : (null !== (b = null == K ? void 0 : null === (x = K.meta) || void 0 === x ? void 0 : x.sampleSize) && void 0 !== b ? b : 0) < 5 ? "записи" : "записей", eo ? " \xb7 ".concat(eo) : ""]
                    })]
                })
            }) : null]
        })]
    })
}

function eT() {
    let [e, t] = (0, s.useState)("all"), [a, l] = (0, s.useState)("all"), [n, o] = (0, s.useState)([]), [c, x] = (0, s.useState)(""), [m, u] = (0, s.useState)(""), [p, g] = (0, s.useState)(""), [h, y] = (0, s.useState)(""), [b, v] = (0, s.useState)(null), [j, N] = (0, s.useState)(!1), [f, _] = (0, s.useState)(!1), [w, k] = (0, s.useState)(null), [C, S] = (0, s.useState)(null);
    async function L() {
        N(!0), k(null), S(null);
        try {
            let t = await fetch("/api/broadcast?".concat((function() {
                    let t = new URLSearchParams;
                    return t.set("userKind", e), t.set("subscriptionMode", a), n.length > 0 && t.set("subscriptionTypes", n.join(",")), c.trim() && t.set("registeredFrom", c.trim()), m.trim() && t.set("registeredTo", m.trim()), t
                })().toString())),
                r = await t.json().catch(() => ({}));
            if (!t.ok) {
                k("string" == typeof(null == r ? void 0 : r.error) ? r.error : "Ошибка (".concat(t.status, ")")), v(null);
                return
            }
            v("number" == typeof(null == r ? void 0 : r.count) ? r.count : null)
        } finally {
            N(!1)
        }
    }
    async function T() {
        let t = p.trim(),
            r = h.trim();
        if (0 === t.length || 0 === r.length) {
            k("Укажите тему и текст письма");
            return
        }
        if ("with_specific_subscriptions" === a && 0 === n.length) {
            k("Выберите хотя бы один тип подписки");
            return
        }
        let s = "owners" === e ? "только собственники" : "line" === e ? "только линейный персонал" : "все пользователи",
            l = "all" === a ? "все" : "without_subscription" === a ? "без подписки" : "with_any_subscription" === a ? "с любой подпиской" : "с выбранными: ".concat(n.map(e => d(e)).join(", "));
        if (window.confirm("Отправить рассылку?\n\nПользователи: ".concat(s, "\nПодписка: ").concat(l, "\nРегистрация: ").concat(c || "любая", " — ").concat(m || "любая", "\nПолучателей (по последнему подсчёту): ").concat(null != b ? b : "—", "\nОт: info@restodocks.com (через Resend)"))) {
            _(!0), k(null), S(null);
            try {
                var i;
                let s = await fetch("/api/broadcast", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            userKind: e,
                            subscriptionMode: a,
                            subscriptionTypes: n,
                            registeredFrom: c.trim() || null,
                            registeredTo: m.trim() || null,
                            subject: t,
                            body: r
                        })
                    }),
                    l = await s.json().catch(() => ({}));
                if (!s.ok) {
                    k("string" == typeof(null == l ? void 0 : l.error) ? l.error : "Ошибка (".concat(s.status, ")"));
                    return
                }
                let o = "number" == typeof(null == l ? void 0 : l.sent) ? l.sent : 0,
                    d = "number" == typeof(null == l ? void 0 : l.failed) ? l.failed : 0,
                    x = "string" == typeof(null == l ? void 0 : l.message) ? l.message : null,
                    u = Array.isArray(null == l ? void 0 : l.errors) && l.errors.length ? "\nДетали: ".concat(l.errors.map(e => String(e)).join("; ")) : "";
                S((null != x ? x : "Отправлено: ".concat(o).concat(d > 0 ? ", не доставлено (ошибки API): ".concat(d) : "", ". В списке было: ").concat(null !== (i = null == l ? void 0 : l.recipientCount) && void 0 !== i ? i : o, ".")) + u)
            } finally {
                _(!1)
            }
        }
    }
    return (0, r.jsxs)("div", {
        className: "space-y-4 max-w-2xl",
        children: [w && (0, r.jsx)("div", {
            className: "p-3 rounded-lg border border-red-800 bg-red-950/40 text-red-200 text-sm",
            children: w
        }), C && !w && (0, r.jsx)("div", {
            className: "p-3 rounded-lg border border-emerald-800/60 bg-emerald-950/30 text-emerald-100 text-sm",
            children: C
        }), (0, r.jsxs)("div", {
            className: "bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4",
            children: [(0, r.jsx)("h2", {
                className: "text-sm font-semibold text-white",
                children: "Рассылка по email"
            }), (0, r.jsxs)("p", {
                className: "text-xs text-gray-500 leading-relaxed",
                children: ["Уходят через Resend с адреса по умолчанию", " ", (0, r.jsx)("span", {
                    className: "text-gray-400",
                    children: "Restodocks <info@restodocks.com>"
                }), " (или", " ", (0, r.jsx)("code", {
                    className: "text-gray-500",
                    children: "RESEND_FROM_EMAIL"
                }), " в окружении). Попадают только учётки с подтверждённым email в Auth и активной записью сотрудника. Очень большие списки могут упираться в таймаут Cloudflare Worker — при необходимости разбивайте рассылку по времени."]
            }), (0, r.jsxs)("div", {
                className: "space-y-2",
                children: [(0, r.jsx)("div", {
                    className: "text-xs text-gray-400",
                    children: "Пользователи"
                }), (0, r.jsxs)("div", {
                    className: "flex flex-wrap gap-4 text-sm",
                    children: [(0, r.jsxs)("label", {
                        className: "flex items-center gap-2 cursor-pointer",
                        children: [(0, r.jsx)("input", {
                            type: "radio",
                            name: "broadcast_audience",
                            checked: "all" === e,
                            onChange: () => {
                                t("all"), v(null)
                            }
                        }), "Все пользователи"]
                    }), (0, r.jsxs)("label", {
                        className: "flex items-center gap-2 cursor-pointer",
                        children: [(0, r.jsx)("input", {
                            type: "radio",
                            name: "broadcast_audience",
                            checked: "owners" === e,
                            onChange: () => {
                                t("owners"), v(null)
                            }
                        }), "Только собственники (роль owner)"]
                    }), (0, r.jsxs)("label", {
                        className: "flex items-center gap-2 cursor-pointer",
                        children: [(0, r.jsx)("input", {
                            type: "radio",
                            name: "broadcast_audience",
                            checked: "line" === e,
                            onChange: () => {
                                t("line"), v(null)
                            }
                        }), "Только линейный персонал"]
                    })]
                })]
            }), (0, r.jsxs)("div", {
                className: "space-y-2",
                children: [(0, r.jsx)("div", {
                    className: "text-xs text-gray-400",
                    children: "Подписка"
                }), (0, r.jsxs)("div", {
                    className: "flex flex-wrap gap-4 text-sm",
                    children: [(0, r.jsxs)("label", {
                        className: "flex items-center gap-2 cursor-pointer",
                        children: [(0, r.jsx)("input", {
                            type: "radio",
                            name: "broadcast_subscription_mode",
                            checked: "all" === a,
                            onChange: () => {
                                l("all"), v(null)
                            }
                        }), "Все"]
                    }), (0, r.jsxs)("label", {
                        className: "flex items-center gap-2 cursor-pointer",
                        children: [(0, r.jsx)("input", {
                            type: "radio",
                            name: "broadcast_subscription_mode",
                            checked: "with_any_subscription" === a,
                            onChange: () => {
                                l("with_any_subscription"), v(null)
                            }
                        }), "С подпиской (любая)"]
                    }), (0, r.jsxs)("label", {
                        className: "flex items-center gap-2 cursor-pointer",
                        children: [(0, r.jsx)("input", {
                            type: "radio",
                            name: "broadcast_subscription_mode",
                            checked: "without_subscription" === a,
                            onChange: () => {
                                l("without_subscription"), v(null)
                            }
                        }), "Без подписки"]
                    }), (0, r.jsxs)("label", {
                        className: "flex items-center gap-2 cursor-pointer",
                        children: [(0, r.jsx)("input", {
                            type: "radio",
                            name: "broadcast_subscription_mode",
                            checked: "with_specific_subscriptions" === a,
                            onChange: () => {
                                l("with_specific_subscriptions"), v(null)
                            }
                        }), "С конкретной подпиской"]
                    })]
                }), "with_specific_subscriptions" === a && (0, r.jsx)("div", {
                    className: "grid sm:grid-cols-3 gap-2 text-sm",
                    children: i.map(e => {
                        let t = n.includes(e);
                        return (0, r.jsxs)("label", {
                            className: "flex items-center gap-2 cursor-pointer",
                            children: [(0, r.jsx)("input", {
                                type: "checkbox",
                                checked: t,
                                onChange: () => {
                                    v(null), o(a => t ? a.filter(t => t !== e) : [...a, e])
                                }
                            }), d(e)]
                        }, e)
                    })
                })]
            }), (0, r.jsxs)("div", {
                className: "space-y-2",
                children: [(0, r.jsx)("div", {
                    className: "text-xs text-gray-400",
                    children: "Диапазон регистрации (дата создания аккаунта)"
                }), (0, r.jsxs)("div", {
                    className: "grid sm:grid-cols-2 gap-2",
                    children: [(0, r.jsx)("input", {
                        type: "date",
                        value: c,
                        onChange: e => {
                            x(e.target.value), v(null)
                        },
                        className: "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                    }), (0, r.jsx)("input", {
                        type: "date",
                        value: m,
                        onChange: e => {
                            u(e.target.value), v(null)
                        },
                        className: "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                    })]
                })]
            }), (0, r.jsxs)("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [(0, r.jsx)("button", {
                    type: "button",
                    onClick: () => void L(),
                    disabled: j,
                    className: "bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm",
                    children: j ? "Подсчёт…" : "Подсчитать получателей"
                }), null !== b && (0, r.jsxs)("span", {
                    className: "text-sm text-gray-400",
                    children: ["В списке: ", (0, r.jsx)("span", {
                        className: "text-white font-medium",
                        children: b
                    })]
                })]
            }), (0, r.jsxs)("div", {
                className: "space-y-1",
                children: [(0, r.jsx)("label", {
                    className: "text-xs text-gray-400",
                    children: "Тема"
                }), (0, r.jsx)("input", {
                    value: p,
                    onChange: e => g(e.target.value),
                    placeholder: "Тема письма",
                    maxLength: 200,
                    className: "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                })]
            }), (0, r.jsxs)("div", {
                className: "space-y-1",
                children: [(0, r.jsx)("label", {
                    className: "text-xs text-gray-400",
                    children: "Текст (простой текст, переносы строк сохраняются)"
                }), (0, r.jsx)("textarea", {
                    value: h,
                    onChange: e => y(e.target.value),
                    placeholder: "Текст рассылки…",
                    rows: 12,
                    className: "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono leading-relaxed"
                })]
            }), (0, r.jsx)("button", {
                type: "button",
                onClick: () => void T(),
                disabled: f || 0 === p.trim().length || 0 === h.trim().length,
                className: "bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm",
                children: f ? "Отправка…" : "Отправить рассылку"
            })]
        })]
    })
}

function eP(e) {
    let {
        label: t,
        value: a,
        dimmed: s
    } = e;
    return (0, r.jsxs)("div", {
        className: "bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-800",
        children: [(0, r.jsx)("div", {
            className: "text-xl sm:text-2xl font-bold ".concat(s ? "text-gray-600" : "text-white"),
            children: a
        }), (0, r.jsx)("div", {
            className: "text-gray-500 text-xs sm:text-sm mt-1",
            children: t
        })]
    })
}

export default function AdminClient({ user }) {
  return ep({ user })
}
