export type Lazy<T> = { get: () => T };

export const createLazy = <T>(generator: () => T): Lazy<T> => {
  const iterator = (function* () {
    const res = generator();
    for (;;) yield res;
  })();

  return { get: () => iterator.next().value };
};
