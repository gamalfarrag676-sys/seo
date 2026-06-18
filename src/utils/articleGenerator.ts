export type ArticleStyle = 'informative' | 'persuasive' | 'guide';
export type ArticleLength = 'short' | 'medium' | 'long';

export interface ArticleInput {
  keyword: string;
  secondaryKeywords?: string;
  style: ArticleStyle;
  length: ArticleLength;
  notes?: string;
}

export interface ArticleContent {
  h1Title: string;
  mainContent: string;
  keywords: string;
  metaTitle: string;
  metaDescription: string;
  urlSlug: string;
  altText: string;
}

export function getArticlePrompt(input: ArticleInput): string {
  const { keyword, secondaryKeywords, style, length, notes } = input;

  let styleInstruction = '';
  switch (style) {
    case 'informative':
      styleInstruction = 'معلوماتي، موضوعي، مبني على البيانات كأنه مقال في موسوعة طبية أو علمية.';
      break;
    case 'persuasive':
      styleInstruction = 'إقناعي، ترويجي بشكل غير مباشر، يركز على الفوائد وحل مشاكل القارئ كأنه صفحة هبوط.';
      break;
    case 'guide':
      styleInstruction = 'دليل شامل خطوة بخطوة، عملي، مفيد للمبتدئين ويشرح كيفية عمل أو استخدام شيء ما.';
      break;
  }

  let lengthInstruction = '';
  switch (length) {
    case 'short':
      lengthInstruction = 'مقال قصير وموجز (حوالي 500 كلمة، 3-4 أقسام رئيسية).';
      break;
    case 'medium':
      lengthInstruction = 'مقال متوسط الطول وشامل (حوالي 1000 كلمة، 5-6 أقسام رئيسية).';
      break;
    case 'long':
      lengthInstruction = 'مقال طويل وعميق التفاصيل (أكثر من 1500 كلمة، 8-10 أقسام فرعية تفصيلية).';
      break;
  }

  return `
أنت خبير سيو (SEO) وصانع محتوى محترف باللغة العربية. مهمتك هي كتابة مقال متوافق تماماً مع محركات البحث.

**معلومات المقال:**
- الكلمة المفتاحية الرئيسية: "${keyword}"
${secondaryKeywords ? `- كلمات مفتاحية ثانوية (يجب تضمينها بشكل طبيعي): "${secondaryKeywords}"` : ''}
- أسلوب المقال: ${styleInstruction}
- طول المقال المطلوب: ${lengthInstruction}
${notes ? `- ملاحظات إضافية من المستخدم: "${notes}"` : ''}

**شروط وقواعد السيو (SEO) الأساسية التي يجب اتباعها بصرامة:**
1. الكلمة المفتاحية "${keyword}" يجب أن تظهر في أول 10 كلمات من المقال.
2. الكلمة المفتاحية يجب أن تظهر بنسبة كثافة 1.5% إلى 2.5% من إجمالي الكلمات.
3. استخدم العناوين الفرعية (H2, H3) بشكل هرمي ومنطقي (باستخدام صيغة الماركدون ## للـ H2 و ### للـ H3).
4. استخدم القوائم النقطية والرقمية لتسهيل القراءة.
5. في نهاية المقال، أضف قسماً صريحاً بعنوان "## أسئلة شائعة" يحتوي على 3 أسئلة وإجابات تفصيلية.
6. أضف خاتمة تلخص المقال بخطوة عملية تالية.

**المخرجات المطلوبة:**
يجب أن ترجع المخرجات باستخدام العلامات المحددة أدناه بالضبط. لا تقم بتغيير أسماء العلامات (مثل <<<TITLE>>>) ولا تضف نصاً خارجها.

<<<TITLE>>>
[أدخل عنوان المقال هنا (H1). يجب أن يحتوي على الكلمة المفتاحية "${keyword}" وأن يكون جذاباً وطوله بين 30 و 70 حرفاً]
<<<END_TITLE>>>

<<<CONTENT>>>
[أدخل المحتوى الكامل للمقال هنا باللغة العربية وبصيغة Markdown متضمنة المقدمة والعناوين (## و ###) والفقرات والقوائم وقسم الأسئلة الشائعة والخاتمة. تذكر تضمين الكلمات المفتاحية بشكل طبيعي.]
<<<END_CONTENT>>>

<<<KEYWORDS>>>
[أدخل 5 إلى 8 كلمات مفتاحية متعلقة بالموضوع، مفصولة بفواصل]
<<<END_KEYWORDS>>>

<<<META_TITLE>>>
[أدخل عنوان الميتا هنا، يجب أن يكون جذاباً ويحتوي على "${keyword}" وطوله بين 30 و 60 حرفاً]
<<<END_META_TITLE>>>

<<<META_DESC>>>
[أدخل وصف الميتا هنا. يجب أن يكون محفزاً للنقر ويحتوي على الكلمة المفتاحية وطوله بين 120 و 160 حرفاً]
<<<END_META_DESC>>>

<<<URL_SLUG>>>
[أدخل رابط URL مناسب هنا باللغة الانجليزية ويكون معبراً عن الكلمة المفتاحية، مفصول بشرطات (-) بدلا من المسافات. مثال: how-to-use-product]
<<<END_URL_SLUG>>>

<<<ALT_TEXT>>>
[أدخل نصاً بديلاً للصورة الرئيسية المقترحة للمقال. يجب أن يحتوي على "${keyword}" ويصف الصورة بدقة للمكفوفين ومحركات البحث]
<<<END_ALT_TEXT>>>
`;
}

export function parseArticleResponse(text: string): ArticleContent {
  const extract = (startTag: string, endTag: string): string => {
    const regex = new RegExp(`<<<\\s*${startTag}\\s*>>>([\\s\\S]*?)<<<\\s*${endTag}\\s*>>>`, 'i');
    
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  };

  const title = extract('<<<TITLE>>>', '<<<END_TITLE>>>');
  const mainContent = extract('<<<CONTENT>>>', '<<<END_CONTENT>>>');
  const keywords = extract('<<<KEYWORDS>>>', '<<<END_KEYWORDS>>>');
  const metaTitle = extract('<<<META_TITLE>>>', '<<<END_META_TITLE>>>');
  const metaDesc = extract('<<<META_DESC>>>', '<<<END_META_DESC>>>');
  const urlSlug = extract('<<<URL_SLUG>>>', '<<<END_URL_SLUG>>>');
  const altText = extract('<<<ALT_TEXT>>>', '<<<END_ALT_TEXT>>>');

  return {
    h1Title: title || 'مقال بدون عنوان',
    mainContent: mainContent || text, // Fallback to full text if tags fail
    keywords: keywords,
    metaTitle: metaTitle || title,
    metaDescription: metaDesc,
    urlSlug: urlSlug ? urlSlug.toLowerCase().replace(/[^a-z0-9\-]/g, '-') : 'article',
    altText: altText
  };
}
