export type Selector<T extends keyof any, R> = { [K in T]: R };

export function switcher<T extends keyof any, R>(
  selector: Selector<T, R>
): (t: T) => R {
  return (t: T) => selector[t];
}

export interface Lazy<T> {
  get: () => T;
}

export type LazyObj<T> = { [K in keyof T]: Lazy<T[K]> };

export const createLazy = <T>(generator: () => T): Lazy<T> => {
  let value: T | undefined;
  let resolved: boolean = false;

  return {
    get: () => {
      if (resolved) {
        return value as T;
      } else {
        value = generator();
        resolved = true;
        return value;
      }
    },
  };
};

export type LazyObjGenerator<T> = { [K in keyof T]: () => T[K] };

export function createLazyObj<T>(generators: LazyObjGenerator<T>): LazyObj<T> {
  return Object.fromEntries(
    Object.entries<() => unknown>(generators).map(([k, v]) => [
      k,
      createLazy(v),
    ])
  ) as LazyObj<T>;
}
