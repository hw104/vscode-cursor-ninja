import { commands, Position, Range, TextDocument, TextEditor } from "vscode";
import { rangeToString } from "./position";
import { Tree } from "./tree";

type FileTopSymbol = {
  name: "fileTopSymbol";
  kind: "fileTopSymbol";
  range: Range;
  selectionRange?: undefined;
  children: SymbolX[];
};
export type SymbolX = {
  name: string;
  kind: string;
  range?: Range;
  selectionRange?: Range;
  children?: SymbolX[];
};
export type SymbolTreeNode = FileTopSymbol | SymbolX;

export async function getSymbols(editor: TextEditor): Promise<SymbolX[]> {
  const uri = editor.document.uri;
  if (uri == null) {
    return [];
  }
  const symbols = await commands.executeCommand(
    "vscode.executeDocumentSymbolProvider",
    uri
  );
  if (symbols == null) {
    return [];
  }
  if (!Array.isArray(symbols)) {
    throw new Error("symbols is not array");
  }
  return symbols;
}

export class SymbolW {
  public readonly totalRange: Range;
  public readonly children: SymbolW[];
  public readonly name: string;
  public readonly kind: string;
  public readonly range?: Range;
  public readonly selectionRange?: Range;

  public readonly start: Position;
  public readonly end: Position;

  public readonly selectionRangeIsRange: boolean;

  constructor(
    private readonly symbol: SymbolTreeNode,
    private readonly document: TextDocument
  ) {
    this.children = (symbol.children ?? []).map(
      (v) => new SymbolW(v, document)
    );
    this.name = symbol.name;
    this.kind = symbol.kind;
    this.range = symbol.range;
    this.selectionRange = symbol.selectionRange;

    const starts = [symbol.selectionRange?.start, symbol.range?.start].filter(
      (v) => v != null
    );
    if (starts.length === 0) {
      throw new Error("start is null");
    }
    const ends = [symbol.selectionRange?.end, symbol.range?.end].filter(
      (v) => v != null
    );
    if (ends.length === 0) {
      throw new Error("end is null");
    }
    this.start = starts.reduce((a, b) => (a.isBefore(b) ? a : b));
    this.end = ends.reduce((a, b) => (a.isAfter(b) ? a : b));
    this.totalRange = new Range(this.start, this.end);

    this.selectionRangeIsRange =
      this.selectionRange != null &&
      this.range != null &&
      this.selectionRange.isEqual(this.range);
  }

  toString(getText?: (r: Range) => string) {
    const symbol = this.symbol;
    const previewRange = symbol.selectionRange ?? symbol.range;
    const toPreviewRange =
      previewRange != null && previewRange.start.line === previewRange.end.line;

    return [
      `${symbol.name}(${symbol.children?.length ?? 0})`,
      toPreviewRange ? getText?.(previewRange!) : null,
      symbol.selectionRange != null
        ? `sRange=${rangeToString(symbol.selectionRange)}`
        : "",
      symbol.range != null ? `range=${rangeToString(symbol.range)}` : "",
    ]
      .filter((e) => e)
      .join(" ");
  }

  totalContains(position: Position | Range) {
    return this.#contains(this.totalRange, position);
  }

  selectionContains(position: Position | Range) {
    return this.selectionRange == null
      ? undefined
      : this.#contains(this.selectionRange, position);
  }

  rangeContains(position: Position | Range) {
    return this.range == null
      ? undefined
      : this.#contains(this.range, position);
  }

  #contains(range: Range, position: Position | Range) {
    if (range.isEmpty) {
      return range.contains(position);
    }
    if (range.end.character !== 0) {
      return this.document
        .validateRange(new Range(range.start, range.end.translate(0, -1)))
        .contains(position);
    }
    if (range.end.line !== 0) {
      return this.document
        .validateRange(
          new Range(range.start, range.end.translate(-1, Infinity))
        )
        .contains(position);
    }
    return range.contains(position);
  }

  exactContain(position: Position) {
    return (
      (this.selectionContains(position) ?? false) || this.children.length === 0
    );
  }
}
