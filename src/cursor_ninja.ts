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
    private readonly foot: NinjaFoot,
    private readonly config: Config
  ) {}

  static from(
    context: ExtensionContext,
    editor: TextEditor,
    config: Config
  ): CursorNinja {
    return new CursorNinja(
      new NinjaEye(editor, config),
      new NinjaFoot(editor),
      config
    );
  }

  jumpIndent(direction: Direction) {
    return this.#jumpIndent({ direction, from: this.eye.currentLine });
  }

  #jumpIndent(param: {
    from: number;
    direction: Direction;
  }): number | undefined {
    const { direction, from } = param;
    const indent = this.eye.getIndent(from);

    const sp = indent === -1 && this.config.emptyLineBehavior === "nonempty";
    const toLine = this.eye.findLine(
      (l) =>
        sp ? this.eye.getIndent(l) !== -1 : this.eye.getIndent(l) === indent,
      { direction, from, cyclic: this.config.cyclic }
    );

    if (toLine != null) {
      this.foot.jump(toLine);
      return toLine;
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

  getIndent(line: number): number {
    const l = this.editor.document.lineAt(this.standarizeLineNumber(line));
    const indent = l.firstNonWhitespaceCharacterIndex;

    if (l.isEmptyOrWhitespace && indent == 0) {
      return -1;
    }

    return indent;
  }

  standarizeLineNumber(line: number): number {
    const a = line % this.lineCount;
    return a < 0 ? this.lineCount + a : a;
  }

  findLine(
    finder: (line: number) => boolean,
    option: { from: number; direction: Direction; cyclic: boolean }
  ): number | undefined {
    const { from, direction, cyclic } = option;

    const sign = direction === "down" ? 1 : -1;
    const length = cyclic
      ? this.lineCount - 1
      : direction === "down"
      ? this.lineCount - 1 - from
      : from;

    const targets = Array.from({ length }).map((_, i) =>
      this.standarizeLineNumber(from + (i + 1) * sign)
    );

    return targets.find((l) => finder(l));
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
