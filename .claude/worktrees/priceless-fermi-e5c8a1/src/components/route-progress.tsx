'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from '@/i18n/routing';

/**
 * 全局路由切换进度条：
 * - 点击内部 <a>/<button-with-link> 等触发导航行为时立即展示
 * - usePathname 变化后动画填满并消失
 * - 快速导航时有 120ms 延迟，避免一闪而过
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pendingRef = useRef(false);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const start = () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    clearTimers();

    // 100ms 后再显示，避免快速导航时一闪而过
    timersRef.current.push(
      setTimeout(() => {
        setVisible(true);
        setProgress(25);
      }, 100)
    );
    // 逐步爬升，给用户"正在加载"的心理预期
    timersRef.current.push(setTimeout(() => setProgress(55), 350));
    timersRef.current.push(setTimeout(() => setProgress(78), 900));
    timersRef.current.push(setTimeout(() => setProgress(90), 2000));
  };

  const done = () => {
    if (!pendingRef.current) return;
    pendingRef.current = false;
    clearTimers();

    setProgress(100);
    timersRef.current.push(
      setTimeout(() => {
        setVisible(false);
        // 下一帧再归零，让宽度动画走完
        timersRef.current.push(setTimeout(() => setProgress(0), 200));
      }, 180)
    );
  };

  // pathname 变化 = 路由切换完成
  useEffect(() => {
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 监听全局 anchor 点击
  useEffect(() => {
    function isNavigatingClick(e: MouseEvent): boolean {
      if (e.defaultPrevented) return false;
      if (e.button !== 0) return false;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
      return true;
    }

    function getAnchor(target: EventTarget | null): HTMLAnchorElement | null {
      let el = target as HTMLElement | null;
      while (el && el !== document.body) {
        if (el.tagName === 'A') return el as HTMLAnchorElement;
        el = el.parentElement;
      }
      return null;
    }

    function onClick(e: MouseEvent) {
      if (!isNavigatingClick(e)) return;
      const a = getAnchor(e.target);
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      // 外链、新窗口、锚点、下载、邮件、电话 —— 都不触发
      if (a.target === '_blank') return;
      if (a.hasAttribute('download')) return;
      if (href.startsWith('#')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
      // 外部域名
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        // 同路径（只是 hash 变化）不触发
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        return;
      }

      start();
    }

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // 兜底：防止 start 了但路由没变（比如 prefetched 瞬间完成）
  useEffect(() => {
    return () => clearTimers();
  }, []);

  if (progress === 0 && !visible) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[100] h-[2px] pointer-events-none"
    >
      <div
        className="h-full bg-foreground will-change-[width,opacity] transition-[width,opacity] duration-200 ease-out shadow-[0_0_10px_rgba(0,0,0,0.25)]"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
