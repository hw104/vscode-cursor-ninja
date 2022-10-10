import { commands, ExtensionContext, TextEditor, window } from "vscode";
import { Config } from "./config";
import { CursorNinja } from "./cursor_ninja";

function handler<T>(
  context: ExtensionContext,
  cb: (context: ExtensionContext, editor: TextEditor, config: Config) => T
): T | undefined {
  const editor = window.activeTextEditor;
  if (editor == null) {
    return;
  }

  return cb(context, editor, { emptyLineBehavior: "nonempty" });
}

export function activate(context: ExtensionContext) {
  [
    commands.registerCommand("cursor-ninja.jumpIndentDown", () =>
      handler(context, (...arg) => CursorNinja.from(...arg).jumpIndent("down"))
    ),
    commands.registerCommand("cursor-ninja.jumpIndentUp", () =>
      handler(context, (...arg) => CursorNinja.from(...arg).jumpIndent("up"))
    ),
    commands.registerCommand("cursor-ninja.scrollToCenterCursor", () =>
      handler(context, (...arg) =>
        CursorNinja.from(...arg).scrollToCenterCursor()
      )
    ),
  ].forEach((cmd) => context.subscriptions.push(cmd));
}

export function deactivate() {}
