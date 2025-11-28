import * as baseDefinitions from '@/schema/definitions';
import { DatabaseDefinitions, DatabaseEnum, DatabaseTable } from '@/schema/table';
import { filesystem } from '@rjweb/utils';
import path from 'node:path';

const definitions = new DatabaseDefinitions();

for (const [key, definition] of Object.entries(baseDefinitions)) {
  if (definition instanceof DatabaseTable) {
    definitions.tables[definition.name] = definition;
  } else if (definition instanceof DatabaseEnum) {
    definitions.enums[definition.name] = definition;
  } else {
    console.error(`Invalid schema definition, ${key} is not a table or enum:`, definition);
  }
}

for (const file of filesystem.walk('./lib/schema/extensions', { async: false })) {
  if (file.name === '.gitkeep' || !file.name.endsWith('.js')) continue;

  // biome-ignore lint/style/noCommonJs: we are inside code transpiled to cjs, this is required (literally)
  const module = require(path.join(file.parentPath, file.name));

  if (typeof module === 'object' && module.default && typeof module.default === 'function') {
    module.default(definitions);
  } else {
    console.error(`Invalid extension module, ${file.name} does not export a default function`);
  }
}

for (const tableDef of Object.values(definitions.tables)) {
  exports[`table_${tableDef.name}`] = tableDef.intoDrizzleTable();
}
for (const enumDef of Object.values(definitions.enums)) {
  exports[`enum_${enumDef.name}`] = enumDef.intoDrizzleEnum();
}
