import { Range, Selection, TextEditor } from "vscode";

export class CursorNinja {
  private readonly lineCount: number;

  constructor(private readonly editor: TextEditor) {
    this.lineCount = editor.document.lineCount;
  }

  static from(editor: TextEditor | undefined): CursorNinja | undefined {
    return editor != null ? new CursorNinja(editor) : undefined;
  }

  isValidLineNumber(line: number): boolean {
    return 0 < line && line < this.lineCount;
  }

  getIndent(line: number): number | undefined {
    return this.isValidLineNumber(line)
      ? this.editor.document.lineAt(line).firstNonWhitespaceCharacterIndex
      : undefined;
  }

  findLineByIndent(param: {
    from: number;
    indent: number;
    direction: "up" | "down";
  }): number | undefined {
    const { from, indent, direction } = param;
    const sign = direction === "down" ? 1 : -1;
    const length = direction === "down" ? this.lineCount - 1 - from : from;

    return Array.from({ length })
      .map((_, i) => from + (i + 1) * sign)
      .find((line) => this.getIndent(line) == indent);
  }

  jump(to: number) {
    const toPosi = this.editor.selection.active.with(
      to,
      this.editor.selection.anchor.character
    );
    const selection = new Selection(toPosi, toPosi);
    const range = new Range(toPosi, toPosi);

    this.editor.selection = selection;
    this.editor.revealRange(range);
  }

  jumpIndent(direction: "up" | "down"): boolean {
    const from = this.editor.selection.active.line;
    const indent = this.getIndent(from);
    if (indent == null) {
      return false;
    }
    const to = this.findLineByIndent({ from, indent, direction });
    if (to == null) {
      return false;
    }

    this.jump(to);
    return true;
  }
}
