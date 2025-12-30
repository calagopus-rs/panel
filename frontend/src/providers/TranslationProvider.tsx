import { ReactNode, useContext, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { GetPlaceholders, getTranslationMapping, TranslationContext, TranslationItemRecord } from 'shared';
import { z } from 'zod';
import { $ZodConfig } from 'zod/v4/core';
import { axiosInstance } from '@/api/axios.ts';
import { languageToZodLocaleMapping } from '@/lib/enums.ts';
import baseTranslations from '@/translations.ts';

const modules = import.meta.glob('/node_modules/zod/v4/locales/*.js');

type LanguageData = {
  items: TranslationItemRecord;
  translations: Record<string, string>;
};

declare global {
  interface String {
    md(): ReactNode;
  }
}

String.prototype.md = function (): ReactNode {
  return <Markdown>{this.toString()}</Markdown>;
};

let globalTranslationHandle: never = null as never;

const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState('en-US');
  const [languageData, setLanguageData] = useState<LanguageData | null>(null);

  const loadZod = async (lang: string) => {
    if (!modules[`/node_modules/zod/v4/locales/${languageToZodLocaleMapping[lang]}.js`]) {
      return;
    }

    const { default: locale } = (await modules[
      `/node_modules/zod/v4/locales/${languageToZodLocaleMapping[lang]}.js`
    ]()) as { default: () => $ZodConfig };

    z.config(locale());
  };

  useEffect(() => {
    if (language === 'en-US') {
      setLanguageData(null);
    } else {
      axiosInstance
        .get(`/translations/${language}.json`)
        .then(({ data }) => {
          const result: LanguageData = {
            items: data[''].items,
            translations: data[''].translations,
          };

          for (const key in data) {
            if (key === '') continue;

            for (const item in data.items) {
              result.items[`${key}.${item}`] = data.items[item];
            }
            for (const translation in data.translation) {
              result.items[`${key}.${translation}`] = data.translations[translation];
            }
          }

          result.translations = getTranslationMapping(result.translations);

          if (import.meta.env.DEV) {
            console.debug('Loaded language data', language, result);
          }

          setLanguageData(result);
        })
        .catch(() => setLanguage('en-US'));
    }

    loadZod(language);
  }, [language]);

  const t = (key: string, values: Record<string, string | number>): string => {
    if (!languageData?.translations[key] && !baseTranslations.mapping[key as never]) {
      throw new Error(`Language key ${key} not found.`);
    }

    let translation = languageData?.translations[key] || (baseTranslations.mapping[key as never] as string);

    if (values) {
      Object.keys(values).forEach((placeholder) => {
        translation = translation.replaceAll(`{${placeholder}}`, String(values[placeholder]));
      });
    }

    return translation;
  };

  const tItem = (key: string, count: number): string => {
    if (!languageData?.items[key] && !baseTranslations.items[key as never]) {
      throw new Error(`Language item key ${key} not found.`);
    }

    const translationItem = languageData?.items[key] || baseTranslations.items[key as never];
    const rules = new Intl.PluralRules(language);

    return translationItem[rules.select(count)].replaceAll('{count}', count.toString());
  };

  globalTranslationHandle = { language, setLanguage, t, tItem } as never;

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, tItem }}>{children}</TranslationContext.Provider>
  );
};

export default TranslationProvider;

export const useTranslations = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider');
  }

  return {
    language: context.language,
    setLanguage: context.setLanguage,
    t<K extends (typeof baseTranslations)['paths']>(
      key: K,
      values: Record<GetPlaceholders<(typeof baseTranslations)['mapping'][K]>[number], string | number>,
    ): string {
      return context.t(key, values);
    },
    tItem(key: keyof (typeof baseTranslations)['items'], count: number): string {
      return context.tItem(key as string, count);
    },
  };
};

export const getTranslations = (): ReturnType<typeof useTranslations> => {
  if (!globalTranslationHandle) {
    throw new Error('getTranslations called before TranslationProvider initialized');
  }

  return globalTranslationHandle;
};
