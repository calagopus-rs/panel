export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const toSnakeCase = (str: string): string => {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
};

export const transformKeysToCamelCase = <T>(obj: any): T => {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeysToCamelCase(item)) as unknown as T;
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = toCamelCase(key);
        newObj[newKey] = transformKeysToCamelCase(obj[key]);
      }
    }
    return newObj as T;
  }
  return obj;
};

export const transformKeysToSnakeCase = <T>(obj: any): T => {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeysToSnakeCase(item)) as unknown as T;
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const newKey = toSnakeCase(key);
        newObj[newKey] = transformKeysToSnakeCase(obj[key]);
      }
    }
    return newObj as T;
  }
  return obj;
};
