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
  vscode.window.activeTextEditor!.selection = new vscode.Selection(
    symbol.range.start,
    symbol.range.start
  );
  vscode.window.activeTextEditor?.revealRange(
    new vscode.Range(symbol.range.start, symbol.range.end),
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

export async function jumpBySymbolHandler(f: (s: Symbol[]) => Promise<void>) {
  try {
    await f(await getSymbols());
  } catch (error) {
    console.error(error);
    throw error;
  }
}

