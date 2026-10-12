'use client';

import { useEffect } from 'react';

/**
 * Guards against third-party browser extensions (e.g. Best Image Search, Urban VPN, Honey)
 * injecting bis_skin_checked, bis_register, bis_size and breaking React hydration.
 * Implemented as a client component hook to avoid React 19 raw script tag errors.
 */
export default function ExtensionGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const originalSetAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function (name: string, value: string) {
        if (name === 'bis_skin_checked' || name === 'bis_register' || name === 'bis_size') {
          return;
        }
        return originalSetAttribute.apply(this, [name, value]);
      };

      const observer = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
          const m = mutations[i];
          if (
            m.type === 'attributes' &&
            m.attributeName &&
            (m.attributeName === 'bis_skin_checked' ||
              m.attributeName === 'bis_register' ||
              m.attributeName === 'bis_size')
          ) {
            (m.target as HTMLElement).removeAttribute(m.attributeName);
          }
        }
      });

      observer.observe(document.documentElement, {
        attributes: true,
        subtree: true,
        attributeFilter: ['bis_skin_checked', 'bis_register', 'bis_size'],
      });

      return () => {
        observer.disconnect();
        Element.prototype.setAttribute = originalSetAttribute;
      };
    } catch (e) {}
  }, []);

  return null;
}
