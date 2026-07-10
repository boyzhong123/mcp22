/** Last updated date shown on legal pages (ISO date in copy). */
export const LEGAL_LAST_UPDATED = 'June 1, 2026';

export type LegalSection = {
  id: string;
  title: string;
  zhTitle: string;
  paragraphs: { en: string; zh: string }[];
};

export type Bilingual = { en: string; zh: string };
export type LegalKind = 'terms' | 'privacy';

/**
 * One-line, plain-language gist for each section, keyed by section id. Shown
 * as an "In short" lead above the formal paragraphs so the document is
 * scannable — the full text below each summary remains the authoritative one.
 */
export const SECTION_SUMMARIES: Record<string, Bilingual> = {
  // Terms
  acceptance: {
    en: 'Using Chivox MCP means you accept these Terms — and bind your organization if you sign up for one.',
    zh: '使用 Chivox MCP 即表示接受本条款；若代表机构注册，则一并约束该机构。',
  },
  service: {
    en: 'What the platform provides, plus a heads-up that features, quotas, and trial perks can change.',
    zh: '平台提供的能力，以及功能、配额与试用权益可能调整的提示。',
  },
  account: {
    en: 'Keep your details accurate and your keys secret; you own everything done under your account and must be 18+.',
    zh: '保持信息真实、密钥保密；账户下的一切由你负责，且需年满 18 岁。',
  },
  'acceptable-use': {
    en: 'Don’t break the law, abuse the API, or mishandle voice data — we can step in if you do.',
    zh: '不得违法、滥用 API 或不当处理语音数据，否则我们将介入。',
  },
  'api-usage': {
    en: 'Keys are yours alone, never ship them in public code, and you pay for whatever they spend.',
    zh: '密钥仅归你所有，切勿嵌入公开代码；其产生的费用由你承担。',
  },
  billing: {
    en: 'Paid usage is charged in USD to your payment method, and fees are generally non-refundable.',
    zh: '付费用量以美元从你的支付方式扣取，费用通常不退。',
  },
  ip: {
    en: 'We own the platform; you keep your apps and content and license us to process them to run the Service.',
    zh: '平台归我们所有；你保留应用与内容，并授权我们为提供服务而处理它们。',
  },
  'third-party': {
    en: 'Some features rely on third parties that carry their own terms.',
    zh: '部分功能依赖有各自条款的第三方。',
  },
  disclaimers: {
    en: 'The Service is provided “as is,” and scores are informational — not guaranteed for high-stakes use.',
    zh: '服务按「现状」提供，分数仅供参考，不适用于无复核的高风险决策。',
  },
  liability: {
    en: 'Our liability is capped and excludes indirect or consequential damages.',
    zh: '我们的责任设有上限，且不含间接或后果性损害。',
  },
  indemnity: {
    en: 'You cover claims that arise from your use or your violations.',
    zh: '因你的使用或违规引发的索赔由你承担。',
  },
  termination: {
    en: 'Leave anytime; we may suspend for breach — and some clauses survive afterward.',
    zh: '可随时退出；违规时我们可暂停，部分条款在终止后仍有效。',
  },
  changes: {
    en: 'We may update these Terms with notice; continuing to use the Service means you accept them.',
    zh: '我们可在通知后更新条款；继续使用即视为接受。',
  },
  law: {
    en: 'Delaware law governs, though mandatory local consumer rights may still apply.',
    zh: '适用特拉华州法律，但强制性本地消费者权利仍可能适用。',
  },
  contact: {
    en: 'How to reach us with questions about these Terms.',
    zh: '就本条款联系我们的方式。',
  },

  // Privacy
  scope: {
    en: 'What this policy covers — and what it leaves to third parties.',
    zh: '本政策涵盖的范围，以及交由第三方处理的部分。',
  },
  collect: {
    en: 'The four buckets of data we handle: account, usage/billing, content you submit, and technical signals.',
    zh: '我们处理的四类数据：账户、用量/账单、你提交的内容与技术信号。',
  },
  use: {
    en: 'We use data to run and secure the Service — never to sell it or train public models without your opt-in.',
    zh: '我们用数据来运行与保障服务；未经你同意不会出售或用于训练公开模型。',
  },
  'legal-bases': {
    en: 'The GDPR grounds we rely on when EEA/UK law applies.',
    zh: '在适用 EEA/英国法律时我们所依据的 GDPR 法律依据。',
  },
  sharing: {
    en: 'We share only with vetted processors under contract, and disclose otherwise only when legally required.',
    zh: '仅在合同下与经审核的处理方共享；其余仅在法律要求时披露。',
  },
  transfers: {
    en: 'Data may cross borders, protected by safeguards like Standard Contractual Clauses.',
    zh: '数据可能跨境传输，并以标准合同条款等机制加以保护。',
  },
  retention: {
    en: 'We keep data only as long as needed, then delete or aggregate it.',
    zh: '数据仅在必要期限内保留，随后删除或汇总。',
  },
  security: {
    en: 'We protect data with encryption and access controls — though no system is ever 100% secure.',
    zh: '我们以加密与访问控制保护数据，但没有系统能保证绝对安全。',
  },
  rights: {
    en: 'Access, correct, delete, or port your data — contact us, or your local regulator.',
    zh: '你可访问、更正、删除或转移数据 —— 可联系我们或当地监管机构。',
  },
  children: {
    en: 'The Service isn’t for under-16s, and we don’t knowingly collect their data.',
    zh: '服务不面向 16 岁以下儿童，我们不会有意收集其数据。',
  },
  'changes-privacy': {
    en: 'Updates get a fresh “last updated” date and extra notice when required.',
    zh: '更新会附上新的「最后更新」日期，并在必要时另行通知。',
  },
  'contact-privacy': {
    en: 'How to reach us about privacy or your data rights.',
    zh: '就隐私或数据权利联系我们的方式。',
  },
};

