import * as vscode from "vscode";
import {
  findNextSymbolByStart,
  findPreviousSymbolByStart,
  flatSymbols,
  getSymbols,
  jumpToSymbol,
} from "./jump_by_symbol";

export async function jumpToNextSymbol() {
  const position = vscode.window.activeTextEditor?.selection.active;
  if (position == null) {
    return;
  }
  const symbols = await getSymbols();
  const flatten = flatSymbols(symbols);
  const to = findNextSymbolByStart(flatten, position);

  if (to != null) {
    jumpToSymbol(to);
  }
}

export async function jumpToPreviousSymbol() {
  const position = vscode.window.activeTextEditor?.selection.active;
  if (position == null) {
    return;
  }
  const symbols = await getSymbols();
  const flatten = flatSymbols(symbols);
  const to = findPreviousSymbolByStart(flatten, position);

  if (to != null) {
    jumpToSymbol(to);
  }
}
