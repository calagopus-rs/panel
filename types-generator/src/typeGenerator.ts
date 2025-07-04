import { oas31 } from "openapi3-ts";

export function generateTypes(spec: oas31.OpenAPIObject) {
  let typeFile = "";

  for (const [schemaName, schema] of Object.entries(
    spec.components?.schemas!
  )) {
    if (oas31.isReferenceObject(schema)) {
      continue;
    }

    if (schema.enum) {
      typeFile += generateEnum(schemaName, schema);
    } else if (schema.type === "object") {
      typeFile += generateSchemaObject(schemaName, schema);
    }

    typeFile += "\n";
  }

  return typeFile;
}

function generateEnum(schemaKey: string, schema: oas31.SchemaObject) {
  return `type ${schemaKey} = ${schema
    .enum!.map((v) => `'${v}'`)
    .join(" | ")};`;
}

function generateSchemaObject(
  schemaKey: string,
  schema: oas31.SchemaObject,
  nested = false
) {
  let returnString = "";
  if (nested) {
    returnString += "{\n";
  } else {
    returnString += `interface ${schemaKey} {\n`;
  }

  if (!schema.properties) {
    console.warn(schema);
    return;
  }

  for (const [propertyName, property] of Object.entries(schema.properties)) {
    returnString += `  ${propertyName}: ${convertType(
      propertyName,
      property
    )};\n`;
  }

  returnString += "}";
  return returnString;
}

function convertType(
  propertyName: string,
  property: oas31.SchemaObject | oas31.ReferenceObject
) {
  if (oas31.isReferenceObject(property)) {
    return convertReference(property);
  }

  switch (property.type) {
    case "integer":
    case "number":
      return "number";
    case "string":
      return "string";
    case "boolean":
      return "boolean";
    case "object":
      return generateSchemaObject(propertyName, property, true);
    case "null":
      return "null";
    case "array":
      return `${generateSchemaObject(propertyName, property, true)}[]`;
  }
}

function convertReference(property: oas31.ReferenceObject) {
  return property.$ref!.split("/").at(-1)!;
}
