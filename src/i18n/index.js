import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';
import { safeGetItem } from '../utils/safeStorage.js';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh }
    },
    // 顶层 import 阶段同步执行 — 必须用 safeGetItem,
    // 否则隐私模式 / iframe 沙箱抛 SecurityError 会导致整站白屏(连 ErrorBoundary 都救不了)
    lng: safeGetItem('language', 'en'),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
