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
    const from = this.eye.currentLine;

    return this.#jumpIndent({ direction, from });
  }

  #jumpIndent(param: {
    from: number;
    direction: Direction;
  }): number | undefined {
    const { direction, from } = param;
    const indent = this.eye.getIndent(from);
    if (indent == null) {
      throw new Error(`Invalid current line: ${from}`);
    }

    const sp = indent === -1 && this.config.emptyLineBehavior === "nonempty";
    const toLine = this.eye.findLine(
      (l) =>
        sp ? this.eye.getIndent(l) !== -1 : this.eye.getIndent(l) === indent,
      { direction, from, includeFrom: false, cyclic: this.config.cyclic }
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
    if (!this.isValidLineNumber(line)) {
      throw new Error(
        `line ${line} is out of range: 0 ~ ${this.lineCount - 1}`
      );
    }
    const l = this.editor.document.lineAt(line);
    const indent = l.firstNonWhitespaceCharacterIndex;

    [].indexOf;

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
    option: {
      from: number;
      direction: Direction;
      includeFrom: boolean;
      cyclic: boolean;
    }
  ): number | undefined {
    const { from, direction, includeFrom, cyclic } = option;
    const sign = direction === "down" ? 1 : -1;
    const length = direction === "down" ? this.lineCount - 1 - from : from;
    const add = includeFrom ? 0 : 1;

    const targets = Array.from({
      length: (cyclic ? this.lineCount : length) - add,
    })
      .map((_, i) => i + add)
      .map((i) => from + i * sign)
      .map((i) => this.standarizeLineNumber(i));

    console.log("targets", targets);

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
