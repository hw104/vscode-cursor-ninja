import {
  commands,
  ExtensionContext,
  workspace,
  TextEditor,
  window,
} from "vscode";
import { Config } from "./config";
import { CursorNinja } from "./cursor_ninja";

async function handler<T>(
  context: ExtensionContext,
  cb: (
    context: ExtensionContext,
    editor: TextEditor,
    config: Config
  ) => Promise<T>
): Promise<T | undefined> {
  const editor = window.activeTextEditor;
  if (editor == null) {
    return;
  }

  try {
    return await cb(context, editor, {
      emptyLineBehavior:
        workspace
          .getConfiguration("cursor-ninja")
          .get<Config["emptyLineBehavior"]>("emptyLineBehavior") ?? "nonempty",
      cyclic:
        workspace
          .getConfiguration("cursor-ninja")
          .get<Config["cyclic"]>("cyclic") ?? true,
    });
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
