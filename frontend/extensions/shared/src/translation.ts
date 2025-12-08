import { createContext, useContext } from 'react';

interface TranslationContextType {
  language: string;
  setLanguage: (language: string) => void;

  t(key: string, values: Record<string, string | number>): string;
  tItem(key: string, count: number): string;
}

export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export type LanguageData = {
  items: TranslationItemRecord;
  translations: TranslationRecord;
};

export type TranslationRecord = {
  [k: string]: string | TranslationRecord;
};

export type TranslationItem = Record<Intl.LDMLPluralRule, string>;
export type TranslationItemRecord = {
  [k: string]: TranslationItem;
};

export class DefinedTranslations<
  I extends TranslationItemRecord,
  O extends TranslationRecord,
  P = UnionToIntersection<PathImplObj<O>>,
> {
  namespace: string;
  items: I;
  obj: O;
  paths: keyof P;
  mapping: P;

  subTranslations: Record<string, LanguageData>;

  constructor(data: { items: I; translations: O }) {
    this.namespace = '';
    this.items = data.items;
    this.obj = data.translations;
    this.paths = null as never;
    this.mapping = getTranslationMapping(data.translations) as never;
    this.subTranslations = { '': data };
  }

  public mergeFrom(other: this): this {
    for (const item in other.items) {
      this.items[`${other.namespace}.${item}` as keyof I] = other.items[item];
    }
    for (const key in other.mapping) {
      this.mapping[`${other.namespace}.${key}` as string] = other.mapping[key];
    }
    this.subTranslations[other.namespace] = {
      items: other.items,
      translations: other.obj,
    };

    return this;
  }

  public useTranslations() {
    const context = useContext(TranslationContext);
    if (!context) {
      throw new Error('useTranslations must be used within a TranslationProvider');
    }

    const namespace = this.namespace;

    return {
      language: context.language,
      setLanguage: context.setLanguage,
      t<K extends keyof P>(
        key: K,
        // @ts-expect-error this is fine
        values: Record<GetPlaceholders<P[K]>[number], string | number>,
      ): string {
        return context.t(`${namespace}.${key as string}`, values);
      },
      tItem(key: keyof I, count: number): string {
        return context.tItem(`${namespace}.${key as string}`, count);
      },
    };
  }
}

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

type PathImplObj<T> = T extends TranslationRecord
  ? {
      [K in keyof T]: T[K] extends TranslationRecord
        ? PathImplObj<T[K]> extends infer Nested
          ? {
              [P in keyof Nested as `${K & string}.${P & string}`]: Nested[P];
            }
          : never
        : {
            [P in K]: T[K];
          };
    }[keyof T]
  : never;

export type GetPlaceholders<S extends string> = S extends `${string}{${infer W}}${infer RE}`
  ? [W, ...GetPlaceholders<RE>]
  : [];

export function defineEnglishItem(singular: string, plural: string): TranslationItem {
  return {
    zero: `{count} ${plural}`,
    one: `{count} ${singular}`,
    two: `{count} ${plural}`,
    few: `{count} ${plural}`,
    many: `{count} ${plural}`,
    other: `{count} ${plural}`,
  };
}

export function getTranslationMapping(obj: TranslationRecord, parent?: string): Record<string, string> {
  const mapping: Record<string, string> = {};

  function formatKey(key: string): string {
    if (parent) {
      return `${parent}.${key}`;
    } else {
      return key;
    }
  }

  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      const subMapping = getTranslationMapping(obj[key], formatKey(key));

      for (const key in subMapping) {
        mapping[key] = subMapping[key];
      }
    } else {
      mapping[formatKey(key)] = obj[key];
    }
  }

  return mapping;
}

export function defineTranslations<
  const I extends TranslationItemRecord,
  const O extends TranslationRecord,
>(translations: { items: I; translations: O }): DefinedTranslations<I, O> {
  return new DefinedTranslations(translations);
}
