import { commands, ExtensionContext, window, workspace } from "vscode";
import { Direction } from "./models/direction";
import { ConfigRepo } from "./repos/config_repo";
import { EditorRepo } from "./repos/editor_repo";
import { jumpByIndent } from "./usecases/jump_by_indent";
import { scrollToCenterCursor } from "./usecases/scroll_to_center";

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
    commands.registerCommand("cursor-ninja.scrollToCenterCursor", () =>
      handler(context, async (_, editor) => scrollToCenterCursor(editor))
    ),
  ].forEach((cmd) => context.subscriptions.push(cmd));
}

export function deactivate() {}
