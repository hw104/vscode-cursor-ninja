import * as vscode from "vscode";
import {
  getSiblings,
  getSmallestSymbol,
  getSymbolOf,
  jumpAndReveal,
  jumpToSymbol,
  searchLongestRoutes,
  Symbol,
  toClosedRange,
} from "./jump_by_symbol";

export async function jumpToSiblingSymbol(
  symbols: Symbol[],
  position: vscode.Position | undefined,
  direction: "next" | "previous"
) {
  if (position == null) {
    return;
  }
  console.time();
  const to = _jumpToSiblingSymbol(parseSymbols(symbols), position, direction);
  console.timeEnd();
  if (to != null) {
    jumpAndReveal(to.position, to.range);
  }
}

export async function jumpToParentSymbol(
  symbols: Symbol[],
  position: vscode.Position | undefined,
  direction: "next" | "previous"
) {
  if (position == null) {
    return;
  }
  const smallest = getSmallestSymbol(symbols, position);
  if (smallest == null) {
    return;
  }

  const to = _jumpToSiblingSymbol(
    parseSymbols(symbols),
    smallest.parent != null && smallest.symbol.children.length === 0
      ? smallest.parent.selectionRange.end
      : smallest.symbol.selectionRange.end,
    direction
  );
  if (to != null) {
    jumpAndReveal(to.position, to.range);
  }
}

type SymbolEx = Symbol & {
  index: number;
  closedRange: vscode.Range;
};
function parseSymbols(symbols: Symbol[]): SymbolEx[] {
  return symbols.map((s, i) => ({
    ...s,
    index: i,
    closedRange: toClosedRange(
      new vscode.Range(s.selectionRange.start, s.range.end)
    ),
  }));
}

function _jumpToSiblingSymbol(
  symbols: SymbolEx[],
  position: vscode.Position,
  direction: "next" | "previous"
): { range: vscode.Range; position: vscode.Position } | undefined {
  const symbolsIncludeCursor = symbols.filter((s) =>
    s.closedRange.contains(position)
  );
  const smallestSymbolIncludeCursor = symbolsIncludeCursor
    .filter((s) =>
      symbolsIncludeCursor.every(
        (ss) =>
          s.index === ss.index ||
          s.range.isEqual(ss.range) ||
          !ss.range.contains(s.range)
      )
    )
    .at(0);
  if (
    smallestSymbolIncludeCursor != null &&
    smallestSymbolIncludeCursor.children.length !== 0 &&
    !smallestSymbolIncludeCursor.selectionRange.contains(position)
  ) {
    return _jumpToSiblingSymbol(
      parseSymbols(smallestSymbolIncludeCursor.children),
      position,
      direction
    );
  }

  const target = [
    ...symbols.filter((s) =>
      direction === "next"
        ? s.closedRange.start.compareTo(position) > 0
        : s.closedRange.start.compareTo(position) < 0
    ),
  ]
    .sort((a, b) => a.range.start.compareTo(b.range.start))
    .at(direction === "next" ? 0 : -1);
  if (target == null) {
    return;
  }

  return {
    range: target.range,
    position: target.selectionRange.start,
  };
}

export async function jumpToFirstSiblingSymbol(symbols: Symbol[]) {
  const indexes = searchLongestRoutes(
    symbols,
    vscode.window.activeTextEditor?.selection.active
  );
  if (indexes == null) {
    return;
  }

  const to = getSiblings(symbols, indexes).at(0);
  if (to != null) {
    jumpToSymbol(to);
  }
}

export async function jumpToLastSiblingSymbol(symbols: Symbol[]) {
  const indexes = searchLongestRoutes(
    symbols,
    vscode.window.activeTextEditor?.selection.active
  );
  if (indexes == null) {
    return;
  }

  const to = getSiblings(symbols, indexes).at(-1);
  if (to != null) {
    jumpToSymbol(to);
  }
}

export async function jumpToCurrentSymbolStart(symbols: Symbol[]) {
  const indexes = searchLongestRoutes(
    symbols,
    vscode.window.activeTextEditor?.selection.active
  );
  if (indexes == null) {
    return;
  }

  const to = getSymbolOf(symbols, indexes)!;
  if (to != null) {
    jumpToSymbol(to);
  }
}
