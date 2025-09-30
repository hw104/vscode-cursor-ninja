import * as vscode from "vscode";
import { Command, CommandMiddleware } from "../command/command";
import { ensureActiveEditor, jumpAndRevealCursor } from "../lib/editor";
import { useCacheAsync } from "../lib/memory_cache";
import { getCursorPosition } from "../lib/position";
import { SymbolTree } from "../lib/symbol_tree";
import { getSymbols, getSymbolsCacheKey } from "../lib/symbols";
import { ToggleDebugCommand } from "./toggle-debug";

export class JumpToSiblingSymbolCommand extends Command {
  constructor(
    context: vscode.ExtensionContext,
    command: string,
    private readonly direction: "prev" | "next",
    middlewares: CommandMiddleware<unknown>[] = []
  ) {
    super(context, command, middlewares);
  }

  async execute() {
    const output = ToggleDebugCommand.isDebug
      ? vscode.window.createOutputChannel(this.command, {
          log: true,
        })
      : undefined;

    const editor = ensureActiveEditor();
    const cursorPosition = getCursorPosition(editor);
    const symbolsKey = getSymbolsCacheKey(editor);
    const tree = await useCacheAsync(symbolsKey, async () =>
      SymbolTree.fromSymbols(await getSymbols(editor), editor.document)
    );

    output?.show(true);
    output?.appendLine("tree:\n" + tree.toString());
    output?.appendLine("cursorPosition:" + cursorPosition);

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
