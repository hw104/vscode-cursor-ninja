import * as vscode from "vscode";
import { Command, CommandMiddleware } from "../command/command";
import { ensureActiveEditor, jumpAndRevealCursor } from "../lib/editor";
import { useObjCacheAsync } from "../lib/memory_cache";
import { getCursorPosition } from "../lib/position";
import { SymbolTree } from "../lib/symbol_tree";
import { getSymbols, getSymbolsCacheKey } from "../lib/symbols";
import { ToggleDebugCommand } from "./toggle-debug";

export class JumpToSiblingSymbolCommand extends Command {
  isDev: boolean;
  constructor(
    context: vscode.ExtensionContext,
    command: string,
    private readonly direction: "prev" | "next",
    middlewares: CommandMiddleware<unknown>[] = []
  ) {
    super(context, command, middlewares);
    this.isDev =
      this.context.extensionMode === vscode.ExtensionMode.Development;
  }

  async execute() {
    const output =
      ToggleDebugCommand.isDebug || this.isDev
        ? vscode.window.createOutputChannel(this.command, {
            log: true,
          })
        : undefined;

    if (this.isDev) {
      output?.show(true);
    }

    const editor = ensureActiveEditor();
    const cursorPosition = getCursorPosition(editor);
    const symbolsKey = getSymbolsCacheKey(editor);
    const symbols = await useObjCacheAsync(symbolsKey, () =>
      getSymbols(editor)
    );
    console.time("create SymbolTree");
    const tree = SymbolTree.fromSymbols(symbols, editor.document);
    console.timeEnd("create SymbolTree");

    output?.appendLine(`----- ${this.command}(${this.direction}) -----`);
    output?.appendLine(symbolsKey);
    output?.appendLine("tree:\n" + tree.toString());
    output?.appendLine("cursorPosi:" + JSON.stringify(cursorPosition, null, 2));

    const smallestContainer = tree.findSmallestContainer(cursorPosition);
    output?.appendLine(
      "smallestContainer: " + JSON.stringify(smallestContainer, null, 2)
    );
    if (smallestContainer == null) {
      return;
    }

    const sibling = tree.findPrevNextSibling(
      cursorPosition,
      smallestContainer,
      this.direction
    );
    output?.appendLine("sibling: " + sibling?.toString());

    if (sibling == null) {
      return;
    }

    jumpAndRevealCursor(
      editor,
      sibling.selectionRange?.start ?? sibling.start,
      sibling.totalRange
    );
    output?.appendLine("jumped");
  }
}
