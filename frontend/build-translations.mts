import fs from 'node:fs/promises';
import { DefinedTranslations } from 'shared';

const { default: baseTranslations } = await import('./src/translations.ts');
const translationFiles = fs.glob('extensions/*/src/translations.ts');

for await (const path of translationFiles) {
  const identifier = path.split('/')[1];
  const translations = await import(`./${path}`);

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

await fs.mkdir('public/translations', { recursive: true });
await fs.writeFile('public/translations/en-US.json', JSON.stringify(baseTranslations.subTranslations, null, 2));
