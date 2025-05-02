import { window } from "vscode";
import { Command } from "../command/command";
import { ensureActiveEditor } from "../lib/editor";
import { useCacheAsync } from "../lib/memory_cache";
import { getCursorPosition, positionToString } from "../lib/position";
import { SymbolTree } from "../lib/symbol_tree";
import { getSymbols, getSymbolsCacheKey } from "../lib/symbols";

export class DebugSymbolsCommand extends Command {
  async execute() {
    const editor = ensureActiveEditor();
    const cursorPosition = getCursorPosition(editor);
    const symbolsKey = getSymbolsCacheKey(editor);
    const tree = await useCacheAsync(symbolsKey, async () =>
      SymbolTree.fromSymbols(await getSymbols(editor), editor.document)
    );
    const output = window.createOutputChannel(this.command, { log: true });

    output.show(true);
    output.appendLine("tree:\n" + tree.toString());
    output.appendLine("cursorPosition:" + positionToString(cursorPosition));

    const smallestContainer = tree.findSmallestContainer(cursorPosition);

    const prevSibling = tree.findPrevNextSibling(
      cursorPosition,
      smallestContainer,
      "prev"
    );
    const nextSibling = tree.findPrevNextSibling(
      cursorPosition,
      smallestContainer,
      "next"
    );
    const prev = tree.findPrevNext(cursorPosition, "prev");
    const next = tree.findPrevNext(cursorPosition, "next");
    const prevParent = tree.findPrevParent(cursorPosition, smallestContainer);
    const nextParent = tree.findNextParent(smallestContainer);
    const firstSibling = tree.findFirstSibling(
      cursorPosition,
      smallestContainer
    );
    const lastSibling = tree.findLastSibling(cursorPosition, smallestContainer);

    const result = {
      smallestContainer: smallestContainer.target.value,
      prevSibling,
      nextSibling,
      prev,
      next,
      prevParent,
      nextParent,
      firstSibling,
      lastSibling,
    };

    for (const [key, value] of Object.entries(result)) {
      output.appendLine(`${key}:` + value?.toString(editor.document.getText));
    }
  }
}
