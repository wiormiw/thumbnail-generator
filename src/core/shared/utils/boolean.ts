const toBoolean = (val: unknown): boolean => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const v = val.trim().toLowerCase();
    return ['true', 't', '1', 'yes', 'y'].includes(v);
  }
  return false;
};

export { toBoolean };
