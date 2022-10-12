import {
  ExtensionContext,
  Range,
  Selection,
  TextEditor,
  TextEditorRevealType,
  TextLine,
} from "vscode";
import { Config, LazyConfig } from "./config";
import { switcher } from "./util";

type Direction = "up" | "down";

export class CursorNinja {
  constructor(
    private readonly eye: NinjaEye,
    private readonly foot: NinjaFoot,
    private readonly config: LazyConfig
  ) {}

  static from(
    context: ExtensionContext,
    editor: TextEditor,
    config: LazyConfig
  ): CursorNinja {
    return new CursorNinja(new NinjaEye(editor), new NinjaFoot(editor), config);
  }

  jumpIndent(direction: Direction) {
    return this.#jumpIndent({ direction, from: this.eye.currentLine });
  }

  #jumpIndent(param: {
    from: number;
    direction: Direction;
  }): number | undefined {
    const indent = this.eye.getIndent(this.eye.getLineInfo(param.from));

    const ignore = this.config.ignore.get();

    const toLine = this.eye.findLine(
      (l) => {
        const line = this.eye.getLineInfo(l);
        const i = this.eye.getIndent(line);

        if (ignore.length !== 0) {
          let t = line.text;
          ignore.forEach((i) => (t = t.replaceAll(i, "")));
          if (t.length === 0) {
            return false;
          }
        }

        if (indent === -1) {
          return this.config.emptyLineBehavior.get() === "nonempty"
            ? i !== -1
            : i === -1;
        }

        if (i === -1) {
          return false;
        }

        return switcher<Config["gapBehavior"], boolean | number>({
          beyond: i === indent,
          parent: i <= indent,
          stop: i === indent ? true : i <= indent ? param.from : false,
        })(this.config.gapBehavior.get());
      },
      { ...param, cyclic: this.config.cyclic.get() }
    );

    if (toLine != null) {
      this.foot.jump(toLine);
      return toLine;
    }
  }

  jumpToNextEntity() {}

  scrollToCenterCursor() {
    this.foot.jump(this.eye.currentLine, TextEditorRevealType.InCenter);
  }
}

export class NinjaEye {
  public readonly lineCount: number;
  public readonly currentLine: number;

  constructor(private readonly editor: TextEditor) {
    this.lineCount = editor.document.lineCount;
    this.currentLine = editor.selection.active.line;
  }

  isValidLineNumber(line: number): boolean {
    return 0 <= line && line < this.lineCount;
  }

  getLineInfo(l: number): TextLine {
    return this.editor.document.lineAt(this.standarizeLineNumber(l));
  }

  getIndent(l: TextLine): number {
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

  getLines(option: {
    from: number;
    direction: Direction;
    cyclic: boolean;
  }): number[] {
    const { from, direction, cyclic } = option;

    const sign = direction === "down" ? 1 : -1;
    const length = cyclic
      ? this.lineCount - 1
      : direction === "down"
      ? this.lineCount - 1 - from
      : from;

    return Array.from({ length }).map((_, i) =>
      this.standarizeLineNumber(from + (i + 1) * sign)
    );
  }

  findLine(
    finder: (line: number) => boolean | number,
    option: Parameters<typeof this.getLines>[0]
  ): number | undefined {
    for (const l of this.getLines(option)) {
      const result = finder(l);
      if (typeof result === "boolean" && result) {
        return l;
      }

      if (typeof result === "number") {
        return result;
      }
    }
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
