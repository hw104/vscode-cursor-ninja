import * as vscode from "vscode";

export function ensureActiveEditor(): vscode.TextEditor {
  const editor = vscode.window.activeTextEditor;
  if (editor == null) {
    vscode.window.showErrorMessage("No active editor");
    throw new Error("No active editor");
  }
  return editor;
}

export function jumpAndRevealCursor(
  editor: vscode.TextEditor,
  position: vscode.Position,
  range?: vscode.Range
) {
  editor.selection = new vscode.Selection(position, position);
  editor.revealRange(
    new vscode.Range(range?.start ?? position, range?.end ?? position),
    vscode.TextEditorRevealType.Default
  );
}
