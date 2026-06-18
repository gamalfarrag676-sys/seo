# 🚀 مولد المحتوى الذكي — SEO Content Generator

أداة ذكية SaaS لتوليد محتوى SEO احترافي للمنتجات والمقالات باللغة العربية باستخدام الذكاء الاصطناعي (Gemini / OpenAI).

## ✨ المميزات

### 📝 توليد المحتوى
- **وصف المنتجات** — توليد أوصاف SEO-optimized من صورة المنتج + الكلمة المفتاحية
- **المقالات** — توليد مقالات كاملة متوافقة مع SEO
- **التوليد الجماعي** — توليد محتوى لعدة منتجات دفعة واحدة
- **أسلوبان للكتابة:**
  - 🎓 **خبير (E-E-A-T)** — محتوى عميق يرضي معايير Google
  - 🎯 **بسيط (تسويقي)** — محتوى مباشر يركز على البيع

### 🔍 تحليل SEO (6 محللات!)
| المحلل | الوظيفة |
|--------|---------|
| SEO Analyzer | تحليل 12+ معيار SEO تقني |
| E-E-A-T Analyzer | تحليل معايير Google E-E-A-T |
| Humanity Analyzer | كشف المحتوى الآلي |
| Readability Analyzer | قابلية القراءة (Flesch-Kincaid معدل للعربية) |
| GEO Analyzer | تحسين للذكاء الاصطناعي (GEO) |
| Schema Generator | توليد Structured Data تلقائياً |

### 🔌 التكاملات
- **سلة (Salla)** — تصدير مباشر مع OAuth 2.0
- **ووكومرس (WooCommerce)** — تصدير مع دعم Yoast SEO
- **Gemini AI** — اختيار تلقائي لأفضل موديل
- **OpenAI GPT-4o** — دعم كامل مع تحليل الصور

### 🛠️ أدوات إضافية
- 🔑 بحث الكلمات المفتاحية
- 📊 تحليل المنافسين
- 📅 مخطط المحتوى
- 📜 سجل المحتوى المولد
- ✏️ محرر مباشر مع تحليل لحظي

---

## 🏗️ التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|-----------|
| React 19 | واجهة المستخدم |
| TypeScript | نوع الأمان |
| Vite 7 | أداة البناء |
| TailwindCSS 3 | التنسيق |
| Supabase | قاعدة البيانات + المصادقة |
| Gemini / OpenAI | الذكاء الاصطناعي |

---

## 📦 التثبيت

### 1. استنساخ المشروع
```bash
git clone <repository-url>
cd seo-content-generator
```

### 2. تثبيت الاعتماديات
```bash
npm install
```

### 3. إعداد متغيرات البيئة
أنشئ ملف `.env.local` في جذر المشروع:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> ⚠️ **تحذير أمني:** لا تضع مفاتيح API (Gemini/OpenAI) في ملف `.env`. هذه المفاتيح تُدار من لوحة تحكم الأدمن داخل التطبيق.

### 4. إعداد Supabase

#### أ. إنشاء مشروع Supabase
1. اذهب إلى [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً
2. انسخ `Project URL` و `anon public key` إلى ملف `.env.local`

#### ب. إنشاء قاعدة البيانات
1. اذهب إلى **SQL Editor** في لوحة تحكم Supabase
2. شغّل محتويات ملف `supabase-schema.sql`
3. ثم شغّل `supabase-schema-v2.sql` للتحديثات الأمنية

#### ج. ترقية المسؤول (Admin)
بعد إنشاء حسابك، شغّل في SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 5. تشغيل المشروع
```bash
npm run dev
```

---

## 📁 هيكل المشروع

```
src/
├── components/     # مكونات React (22 مكون)
│   ├── ErrorBoundary.tsx    # معالجة الأخطاء
│   ├── Sidebar.tsx          # الشريط الجانبي
│   ├── LiveEditor.tsx       # المحرر المباشر
│   └── ...
├── contexts/       # سياقات React
│   └── AuthContext.tsx      # المصادقة
├── hooks/          # Hooks مخصصة (6)
│   ├── useApiKeys.ts        # إدارة مفاتيح API
│   ├── useContentGenerator.ts # توليد المحتوى
│   └── ...
├── lib/            # مكتبات
│   └── supabase.ts          # عميل Supabase
├── pages/          # صفحات التطبيق (9)
│   ├── ProductGenerator.tsx # مولد المنتجات
│   ├── ArticleGenerator.tsx # مولد المقالات
│   ├── Admin.tsx            # لوحة الأدمن
│   └── ...
└── utils/          # أدوات مساعدة (17)
    ├── types.ts             # الأنواع المشتركة
    ├── prompts.ts           # Prompts الذكاء الاصطناعي
    ├── parsers.ts           # محلل المخرجات
    ├── gemini.ts            # تكامل Gemini
    ├── openai.ts            # تكامل OpenAI
    ├── seoAnalyzer.ts       # محلل SEO
    ├── eeatAnalyzer.ts      # محلل E-E-A-T
    ├── humanityAnalyzer.ts  # كاشف المحتوى الآلي
    ├── inputSanitizer.ts    # تنقية المدخلات
    ├── salla.ts             # تكامل سلة
    ├── wooCommerce.ts       # تكامل ووكومرس
    └── ...
```

---

## 🔧 إعداد التكاملات

### سلة (Salla)
1. أنشئ تطبيقاً في [partners.salla.com](https://partners.salla.com)
2. أضف صلاحيات: المنتجات (قراءة + كتابة)، التصنيفات (قراءة)
3. أدخل بيانات OAuth في لوحة تحكم الأدمن

### ووكومرس (WooCommerce)
1. فعّل WooCommerce REST API في إعدادات المتجر
2. أنشئ Consumer Key/Secret بصلاحيات Read/Write
3. أدخل البيانات في إعدادات المتجر بالتطبيق

> **ملاحظة:** تكامل ووكومرس يعمل عبر Vite proxy في بيئة التطوير. للإنتاج، يُحتاج إلى إعداد Backend proxy (Supabase Edge Functions).

---

## 🔐 الأمان

- ✅ Row Level Security (RLS) مفعل على كل الجداول
- ✅ مفاتيح AI محمية (لا تُعرض للمستخدمين العاديين)
- ✅ OAuth 2.0 + CSRF protection لتكامل سلة
- ✅ Demo Login معطل في الإنتاج
- ✅ حماية ضد Prompt Injection

---

## 📜 الأوامر المتاحة

| الأمر | الوظيفة |
|-------|---------|
| `npm run dev` | تشغيل بيئة التطوير |
| `npm run build` | بناء الإنتاج |
| `npm run preview` | معاينة البناء |
| `npm run lint` | فحص الكود |

---

## 📄 الترخيص

مشروع خاص — جميع الحقوق محفوظة.

# seo
