export const CommonHelpers = {
  toCamelCase<T>(obj: T): T {
    if (Array.isArray(obj)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return obj.map((item) => CommonHelpers.toCamelCase(item)) as unknown as T;
    }

    if (!obj || typeof obj !== 'object') return obj;

    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        String(letter).toUpperCase(),
      );
      (acc as Record<string, unknown>)[camelKey] = CommonHelpers.toCamelCase(
        (obj as Record<string, unknown>)[key],
      );
      return acc;
    }, {} as T);
  },
};
