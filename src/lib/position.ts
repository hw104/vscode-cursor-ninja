import * as vscode from "vscode";

export function getCursorPosition(editor: vscode.TextEditor) {
  return editor.selection.active;
}

export function positionToString(position: vscode.Position) {
  return `${position.line}:${position.character}`;
}

export function rangeToString(range: vscode.Range) {
  return (
    "[" +
    [positionToString(range.start), positionToString(range.end)].join("~") +
    ")"
  );
}

type Ops = keyof vscode.Position & `is${string}`;
type OpsF = vscode.Position[Ops];
export const compares = new Proxy(
  {} as Record<Ops, (a: vscode.Position) => OpsF>,
  {
    get: (_, p, __) => (a: vscode.Position) => a[p as Ops].bind(a),
  }
);
