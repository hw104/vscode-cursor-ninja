import { commands, ExtensionContext, window } from "vscode";
import { CursorNinja } from "./cursor_ninja";

export function activate(context: ExtensionContext) {
  [
    commands.registerCommand("cursor-ninja.jumpIndentDown", () =>
      CursorNinja.from(window.activeTextEditor)?.jumpIndent("down")
    ),
    commands.registerCommand("cursor-ninja.jumpIndentUp", () =>
      CursorNinja.from(window.activeTextEditor)?.jumpIndent("up")
    ),
    commands.registerCommand("cursor-ninja.scrollToCenterCursor", () =>
      CursorNinja.from(window.activeTextEditor)?.scrollToCenterCursor()
    ),
  ].forEach((cmd) => context.subscriptions.push(cmd));
}

export function deactivate() {}
