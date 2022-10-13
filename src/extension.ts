import {
  commands,
  ExtensionContext,
  TextEditor,
  window,
  workspace,
} from "vscode";
import { Config, LazyConfig } from "./config";
import { CursorNinja } from "./cursor_ninja";
import { createLazyObj } from "./util";

async function handler<T>(
  context: ExtensionContext,
  cb: (
    context: ExtensionContext,
    editor: TextEditor,
    config: LazyConfig
  ) => Promise<T>
): Promise<T | undefined> {
  const editor = window.activeTextEditor;
  if (editor == null) {
    return;
  }

  const config = workspace.getConfiguration("cursor-ninja");
  const configLoader = createLazyObj<Config>({
    cyclic: () => config.get("cyclic") as any,
    emptyLineBehavior: () => config.get("emptyLineBehavior") as any,
    gapBehavior: () => config.get("gapBehavior") as any,
    ignoreLetters: () => config.get("ignore") as any,
    ignoreRegExps: () => config.get("ignoreRegExps") as any,
  });

  try {
    return await cb(context, editor, configLoader);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export function activate(context: ExtensionContext) {
  [
    commands.registerCommand("cursor-ninja.jumpIndentDown", () =>
      handler(context, async (...arg) =>
        CursorNinja.from(...arg).jumpIndent("down")
      )
    ),
    commands.registerCommand("cursor-ninja.jumpIndentUp", () =>
      handler(context, async (...arg) =>
        CursorNinja.from(...arg).jumpIndent("up")
      )
    ),
    commands.registerCommand("cursor-ninja.scrollToCenterCursor", () =>
      handler(context, async (...arg) =>
        CursorNinja.from(...arg).scrollToCenterCursor()
      )
    ),
  ].forEach((cmd) => context.subscriptions.push(cmd));
}

export function deactivate() {}
