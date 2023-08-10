import * as vscode from "vscode";
import {
  findNextSymbolByStart,
  findPreviousSymbolByStart,
  getSiblings,
  getSymbolOf,
  jumpToSymbol,
  searchLongestRoutes,
  Symbol,
} from "./jump_by_symbol";
import { jumpToNextSymbol, jumpToPreviousSymbol } from "./jump_next_symbol";

export async function jumpToNextSiblingSymbol(symbols: Symbol[]) {
  const indexes = searchLongestRoutes(
    symbols,
    vscode.window.activeTextEditor?.selection.active
  );
  if (indexes == null) {
    return jumpToNextSymbol(symbols.map((s) => ({ ...s, children: [] })));
  }

  const sibilings = getSiblings(symbols, indexes);
  const to = findNextSymbolByStart(
    sibilings,
    vscode.window.activeTextEditor!.selection.active
  );
  if (to != null) {
    jumpToSymbol(to);
  }
}

export async function jumpToPreviousSiblingSymbol(symbols: Symbol[]) {
  const indexes = searchLongestRoutes(
    symbols,
    vscode.window.activeTextEditor?.selection.active
  );
  if (indexes == null) {
    return jumpToPreviousSymbol(symbols.map((s) => ({ ...s, children: [] })));
  }

  const sibilings = getSiblings(symbols, indexes);
  const to = findPreviousSymbolByStart(
    sibilings,
    vscode.window.activeTextEditor!.selection.active
  );
  if (to != null) {
    jumpToSymbol(to);
  }
}

export async function jumpToFirstSiblingSymbol(symbols: Symbol[]) {
  const indexes = searchLongestRoutes(
    symbols,
    vscode.window.activeTextEditor?.selection.active
  );
  if (indexes == null) {
    return;
  }

  const to = getSiblings(symbols, indexes).at(0);
  if (to != null) {
    jumpToSymbol(to);
  }
}

export async function jumpToLastSiblingSymbol(symbols: Symbol[]) {
  const indexes = searchLongestRoutes(
    symbols,
    vscode.window.activeTextEditor?.selection.active
  );
  if (indexes == null) {
    return;
  }

  const to = getSiblings(symbols, indexes).at(-1);
  if (to != null) {
    jumpToSymbol(to);
  }
}

export async function jumpToCurrentSymbolStart(symbols: Symbol[]) {
  const indexes = searchLongestRoutes(
    symbols,
    vscode.window.activeTextEditor?.selection.active
  );
  if (indexes == null) {
    return;
  }

  const to = getSymbolOf(symbols, indexes)!;
  if (to != null) {
    jumpToSymbol(to);
  }
}
