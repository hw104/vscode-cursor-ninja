export class Tree<T> {
  public readonly value: T;
  public readonly children: Tree<T>[];

  public readonly isEmpty: boolean;

  constructor(value: T, getChildren: (value: T) => Tree<T>[]) {
    this.value = value;
    this.children = getChildren(this.value);
    this.isEmpty = this.children.length === 0;
  }

  static from<V>(value: V, getRawChildren: (value: V) => V[]): Tree<V> {
    const getChildren = (value: V): Tree<V>[] => {
      return getRawChildren(value).map((v) => new Tree(v, getChildren));
    };
    return new Tree(value, getChildren);
  }

  map<U>(fn: (value: T) => U): Tree<U> {
    return new Tree(fn(this.value), () =>
      this.children.map((child) => child.map(fn))
    );
  }

  atChildren(index: number, allowNegative = true): Tree<T> | undefined {
    return allowNegative ? this.children.at(index) : this.children[index];
  }

  at(indices: number[] | undefined, allowNegative = true): Tree<T> | undefined {
    if (indices == null) {
      return undefined;
    }
    if (indices.length === 0) {
      return this;
    }
    if (indices.length === 1) {
      return this.atChildren(indices[0], allowNegative);
    }
    const [index, ...rest] = indices;
    return this.atChildren(index, allowNegative)?.at(rest, allowNegative);
  }

  of(_indices: number[]) {
    const indicesOps = (indices: number[]) => {
      const ancestor = (amount = 1) => indices.slice(0, -1 * amount);
      const sibling = (amount: number) => [...indices.slice(0, -1), amount];
      const next = (amount = 1) => sibling(indices.at(-1)! + amount);
      const child = (amount: number) => [...indices, amount];

      const res = {
        ancestor: (n: number) => indicesOps(ancestor(n)),
        parent: () => indicesOps(ancestor(1)),

        siblingAt: (n: number) => indicesOps(sibling(n)),
        firstSibling: () => indicesOps(sibling(0)),
        lastSibling: () =>
          indicesOps(
            sibling((this.of(indices).parent().get()?.children.length ?? 0) - 1)
          ),
        nextSibling: (n?: number) => indicesOps(next(n)),
        prevSibling: (n: number = 1) => indicesOps(next(-1 * n)),

        childAt: (n: number) => indicesOps(child(n)),
        firstChild: () => indicesOps(child(0)),
        lastChild: () =>
          indicesOps(child((this.of(indices).get()?.children.length ?? 0) - 1)),

        get: () => this.at(indices, false),
        indices,
      };

      return {
        ...res,
        sibling: res.siblingAt,
        first: res.firstSibling,
        last: res.lastSibling,
        next: res.nextSibling,
        prev: res.prevSibling,
        child: res.childAt,
        nth: res.childAt,
      };
    };

    return indicesOps(_indices);
  }

  atOffset(indices: number[], reversedOffset: number): Tree<T> | undefined {
    const newIndices = indices.map((i, ii) =>
      ii === indices.length - 1 ? i + reversedOffset : i
    );

    return this.at(newIndices, false);
  }

  findIndices(
    fn: (node: Tree<T>, indices: number[]) => boolean,
    opts: {
      strategy: "depth" | "breadth"; //  = "depth",
      direction: "ltr" | "rtl"; // = "ltr",
      indicesParent: number[]; // = []
    } = {
      strategy: "depth",
      direction: "ltr",
      indicesParent: [],
    }
  ): number[] | undefined {
    const { strategy, indicesParent, direction } = opts;

    for (
      let i = direction === "ltr" ? 0 : this.children.length - 1;
      direction === "ltr" ? i < this.children.length : i >= 0;
      direction === "ltr" ? i++ : i--
    ) {
      const child = this.children[i];
      const indices = [...indicesParent, i];
      const res = fn(child, indices);
      if (res) {
        return indices;
      }

      if (strategy === "depth") {
        const res = child.findIndices(fn, {
          strategy,
          indicesParent: indices,
          direction,
        });
        if (res != null) {
          return res;
        }
      }
    }

    if (strategy === "breadth") {
      for (
        let i = direction === "ltr" ? 0 : this.children.length - 1;
        direction === "ltr" ? i < this.children.length : i >= 0;
        direction === "ltr" ? i++ : i--
      ) {
        const child = this.children[i];
        const indices = [...indicesParent, i];
        const res = child.findIndices(fn, {
          strategy,
          indicesParent: indices,
          direction,
        });
        if (res != null) {
          return res;
        }
      }
    }

    return undefined;
  }

  findIndicesDepth(
    fn: (node: Tree<T>, indices: number[]) => boolean,
    direction: "ltr" | "rtl" = "ltr"
  ): number[] | undefined {
    return this.findIndices(fn, {
      strategy: "depth",
      direction,
      indicesParent: [],
    });
  }

  findIndicesBreadth(
    fn: (node: Tree<T>, indices: number[]) => boolean,
    direction: "ltr" | "rtl" = "ltr"
  ): number[] | undefined {
    return this.findIndices(fn, {
      strategy: "breadth",
      direction,
      indicesParent: [],
    });
  }

  filterChildren(fn: (node: T) => boolean): Tree<T> {
    return new Tree(this.value, () =>
      this.children
        .filter((child) => fn(child.value))
        .map((c) => c.filterChildren(fn))
    );
  }

  flattenValue(): T[] {
    return [
      this.value,
      ...this.children.flatMap((child) => child.flattenValue()),
    ];
  }

  flatten(): Tree<T>[] {
    return [this, ...this.children.flatMap((child) => child.flatten())];
  }

  toJson(): object {
    return {
      value: this.value,
      children: this.children.map((child) => child.toJson()),
    };
  }

  toStrings(fn: (v: T) => string = (v) => String(v)): string[] {
    const s = [
      fn(this.value),
      ...this.children.flatMap((c) => c.toStrings(fn).map((v) => ` ${v}`)),
    ];
    return s;
  }

  toString(fn: (v: T) => string = (v) => String(v)): string {
    return this.toStrings(fn).join("\n");
  }
}
