import * as vscode from "vscode";
import {
  findNextSymbolByStart,
  findPreviousSymbolByStart,
  getSiblings,
  getSymbolOf,
  getSymbols,
  jumpToSymbol,
  searchLongestRoutes,
} from "./jump_by_symbol";

async function getSymbolsAndLongestLoute() {
  const symbols = await getSymbols();
  const indexes = searchLongestRoutes(
    symbols,
    vscode.window.activeTextEditor?.selection.active
  );

  return { symbols, indexes };
}

export async function jumpToNextSiblingSymbol() {
  const { indexes, symbols } = await getSymbolsAndLongestLoute();
  if (indexes == null) {
    return;
  }

  const to = findNextSymbolByStart(
    getSiblings(symbols, indexes),
    vscode.window.activeTextEditor!.selection.active
  );
  if (to != null) {
    jumpToSymbol(to);
  }
}

export async function jumpToPreviousSiblingSymbol() {
  const { indexes, symbols } = await getSymbolsAndLongestLoute();
  if (indexes == null) {
    return;
  }

  const to = findPreviousSymbolByStart(
    getSiblings(symbols, indexes),
    vscode.window.activeTextEditor!.selection.active
  );
  if (to != null) {
    jumpToSymbol(to);
  }
}

export async function jumpToFirstSiblingSymbol() {
  const { indexes, symbols } = await getSymbolsAndLongestLoute();
  if (indexes == null) {
    return;
  }

  const to = getSiblings(symbols, indexes).at(0);
  if (to != null) {
    jumpToSymbol(to);
  }
}

export async function jumpToLastSiblingSymbol() {
  const { indexes, symbols } = await getSymbolsAndLongestLoute();
  if (indexes == null) {
    return;
  }

  const to = getSiblings(symbols, indexes).at(-1);
  if (to != null) {
    jumpToSymbol(to);
  }
}

export async function jumpToCurrentSymbolStart() {
  const { indexes, symbols } = await getSymbolsAndLongestLoute();
  if (indexes == null) {
    return;
  }

  const to = getSymbolOf(symbols, indexes)!;
  if (to != null) {
    jumpToSymbol(to);
  }
}
