import * as vscode from "vscode";
import {
  findNextSymbolByStart,
  findPreviousSymbolByStart,
  flatSymbols,
  jumpToSymbol,
  Symbol,
} from "./jump_by_symbol";

export async function jumpToNextSymbol(symbols: Symbol[]) {
  const position = vscode.window.activeTextEditor?.selection.active;
  if (position == null) {
    return;
  }
  const flatten = flatSymbols(symbols);
  const to = findNextSymbolByStart(flatten, position);

  if (to != null) {
    jumpToSymbol(to);
  }
}

export async function jumpToPreviousSymbol(symbols: Symbol[]) {
  const position = vscode.window.activeTextEditor?.selection.active;
  if (position == null) {
    return;
  }
  const flatten = flatSymbols(symbols);
  const to = findPreviousSymbolByStart(flatten, position);

  if (to != null) {
    jumpToSymbol(to);
  }
}
