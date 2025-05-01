import { Position, Range, TextDocument } from "vscode";
import { compares } from "./position";
import { SymbolW, SymbolX } from "./symbols";
import { Tree } from "./tree";

export class SymbolTree extends Tree<SymbolW> {
  constructor(
    value: SymbolW,
    getChildren: (value: SymbolW) => Tree<SymbolW>[],
    private readonly document: TextDocument
  ) {
    super(value, getChildren);
  }

  static fromSymbols(symbols: SymbolX[], document: TextDocument): SymbolTree {
    const getChildren = (value: SymbolW): Tree<SymbolW>[] =>
      value.children
        ?.sort((a, b) => a.start.compareTo(b.start))
        .map((v) => new SymbolTree(v, getChildren, document)) ?? [];
    return new SymbolTree(
      new SymbolW(
        {
          name: "fileTopSymbol",
          kind: "fileTopSymbol",
          range: new Range(
            new Position(0, 0),
            document.validatePosition(new Position(Infinity, Infinity))
          ),
          children: symbols,
        },
        document
      ),
      getChildren,
      document
    );
  }

  findSmallestContainer(position: Position) {
    const indices = this.findIndicesDepth(
      (v) =>
        v.value.totalContains(position) &&
        (v.children.length === 0 ||
          v.children.every((c) => !c.value.totalContains(position)))
    );
    if (indices == null) {
      return { indices: [], target: this };
    }
    const target = this.at(indices)!;

    return { indices, target };
  }

  findPrevNextSibling(
    position: Position,
    smallestContainer: { target: Tree<SymbolW>; indices: number[] },
    dir: "prev" | "next"
  ) {
    if (
      dir === "prev" &&
      !smallestContainer.target.value.selectionContains(position) &&
      smallestContainer.target.isEmpty
    ) {
      return smallestContainer.target.value;
    }

    const isExact = smallestContainer.target.value.exactContain(position);

    if (isExact) {
      return this.of(smallestContainer.indices)
        .nextSibling(dir === "prev" ? -1 : 1)
        .get()?.value;
    }

    const comp = dir === "prev" ? compares.isBefore : compares.isAfter;
    return smallestContainer.target.children
      .sort(
        (a, b) =>
          a.value.start.compareTo(b.value.start) * (dir === "prev" ? -1 : 1)
      )
      .find((v) => comp(v.value.start)(position))?.value;
  }

  findFirstSibling(
    position: Position,
    smallestContainer: { target: Tree<SymbolW>; indices: number[] }
  ) {
    const isExact = smallestContainer.target.value.exactContain(position);

    if (isExact) {
      return this.of(smallestContainer.indices).firstSibling().get()?.value;
    }

    return this.of(smallestContainer.indices).firstChild().get()?.value;
  }

  findLastSibling(
    position: Position,
    smallestContainer: { target: Tree<SymbolW>; indices: number[] }
  ) {
    const isExact = smallestContainer.target.value.exactContain(position);

    if (isExact) {
      return this.of(smallestContainer.indices).lastSibling().get()?.value;
    }

    return this.of(smallestContainer.indices).lastChild().get()?.value;
  }

  findPrevNext(position: Position, dir: "prev" | "next") {
    const comp = dir === "prev" ? compares.isBefore : compares.isAfter;
    return this.flattenValue()
      .sort(
        (a, b) =>
          (a.selectionRange?.start ?? a.start).compareTo(
            b.selectionRange?.start ?? b.start
          ) * (dir === "prev" ? -1 : 1)
      )
      .find((v) => comp(v.selectionRange?.start ?? v.start)(position));
  }

  findPrevParent(
    cursorPosition: Position,
    smallestContainer: { target: Tree<SymbolW>; indices: number[] }
  ) {
    const isExact =
      smallestContainer.target.value.selectionContains(cursorPosition) ?? false;
    if (!isExact) {
      return smallestContainer.target.value;
    }

    return this.of(smallestContainer.indices).parent().get()?.value;
  }

  findNextParent(smallestContainer: {
    target: Tree<SymbolW>;
    indices: number[];
  }) {
    return this.of(smallestContainer.indices).parent().nextSibling().get()
      ?.value;
  }

  toString() {
    return super.toString((e) => e.toString(this.document.getText));
  }
}
