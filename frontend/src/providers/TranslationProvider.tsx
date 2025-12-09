import { ReactNode, useContext, useEffect, useState } from 'react';
import baseTranslations from '@/translations';
import Spinner from '@/elements/Spinner';
import { GetPlaceholders, getTranslationMapping, TranslationContext, TranslationItemRecord } from 'shared';
import { axiosInstance } from '@/api/axios';

type LanguageData = {
  items: TranslationItemRecord;
  translations: Record<string, string>;
};

const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en-US');
  const [languageData, setLanguageData] = useState<LanguageData | null>(null);

  useEffect(() => {
    if (language === 'en-US') {
      setLanguageData(null);
      setLoading(false);
    } else {
      setLoading(true);
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
        .catch(() => setLanguage('en-US'))
        .finally(() => setLoading(false));
    }
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

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, tItem }}>
      {loading ? <Spinner.Centered /> : children}
    </TranslationContext.Provider>
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
