import * as vscode from "vscode";
import { Command, CommandMiddleware } from "../command/command";
import { ensureActiveEditor, jumpAndRevealCursor } from "../lib/editor";
import { getCursorPosition } from "../lib/position";
import { SymbolTree } from "../lib/symbol_tree";
import { getSymbols } from "../lib/symbols";

export class JumpToNextSymbolCommand extends Command {
  constructor(
    context: vscode.ExtensionContext,
    command: string,
    private readonly direction: "prev" | "next",
    middlewares: CommandMiddleware<unknown>[] = []
  ) {
    super(context, command, middlewares);
  }

  async execute() {
    const editor = ensureActiveEditor();
    const cursorPosition = getCursorPosition(editor);
    const symbols = await getSymbols(editor);
    const tree = SymbolTree.fromSymbols(symbols, editor.document);

    const smallestContainer = tree.findSmallestContainer(cursorPosition);
    if (smallestContainer == null) {
      return;
    }

    const target = tree.findPrevNext(cursorPosition, this.direction);

    if (target == null) {
      return;
    }

    jumpAndRevealCursor(
      editor,
      target.selectionRange?.start ?? target.start,
      target.totalRange
    );
  }
}
