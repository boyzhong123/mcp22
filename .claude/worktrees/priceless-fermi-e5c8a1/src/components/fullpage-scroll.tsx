'use client';

import { useEffect } from 'react';

/**
 * 首页 fullpage 滚动控制器（纯逻辑，无 UI）
 * - 拦截滚轮 / 方向键，每次事件只切换一个 data-fp-section 段落
 * - 超高段落内部允许自然滚动，滚到底/顶再切屏
 * - 仅在此组件挂载期间生效（卸载即恢复为原生滚动）
 */
export function FullPageScroll() {
  useEffect(() => {
    // 仅桌面端启用翻页滚动；移动端/平板端保持原生连续滚动
    if (!window.matchMedia('(min-width: 1024px)').matches) return;

    const root = document.documentElement;
    root.classList.add('fullpage-on');

    const getSections = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-fp-section]'));

    let animating = false;
    let lastTime = 0;

    const NAV_OFFSET = 64;

    const currentIdx = () => {
      const secs = getSections();
      const check = window.scrollY + window.innerHeight * 0.3;
      for (let i = secs.length - 1; i >= 0; i--) {
        if (secs[i].offsetTop <= check) return i;
      }
      return 0;
    };

    const scrollToIdx = (idx: number) => {
      const secs = getSections();
      const i = Math.max(0, Math.min(idx, secs.length - 1));
      const target = secs[i];
      if (!target) return;
      animating = true;
      window.scrollTo({ top: target.offsetTop - NAV_OFFSET + 1, behavior: 'smooth' });
      window.setTimeout(() => {
        animating = false;
      }, 750);
    };

    const onWheel = (e: WheelEvent) => {
      const secs = getSections();
      const idx = currentIdx();
      const cur = secs[idx];
      if (!cur) return;

      const sh = cur.offsetHeight;
      const vh = window.innerHeight;
      const top = cur.offsetTop;
      const scrolled = window.scrollY + NAV_OFFSET - top;
      const isLast = idx === secs.length - 1;
      const distanceToBottom =
        document.documentElement.scrollHeight - window.scrollY - vh;

      // 超出一屏的 section：允许内部滚动，滚到边界再切屏
      if (sh > vh + 8) {
        if (e.deltaY > 0 && scrolled < sh - vh + 4) return;
        if (e.deltaY < 0 && scrolled > 4) return;
      }

      // 最后一屏继续向下：让 footer 等最后一屏之外的内容自然出现
      if (isLast && e.deltaY > 0 && distanceToBottom > 4) return;

      e.preventDefault();

      const now = Date.now();
      if (animating || now - lastTime < 650) return;
      if (Math.abs(e.deltaY) < 6) return;
      lastTime = now;

      if (e.deltaY > 0) scrollToIdx(idx + 1);
      else scrollToIdx(idx - 1);
    };

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;

      if (animating) {
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key)) e.preventDefault();
        return;
      }
      const idx = currentIdx();
      if (['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault();
        scrollToIdx(idx + 1);
      } else if (['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey)) {
        e.preventDefault();
        scrollToIdx(idx - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToIdx(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToIdx(getSections().length - 1);
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      root.classList.remove('fullpage-on');
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return null;
}