/** One-paragraph intro shown under each document's title. */
export const TERMS_LEDE: Bilingual = {
  en: 'The agreement between you and Chivox for using the Chivox MCP developer platform. Every section opens with a short plain-language summary — the full terms beneath it are what legally apply.',
  zh: '你与 Chivox 之间关于使用 Chivox MCP 开发者平台的协议。每一节都以简短的通俗摘要开头，但其下的完整条款才具有法律效力。',
};

export const PRIVACY_LEDE: Bilingual = {
  en: 'How we collect, use, and protect your data across the Chivox MCP platform. Each section opens with a plain-language summary; the detail below it is the authoritative version.',
  zh: '我们在 Chivox MCP 平台如何收集、使用与保护你的数据。每一节都以通俗摘要开头，其下详述为准。',
};

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'acceptance',
    title: '1. Agreement',
    zhTitle: '1. 协议接受',
    paragraphs: [
      {
        en: 'These Terms of Service ("Terms") govern access to and use of the Chivox MCP developer console, APIs, documentation, and related services (collectively, the "Service") operated by Chivox, Inc. ("Chivox," "we," "us"). By creating an account, signing in, or using the Service, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Service.',
        zh: '本《服务条款》（「条款」）适用于您对 Chivox, Inc.（「Chivox」「我们」）运营的 Chivox MCP 开发者控制台、API、文档及相关服务（合称「服务」）的访问与使用。注册、登录或使用服务即表示您同意本条款及《隐私政策》。若不同意，请勿使用服务。',
      },
      {
        en: 'If you use the Service on behalf of an organization, you represent that you have authority to bind that organization, and "you" includes the organization.',
        zh: '若您代表某机构使用服务，即表示您有权使该机构受本条款约束，「您」亦包括该机构。',
      },
    ],
  },
  {
    id: 'service',
    title: '2. The Service',
    zhTitle: '2. 服务内容',
    paragraphs: [
      {
        en: 'Chivox MCP provides speech and language evaluation capabilities exposed through the Model Context Protocol (MCP) and related HTTP APIs. Features, models, quotas, and pricing are described in the console and documentation and may change with reasonable notice.',
        zh: 'Chivox MCP 通过 Model Context Protocol（MCP）及相关 HTTP API 提供语音与语言评测能力。功能、模型、配额与价格以控制台及文档说明为准，我们可在合理通知后调整。',
      },
      {
        en: 'We may offer free trial points, promotional quotas, or beta features. Such offers are provided as-is, may be modified or withdrawn at any time, and do not create a commitment to future availability.',
        zh: '我们可能提供免费试用评测积分、促销配额或测试功能。此类权益按现状提供，可随时变更或终止，不构成对未来可用性的承诺。',
      },
    ],
  },
  {
    id: 'account',
    title: '3. Accounts & security',
    zhTitle: '3. 账户与安全',
    paragraphs: [
      {
        en: 'You must provide accurate registration information and keep credentials, API keys, and secrets confidential. You are responsible for all activity under your account. Notify us promptly at legal@chivox.com if you suspect unauthorized access.',
        zh: '您须提供真实注册信息，并妥善保管凭证、API Key 及密钥。账户下的一切活动由您负责。如怀疑未授权访问，请尽快联系 legal@chivox.com。',
      },
      {
        en: 'You must be at least 18 years old (or the age of majority in your jurisdiction) to use the Service.',
        zh: '您须年满 18 周岁（或您所在司法辖区规定的成年年龄）方可使用服务。',
      },
    ],
  },
  {
    id: 'acceptable-use',
    title: '4. Acceptable use',
    zhTitle: '4. 可接受使用',
    paragraphs: [
      {
        en: 'You may not use the Service to violate law, infringe intellectual property or privacy rights, distribute malware, attempt to bypass rate limits or security controls, resell access without authorization, or process biometric or children\'s voice data without a lawful basis and appropriate notices.',
        zh: '您不得利用服务从事违法活动、侵犯知识产权或隐私、传播恶意软件、规避限流或安全机制、未经授权转售访问权限，或在缺乏合法依据及适当告知的情况下处理生物识别或儿童语音数据。',
      },
      {
        en: 'We may investigate suspected abuse and suspend or terminate access to protect the Service and other customers.',
        zh: '我们可调查涉嫌滥用行为，并暂停或终止访问以保护服务及其他客户。',
      },
    ],
  },
  {
    id: 'api-usage',
    title: '5. API usage & keys',
    zhTitle: '5. API 使用与 Key',
    paragraphs: [
      {
        en: 'API keys are personal to your account (or organization) and must not be embedded in public client-side code. Usage is metered according to published rates. You are responsible for charges incurred through your keys, including use by your applications and team members.',
        zh: 'API Key 归属于您的账户（或机构），不得嵌入公开客户端代码。用量按公布费率计量。您须对通过 Key 产生的费用负责，包括您的应用及团队成员的使用。',
      },
    ],
  },
  {
    id: 'billing',
    title: '6. Fees, billing & taxes',
    zhTitle: '6. 费用、账单与税费',
    paragraphs: [
      {
        en: 'Paid features are billed in U.S. dollars unless otherwise stated. You authorize us and our payment processors (e.g., PayPal, Stripe) to charge your selected payment method for top-ups and usage. Taxes may apply where required by law.',
        zh: '付费功能以美元计费（另有说明除外）。您授权我们及支付处理方（如 PayPal、Stripe）从您选择的支付方式扣取充值及用量费用。依法可能产生税费。',
      },
      {
        en: 'Except where required by law, fees are non-refundable. Prepaid wallet points expire only as stated in the console or order confirmation.',
        zh: '除法律要求外，费用不予退款。预付费评测积分仅在控制台或订单确认中载明的情形下失效。',
      },
    ],
  },
  {
    id: 'ip',
    title: '7. Intellectual property',
    zhTitle: '7. 知识产权',
    paragraphs: [
      {
        en: 'Chivox retains all rights in the Service, models, software, and documentation. You retain rights in your applications and content you submit. You grant Chivox a limited license to process inputs and outputs as necessary to provide and improve the Service, consistent with the Privacy Policy.',
        zh: 'Chivox 保留服务、模型、软件及文档的一切权利。您保留对自有应用及提交内容的权利。您授予 Chivox 为提供和改进服务所必需的有限许可，以处理输入与输出，详见《隐私政策》。',
      },
    ],
  },
  {
    id: 'third-party',
    title: '8. Third-party services',
    zhTitle: '8. 第三方服务',
    paragraphs: [
      {
        en: 'The Service may integrate with third-party identity, payment, or cloud providers. Your use of those services is subject to their terms. Chivox is not responsible for third-party products.',
        zh: '服务可能集成第三方身份、支付或云服务。您使用该等服务须遵守其条款。Chivox 不对第三方产品负责。',
      },
    ],
  },
  {
    id: 'disclaimers',
    title: '9. Disclaimers',
    zhTitle: '9. 免责声明',
    paragraphs: [
      {
        en: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, CHIVOX DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. EVALUATION SCORES ARE INFORMATIONAL AND NOT A GUARANTEE OF ACCURACY FOR HIGH-STAKES DECISIONS WITHOUT INDEPENDENT REVIEW.',
        zh: '服务按「现状」及「可用性」提供。在法律允许的最大范围内，Chivox 否认一切明示或默示保证，包括适销性、特定用途适用性及不侵权。评测分数仅供参考，在高风险决策中未经独立复核不得视为准确保证。',
      },
    ],
  },
  {
    id: 'liability',
    title: '10. Limitation of liability',
    zhTitle: '10. 责任限制',
    paragraphs: [
      {
        en: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, CHIVOX WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOST PROFITS, DATA, OR GOODWILL. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THE SERVICE IN A 12-MONTH PERIOD IS LIMITED TO THE GREATER OF (A) AMOUNTS YOU PAID TO CHIVOX FOR THE SERVICE IN THAT PERIOD OR (B) USD $100.',
        zh: '在法律允许的最大范围内，Chivox 不对间接、附带、特殊、后果性或惩罚性损害，或利润、数据、商誉损失承担责任。因服务引起之任何索赔，我们在连续 12 个月内的总责任以（A）您同期向 Chivox 支付的服务费用或（B）100 美元中较高者为限。',
      },
    ],
  },
  {
    id: 'indemnity',
    title: '11. Indemnification',
    zhTitle: '11. 赔偿',
    paragraphs: [
      {
        en: 'You will defend and indemnify Chivox against claims arising from your use of the Service, your content, or your violation of these Terms or applicable law, except to the extent caused by Chivox\'s gross negligence or willful misconduct.',
        zh: '您应就因您使用服务、您的内容或违反本条款/适用法律而引起的索赔，为 Chivox 辩护并赔偿，但因 Chivox 重大过失或故意不当行为所致者除外。',
      },
    ],
  },
  {
    id: 'termination',
    title: '12. Suspension & termination',
    zhTitle: '12. 暂停与终止',
    paragraphs: [
      {
        en: 'You may close your account at any time through the console or by contacting support. We may suspend or terminate access for breach of these Terms, non-payment, or risk to the Service. Provisions that by nature should survive (fees owed, disclaimers, liability limits, indemnity) will survive termination.',
        zh: '您可随时通过控制台或联系支持关闭账户。我们可因违反条款、欠费或对服务构成风险而暂停或终止访问。依其性质应继续有效的条款（应付费用、免责声明、责任限制、赔偿等）在终止后仍然有效。',
      },
    ],
  },
  {
    id: 'changes',
    title: '13. Changes',
    zhTitle: '13. 条款变更',
    paragraphs: [
      {
        en: 'We may update these Terms. Material changes will be notified via the console, email, or website at least 30 days before they take effect where required by law. Continued use after the effective date constitutes acceptance.',
        zh: '我们可更新本条款。重大变更将依法提前至少 30 日通过控制台、邮件或网站通知。生效日后继续使用即视为接受。',
      },
    ],
  },
  {
    id: 'law',
    title: '14. Governing law & disputes',
    zhTitle: '14. 适用法律与争议',
    paragraphs: [
      {
        en: 'These Terms are governed by the laws of the State of Delaware, USA, excluding conflict-of-law rules. Courts in Delaware shall have exclusive jurisdiction, except that either party may seek injunctive relief in any competent court. If you are a consumer in the EEA/UK, mandatory local consumer protections may apply.',
        zh: '本条款适用美国特拉华州法律（冲突法规则除外）。特拉华州法院享有专属管辖权，但任何一方均可在有管辖权的法院寻求禁令救济。若您为 EEA/英国消费者，强制性本地消费者保护可能适用。',
      },
    ],
  },
  {
    id: 'contact',
    title: '15. Contact',
    zhTitle: '15. 联系我们',
    paragraphs: [
      {
        en: 'Questions about these Terms: legal@chivox.com. Chivox, Inc., Developer Platform, United States.',
        zh: '条款咨询：legal@chivox.com。Chivox, Inc.，开发者平台，美国。',
      },
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'scope',
    title: '1. Scope',
    zhTitle: '1. 适用范围',
    paragraphs: [
      {
        en: 'This Privacy Policy explains how Chivox, Inc. ("Chivox," "we") collects, uses, and shares personal data when you use the Chivox MCP developer console, websites, APIs, and support channels (the "Service"). It does not cover third-party sites you link to from the Service.',
        zh: '本《隐私政策》说明 Chivox, Inc.（「Chivox」「我们」）在您使用 Chivox MCP 开发者控制台、网站、API 及支持渠道（「服务」）时如何收集、使用及共享个人数据。不适用于您从服务跳转的第三方网站。',
      },
    ],
  },
  {
    id: 'collect',
    title: '2. Data we collect',
    zhTitle: '2. 我们收集的数据',
    paragraphs: [
      {
        en: 'Account data: name, email, authentication identifiers, organization details, and preferences.',
        zh: '账户数据：姓名、邮箱、身份认证标识、机构信息及偏好设置。',
      },
      {
        en: 'Usage and billing data: API call metadata, timestamps, project/key identifiers, wallet balances, invoices, and payment references (processed by payment providers; we do not store full card numbers).',
        zh: '使用与账单数据：API 调用元数据、时间戳、项目/Key 标识、钱包余额、发票及支付参考号（由支付机构处理；我们不存储完整卡号）。',
      },
      {
        en: 'Content you submit: audio, text, or other inputs sent to evaluation endpoints, solely to provide the Service and as described below.',
        zh: '您提交的内容：发送至评测端点的音频、文本或其他输入，仅为提供服务及如下所述目的而处理。',
      },
      {
        en: 'Technical data: IP address, device/browser type, logs, and security signals.',
        zh: '技术数据：IP 地址、设备/浏览器类型、日志及安全信号。',
      },
    ],
  },
  {
    id: 'use',
    title: '3. How we use data',
    zhTitle: '3. 数据使用方式',
    paragraphs: [
      {
        en: 'We use personal data to provide and secure the Service, authenticate users, meter usage, process payments, send transactional and product communications, comply with law, and improve reliability (including aggregated analytics and model quality evaluation).',
        zh: '我们使用个人数据以提供并保障服务、验证身份、计量用量、处理付款、发送交易及产品通信、遵守法律，并提升可靠性（包括汇总分析及模型质量评估）。',
      },
      {
        en: 'We do not sell your personal data. We do not use your evaluation content to train public models unless you opt in to a separate program disclosed in the console.',
        zh: '我们不出售您的个人数据。除非您在控制台另行同意参与单独披露的计划，我们不会将评测内容用于训练公开模型。',
      },
    ],
  },
  {
    id: 'legal-bases',
    title: '4. Legal bases (EEA/UK)',
    zhTitle: '4. 法律依据（EEA/英国）',
    paragraphs: [
      {
        en: 'Where GDPR applies, we rely on contract performance (providing the Service), legitimate interests (security, fraud prevention, product improvement), legal obligation, and consent where required (e.g., marketing emails).',
        zh: '在适用 GDPR 时，我们依据合同履行（提供服务）、合法利益（安全、反欺诈、产品改进）、法定义务及在需要时的同意（如营销邮件）处理数据。',
      },
    ],
  },
  {
    id: 'sharing',
    title: '5. Sharing & processors',
    zhTitle: '5. 共享与处理方',
    paragraphs: [
      {
        en: 'We share data with infrastructure, analytics, email, identity (OAuth), and payment processors under data processing agreements. Examples include cloud hosting, PayPal/Stripe for billing, and email delivery providers.',
        zh: '我们在数据处理协议下与基础设施、分析、邮件、身份（OAuth）及支付处理方共享数据，例如云托管、PayPal/Stripe 计费及邮件投递服务。',
      },
      {
        en: 'We may disclose data if required by law, to protect rights and safety, or in connection with a merger or acquisition with appropriate safeguards.',
        zh: '在法律要求、保护权利与安全，或在并购等情形下，我们可在适当保障措施下披露数据。',
      },
    ],
  },
  {
    id: 'transfers',
    title: '6. International transfers',
    zhTitle: '6. 跨境传输',
    paragraphs: [
      {
        en: 'We may process data in the United States and other countries. Where required, we use Standard Contractual Clauses or equivalent mechanisms for transfers from the EEA/UK.',
        zh: '我们可在美国及其他国家处理数据。在需要时，对来自 EEA/英国的数据传输采用标准合同条款或同等机制。',
      },
    ],
  },
  {
    id: 'retention',
    title: '7. Retention',
    zhTitle: '7. 保留期限',
    paragraphs: [
      {
        en: 'We retain account and billing records while your account is active and for a reasonable period afterward for legal, tax, and dispute resolution purposes. Evaluation content is retained only as long as needed to provide the Service and configured retention settings, then deleted or aggregated.',
        zh: '账户及账单记录在账户存续期间及之后合理期限内保留，用于法律、税务及争议解决。评测内容仅在提供服务及所配置保留设置所需期间内保留，随后删除或汇总。',
      },
    ],
  },
  {
    id: 'security',
    title: '8. Security',
    zhTitle: '8. 安全',
    paragraphs: [
      {
        en: 'We implement administrative, technical, and organizational measures appropriate to the risk, including encryption in transit, access controls, and monitoring. No method of transmission or storage is 100% secure.',
        zh: '我们根据风险采取适当的管理、技术及组织措施，包括传输加密、访问控制与监控。任何传输或存储方式均无法保证绝对安全。',
      },
    ],
  },
  {
    id: 'rights',
    title: '9. Your rights',
    zhTitle: '9. 您的权利',
    paragraphs: [
      {
        en: 'Depending on your location, you may have rights to access, correct, delete, restrict, or port your data, and to object to certain processing. Contact privacy@chivox.com. You may lodge a complaint with your local supervisory authority.',
        zh: '根据您所在地区，您可能享有访问、更正、删除、限制或转移数据及反对特定处理的权利。请联系 privacy@chivox.com。您可向当地监管机构投诉。',
      },
    ],
  },
  {
    id: 'children',
    title: '10. Children',
    zhTitle: '10. 儿童',
    paragraphs: [
      {
        en: 'The Service is not directed to children under 16. We do not knowingly collect their personal data. Contact us to request deletion if you believe we have.',
        zh: '服务不面向 16 岁以下儿童。我们不会有意收集其个人数据。如您认为我们已收集，请联系我们删除。',
      },
    ],
  },
  {
    id: 'changes-privacy',
    title: '11. Changes',
    zhTitle: '11. 政策变更',
    paragraphs: [
      {
        en: 'We may update this Policy. We will post the revised version with a new "Last updated" date and, where required, provide additional notice.',
        zh: '我们可更新本政策，并发布新版及新的「最后更新」日期；依法必要时将另行通知。',
      },
    ],
  },
  {
    id: 'contact-privacy',
    title: '12. Contact',
    zhTitle: '12. 联系我们',
    paragraphs: [
      {
        en: 'Privacy inquiries: privacy@chivox.com. Data protection contact: Chivox, Inc., United States.',
        zh: '隐私咨询：privacy@chivox.com。数据保护联系：Chivox, Inc.，美国。',
      },
    ],
  },
];
