import {
  ExtensionContext,
  Range,
  Selection,
  TextEditor,
  TextEditorRevealType,
} from "vscode";
import { Config } from "./config";

type Direction = "up" | "down";

export class CursorNinja {
  constructor(
    private readonly eye: NinjaEye,
    private readonly foot: NinjaFoot
  ) {}

  static from(
    context: ExtensionContext,
    editor: TextEditor,
    config: Config
  ): CursorNinja {
    return new CursorNinja(new NinjaEye(editor, config), new NinjaFoot(editor));
  }

  jumpIndent(direction: Direction) {
    const currentLine = this.eye.currentLine;
    const currentIndent = this.eye.getIndent(currentLine);
    const toLine =
      currentIndent != null
        ? this.eye.findLine((l) => this.eye.getIndent(l) === currentIndent, {
            direction,
            from: currentLine,
          })
        : undefined;

    console.table({ currentLine, currentIndent, toLine });

    if (toLine != null) {
      this.foot.jump(toLine);
    }
  }

  scrollToCenterCursor() {
    this.foot.jump(this.eye.currentLine, TextEditorRevealType.InCenter);
  }
}

export class NinjaEye {
  public readonly lineCount: number;
  public readonly currentLine: number;

  constructor(
    private readonly editor: TextEditor,
    private readonly config: Config
  ) {
    this.lineCount = editor.document.lineCount;
    this.currentLine = editor.selection.active.line;
  }

  isValidLineNumber(line: number): boolean {
    return 0 <= line && line < this.lineCount;
  }

  /**
   * Returns the number of spaces used as indent. or -1 if line is empty.
   */
  getIndent(line: number): number | undefined {
    if (!this.isValidLineNumber(line)) {
      return;
    }
    const l = this.editor.document.lineAt(line);
    const indent = l.firstNonWhitespaceCharacterIndex;

    [].indexOf;

    if (l.isEmptyOrWhitespace && indent == 0) {
      return -1;
    }

    return indent;
  }

  findLine(
    finder: (line: number) => boolean,
    param: {
      from: number;
      direction: Direction;
    }
  ): number | undefined {
    const { from, direction } = param;
    const sign = direction === "down" ? 1 : -1;
    const length = direction === "down" ? this.lineCount - 1 - from : from;

    const hoge = Array.from({ length }).map((_, i) => from + (i + 1) * sign);
    console.log("hoge", hoge);
    return hoge.find((l) => finder(l));
  }
}

export class NinjaFoot {
  constructor(private readonly editor: TextEditor) {}

  jump(to: number, revealType?: TextEditorRevealType) {
    const toPosi = this.editor.selection.active.with(
      to,
      this.editor.selection.anchor.character
    );
    const selection = new Selection(toPosi, toPosi);
    const range = new Range(toPosi, toPosi);

    this.editor.selection = selection;
    this.editor.revealRange(range, revealType);
  }
}
