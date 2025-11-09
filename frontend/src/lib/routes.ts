export const to = (value: string, base: string = '') => {
  if (value === '/') {
    return base;
  }

  const clean = value
    .replace(/^\/+/, '') // remove leading slashes
    .replace(/\/\*$/, ''); // remove /*

  return `${base.replace(/\/+$/, '')}/${clean}`;
};
