'use client';

import { Link } from '@/i18n/routing';
import { ArrowLeft, Mail, MapPin } from 'lucide-react';
import { useLocale } from 'next-intl';

export default function ContactPage() {
  const locale = useLocale();
  const isZh = locale.startsWith('zh');
  return (
    <main className="flex-1">
      <div className="container mx-auto px-6 py-16 md:py-24">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> {isZh ? '返回首页' : 'Back to Home'}
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{isZh ? '联系我们' : 'Contact Us'}</h1>
        <p className="text-muted-foreground mb-12 max-w-lg">
          {isZh ? '无论是企业合作还是技术咨询，我们期待与您对话。' : 'For business collaboration or technical consulting, we would love to talk.'}
        </p>

        <div className="grid md:grid-cols-2 gap-12 max-w-3xl">
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold mb-1">{isZh ? '邮箱 / Email' : 'Email'}</h3>
                <a href="mailto:mcp@chivox.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  mcp@chivox.com
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold mb-1">{isZh ? '地址 / Address' : 'Address'}</h3>
                <p className="text-sm text-muted-foreground">
                  苏州工业园区<br />
                  Suzhou Industrial Park, China
                </p>
              </div>
            </div>
          </div>

          <div className="border border-border/60 rounded-lg p-6">
            <h3 className="text-sm font-semibold mb-4">{isZh ? '发送消息' : 'Send a Message'}</h3>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); alert(isZh ? '消息已发送' : 'Message sent'); }}>
              <input
                type="text"
                placeholder={isZh ? '您的姓名' : 'Your Name'}
                className="w-full h-10 px-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-colors"
              />
              <input
                type="email"
                placeholder={isZh ? '邮箱' : 'Email'}
                className="w-full h-10 px-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-colors"
              />
              <textarea
                rows={4}
                placeholder={isZh ? '您的需求或问题' : 'Your message'}
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-colors resize-none"
              />
              <button
                type="submit"
                className="w-full h-10 text-sm font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                {isZh ? '发送' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
