import {
  Range,
  Selection,
  TextEditor,
  TextEditorRevealType,
  TextLine,
} from "vscode";
import { createLazy, Lazy } from "../utils/lazy";
import { Config } from "../models/config";
import { Direction } from "../models/direction";

type FindLineParam = {
  from: number;
  indent: number;
  direction: Direction;
};

type ExTextLine = TextLine & { indent: number };

export class EditorRepo {
  private readonly lineCount: number;
  private readonly lineLoader: Lazy<ExTextLine>[];

  constructor(private readonly editor: TextEditor) {
    this.lineCount = editor.document.lineCount;
    this.lineLoader = Array.from({ length: editor.document.lineCount }).map(
      (_, i) =>
        createLazy(() => {
          const l = editor.document.lineAt(i);
          return {
            ...l,
            text: l.text,
            range: l.range,
            lineNumber: l.lineNumber,
            rangeIncludingLineBreak: l.rangeIncludingLineBreak,
            firstNonWhitespaceCharacterIndex:
              l.firstNonWhitespaceCharacterIndex,
            isEmptyOrWhitespace: l.isEmptyOrWhitespace,
            indent:
              /* l.isEmptyOrWhitespace && l.firstNonWhitespaceCharacterIndex == 0
                ? -1
                : */ l.firstNonWhitespaceCharacterIndex,
          };
        })
    );
  }

  #standarizeLineNumber(line: number): number {
    const a = line % this.lineCount;
    return a < 0 ? this.lineCount + a : a;
  }

  *#lineNumbers(option: {
    from: number;
    direction: Direction;
    cyclic: boolean;
  }): Generator<number, void, unknown> {
    const { from, direction: { sign }, cyclic } = option; // prettier-ignore

    for (let i = 1; i < this.lineCount; i++) {
      const lineNumber = this.#standarizeLineNumber(from + i * sign);
      if (!cyclic && lineNumber * sign < from * sign) {
        break;
      }
      yield lineNumber;
    }
  }

  *#findNextIndentMatchedLine(
    { from, indent, direction }: FindLineParam,
    { gapBehavior, ignoreLetters, ignoreRegExps }: Config
  ): Generator<number, number | undefined, unknown> {
    const lineNums = this.#lineNumbers({ from, cyclic: false, direction });

    for (const lineNum of lineNums) {
      const l = this.getLine(lineNum);

      if (
        ignoreLetters.length !== 0 &&
        ignoreLetters.reduce(
          (prev, current) => prev.replaceAll(current, ""),
          l.text
        ).length === 0
      ) {
        continue;
      }

      if (
        ignoreRegExps.length !== 0 &&
        ignoreRegExps.some((r) => new RegExp(r).test(l.text))
      ) {
        continue;
      }

      if (l.indent < indent) {
        if (gapBehavior === "parent") {
          return lineNum;
        }
        if (gapBehavior === "stop") {
          return;
        }
      }

      if (l.indent === indent) {
        yield lineNum;
      }
    }
  }

  getCurrentLineNum(): number {
    return this.editor.selection.active.line;
  }

  getLine(lineNumber: number): ExTextLine {
    return this.lineLoader[this.#standarizeLineNumber(lineNumber)].get();
  }

  getLineByIndent(param: FindLineParam, config: Config): number | undefined {
    const iter = this.#findNextIndentMatchedLine(param, config);
    const res = iter.next();
    if (res.value != null) {
      return res.value;
    }

    if (res.value == null && res.done && config.cyclic) {
      return [
        ...this.#findNextIndentMatchedLine(
          { ...param, direction: param.direction.reverse() },
          config
        ),
      ].at(-1);
    }
  }

  setCursorLine(to: number, scrollToCenter = false) {
    const toPosi = this.editor.selection.active.with(
      to,
      this.editor.selection.anchor.character
    );
    const selection = new Selection(toPosi, toPosi);
    const range = new Range(toPosi, toPosi);

    this.editor.selection = selection;
    this.editor.revealRange(
      range,
      scrollToCenter ? TextEditorRevealType.InCenter : undefined
    );
  }
}
