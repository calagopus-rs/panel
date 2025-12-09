import { defineTranslations, defineEnglishItem, DefinedTranslations } from 'shared';

const extensionTranslations = import.meta.glob?.('../extensions/*/src/translations.ts', { eager: true });

const baseTranslations = defineTranslations({
  items: {
    user: defineEnglishItem('User', 'Users'),
  },
  translations: {
    common: {
      button: {
        create: 'Create',
        add: 'Add',
        save: 'Save',
        saveAndStay: 'Save & Stay',
        delete: 'Delete',
        update: 'Update',
        close: 'Close',
        cancel: 'Cancel',
      },
      input: {
        search: 'Search...',
      },
      table: {
        pagination: {
          results: 'Showing {start} to {end} of {total} results.',
          empty: "No items could be found, it's almost like they are hiding.",
        },
      },
    },
  },
});

for (const [path, translations] of Object.entries(extensionTranslations ?? {})) {
  const identifier = path.split('/')[2];
  if (identifier === 'shared') continue;

  if (
    typeof translations === 'object' &&
    translations &&
    'default' in translations &&
    translations.default instanceof DefinedTranslations
  ) {
    translations.default.namespace = identifier.replaceAll('_', '.');
    baseTranslations.mergeFrom(translations.default);
  } else {
    console.error('Invalid frontend translations', identifier, translations);
  }
}

if (import.meta.env?.DEV) {
  console.debug('Initialized base translations', baseTranslations);
}

export default baseTranslations;
