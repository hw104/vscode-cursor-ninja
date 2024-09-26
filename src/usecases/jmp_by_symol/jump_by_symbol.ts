import * as vscode from "vscode";

export interface Symbol {
  name: string;
  kind: "Variable" | string;
  location: {
    uri: {
      //   $mid: 1;
      fsPath: string; // "/Users/wadahironori/Develop/vscode-pad/main.ts";
      external: string; // "file:///Users/wadahironori/Develop/vscode-pad/main.ts";
      path: string; // "/Users/wadahironori/Develop/vscode-pad/main.ts";
      scheme: "file" | string;
    };
  };
  range: vscode.Range;
  containerName: string;
  children: Symbol[];
  selectionRange: vscode.DocumentSymbol["selectionRange"];
}

export function deepEqualSymbol(a: Symbol, b: Symbol): boolean {
  return (
    a.name === b.name &&
    a.kind === b.kind &&
    a.location.uri.fsPath === b.location.uri.fsPath &&
    a.range.isEqual(b.range) &&
    a.containerName === b.containerName &&
    a.children.length === b.children.length &&
    a.children.every((c, i) => deepEqualSymbol(c, b.children[i]))
  );
}

function compareSymbol(a: Symbol, b: Symbol): number {
  const start = a.range.start.compareTo(b.range.start);
  return start !== 0 ? start : a.range.end.compareTo(b.range.end);
}

async function _getSymbols(): Promise<Symbol[]> {
  const uri = vscode.window.activeTextEditor?.document.uri;
  if (uri == null) {
    return [];
  }
  const symbols = await vscode.commands.executeCommand(
    "vscode.executeDocumentSymbolProvider",
    uri
  );
  if (symbols == null) {
    return [];
  }
  if (!Array.isArray(symbols)) {
    throw new Error("symbols is not array");
  }
  return [...symbols].map((s) => ({ ...s }));
}

export function sortSymbols(symbols: Symbol[]): Symbol[] {
  return [...symbols].sort(compareSymbol).map((s) => {
    s.children = sortSymbols(s.children);
    return s;
  });
}

export async function getSymbols(): Promise<Symbol[]> {
  return sortSymbols(await _getSymbols());
}

export function flatSymbols(symbols: Symbol[]): Symbol[] {
  return symbols
    .map((s) => [s, ...(s.children.length > 0 ? flatSymbols(s.children) : [])])
    .flat();
}

export function searchRoutes(
  symbols: Symbol[],
  position: vscode.Position | undefined
): number[][] {
  if (position == null) {
    return [];
  }

  return position == null
    ? []
    : symbols
        .map((symbol, i) =>
          symbol.range.contains(position)
            ? [
                [i],
                ...(symbol.children.length > 0
                  ? searchRoutes(symbol.children, position).map((e) => [
                      i,
                      ...e,
                    ])
                  : []),
              ]
            : []
        )
        .flat();
}

export function searchLongestRoutes(
  symbols: Symbol[],
  position: vscode.Position | undefined
): number[] | undefined {
  const routes = searchRoutes(symbols, position);
  return routes.reduce<number[] | undefined>(
    (prev, cur) => (cur.length > (prev?.length ?? 0) ? cur : prev),
    undefined
  );
}

export function getSymbolOf(
  symbols: Symbol[],
  indexes: number[]
): Symbol | undefined {
  const reversed = [...indexes].reverse();
  let i: number | undefined;
  let symbol: Symbol | undefined;
  while ((i = reversed.pop()) != null) {
    symbol = (symbol?.children ?? symbols)[i];
  }

  return symbol;
}

export function getParent(
  symbols: Symbol[],
  indexes: number[]
): Symbol | undefined {
  if (indexes.length === 1) {
    return undefined;
  }

  return getSymbolOf(symbols, indexes.slice(0, -1));
}

export function getSiblings(symbols: Symbol[], indexes: number[]): Symbol[] {
  if (indexes.length === 1) {
    return symbols;
  }

  return getParent(symbols, indexes)?.children ?? [];
}

export function jumpToSymbol(symbol: Symbol) {
  jumpToSymbolStartOrEnd(symbol, "start");
}

export function jumpToSymbolStartOrEnd(
  symbol: Symbol,
  direction: "start" | "end"
) {
  jumpAndReveal(
    direction === "start" ? symbol.range.start : symbol.range.end,
    new vscode.Range(symbol.range.start, symbol.range.end)
  );
}

export function jumpAndReveal(position: vscode.Position, range: vscode.Range) {
  vscode.window.activeTextEditor!.selection = new vscode.Selection(
    position,
    position
  );
  vscode.window.activeTextEditor?.revealRange(
    new vscode.Range(range.start, range.end),
    vscode.TextEditorRevealType.Default
  );
}

export function selectSymbol(symbol: Symbol) {
  vscode.window.activeTextEditor!.selection = new vscode.Selection(
    symbol.range.start,
    symbol.range.end
  );
}

export function findNextSymbolByStart(
  symbols: Symbol[],
  position: vscode.Position
): Symbol | undefined {
  return sortSymbols(symbols).find(
    (s) => s.range.start.compareTo(position) > 0
  );
}

export function findPreviousSymbolByStart(
  symbols: Symbol[],
  position: vscode.Position
): Symbol | undefined {
  return [...sortSymbols(symbols)]
    .reverse()
    .find((s) => s.range.start.compareTo(position) < 0);
}

export async function jumpBySymbolHandler(
  f: (s: Symbol[], position: vscode.Position | undefined) => Promise<void>
) {
  try {
    await f(
      await getSymbols(),
      vscode.window.activeTextEditor?.selection.active
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export function toClosedRange(range: vscode.Range): vscode.Range {
  return new vscode.Range(range.start, range.end.translate(undefined, -1));
}

export function getSmallestSymbol(
  from: Symbol[] | Symbol,
  position: vscode.Position
): { parent?: Symbol; symbol: Symbol } | undefined {
  const symbols = Array.isArray(from) ? from : from.children;
  const parent = Array.isArray(from) ? undefined : from;
  const symbol = symbols.find((s) =>
    new SymbolWrap(s).bodyRange.contains(position)
  );
  if (symbol == null) {
    return undefined;
  }
  return getSmallestSymbol(symbol, position) ?? { parent, symbol };
}

export class SymbolWrap {
  constructor(public readonly symbol: Symbol) {}

  get bodyRange() {
    return new vscode.Range(
      this.symbol.selectionRange.end,
      this.symbol.range.end
    );
  }

  get nameRange() {
    return this.symbol.selectionRange;
  }
}
