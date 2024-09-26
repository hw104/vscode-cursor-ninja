import { commands, ExtensionContext, window, workspace } from "vscode";
import { Direction } from "./models/direction";
import { ConfigRepo } from "./repos/config_repo";
import { EditorRepo } from "./repos/editor_repo";
import { jumpBySymbolHandler } from "./usecases/jmp_by_symol/jump_by_symbol";
import {
  jumpToNextSymbol,
  jumpToPreviousSymbol,
} from "./usecases/jmp_by_symol/jump_next_symbol";
import {
  jumpToCurrentSymbolStart,
  jumpToFirstSiblingSymbol,
  jumpToLastSiblingSymbol,
  jumpToParentSymbol,
  jumpToSiblingSymbol,
} from "./usecases/jmp_by_symol/jump_to_next_s";
import { jumpByIndent } from "./usecases/jump_by_indent";
import { jumpEdgeOfIndent } from "./usecases/jump_edge_of_indent";

async function handler<T>(
  context: ExtensionContext,
  cb: (
    context: ExtensionContext,
    editorRepo: EditorRepo,
    configRepo: ConfigRepo
  ) => Promise<T>
): Promise<T | undefined> {
  const editor = window.activeTextEditor;
  if (editor == null) {
    return;
  }

  const editorRepo = new EditorRepo(editor);
  const configRepo = new ConfigRepo(workspace.getConfiguration("cursor-ninja"));

  try {
    return await cb(context, editorRepo, configRepo);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export function activate(context: ExtensionContext) {
  [
    commands.registerCommand("cursor-ninja.jumpIndentDown", () =>
      handler(context, async (_, editor, config) =>
        jumpByIndent(editor, config, Direction.next())
      )
    ),
    commands.registerCommand("cursor-ninja.jumpIndentUp", () =>
      handler(context, async (_, editor, config) =>
        jumpByIndent(editor, config, Direction.prev())
      )
    ),
    commands.registerCommand("cursor-ninja.jumpEdgeOfIndentDown", () =>
      handler(context, async (_, editor, config) =>
        jumpEdgeOfIndent(editor, config, Direction.next())
      )
    ),
    commands.registerCommand("cursor-ninja.jumpEdgeOfIndentUp", () =>
      handler(context, async (_, editor, config) =>
        jumpEdgeOfIndent(editor, config, Direction.prev())
      )
    ),
    commands.registerCommand("cursor-ninja.jumpToNextSiblingSymbol", () =>
      jumpBySymbolHandler((...arg) => jumpToSiblingSymbol(...arg, "next"))
    ),
    commands.registerCommand("cursor-ninja.jumpToPreviousSiblingSymbol", () =>
      jumpBySymbolHandler((...arg) => jumpToSiblingSymbol(...arg, "previous"))
    ),
    commands.registerCommand("cursor-ninja.jumpToNextParentSymbol", () =>
      jumpBySymbolHandler((...arg) => jumpToParentSymbol(...arg, "next"))
    ),
    commands.registerCommand("cursor-ninja.jumpToPreviousParentSymbol", () =>
      jumpBySymbolHandler((...arg) => jumpToParentSymbol(...arg, "previous"))
    ),
    commands.registerCommand("cursor-ninja.jumpToFirstSiblingSymbol", () =>
      jumpBySymbolHandler(jumpToFirstSiblingSymbol)
    ),
    commands.registerCommand("cursor-ninja.jumpToLastSiblingSymbol", () =>
      jumpBySymbolHandler(jumpToLastSiblingSymbol)
    ),
    commands.registerCommand("cursor-ninja.jumpToCurrentSymbolStart", () =>
      jumpBySymbolHandler(jumpToCurrentSymbolStart)
    ),
    commands.registerCommand("cursor-ninja.jumpToNextSymbol", () =>
      jumpBySymbolHandler(jumpToNextSymbol)
    ),
    commands.registerCommand("cursor-ninja.jumpToPreviousSymbol", () =>
      jumpBySymbolHandler(jumpToPreviousSymbol)
    ),
  ].forEach((cmd) => context.subscriptions.push(cmd));
}

export function deactivate() {}
