import * as vscode from "vscode";
import { DebugSymbolsCommand } from "./commands/debug-symbols";
import { JumpToSiblingSymbolCommand } from "./commands/jump-to-next-sibling-symbol";
import { commandTimer } from "./command/middleware";
import { JumpToNextSymbolCommand } from "./commands/jump-to-next-symbol";
import { JumpToFirstSiblingSymbolCommand } from "./commands/jump-to-first-sibling";
import { ExtensionMode } from "vscode";

export function activate(context: vscode.ExtensionContext) {
  const middleware =
    context.extensionMode === ExtensionMode.Production ? [commandTimer()] : [];

  const commands = [
    new DebugSymbolsCommand(context, "cursor-ninja.debugSymbols", [
      commandTimer(),
    ]),
    new JumpToSiblingSymbolCommand(
      context,
      "cursor-ninja.jumpToNextSiblingSymbol",
      "next",
      middleware
    ),
    new JumpToSiblingSymbolCommand(
      context,
      "cursor-ninja.jumpToPreviousSiblingSymbol",
      "prev",
      middleware
    ),
    new JumpToNextSymbolCommand(
      context,
      "cursor-ninja.jumpToNextSymbol",
      "next",
      middleware
    ),
    new JumpToNextSymbolCommand(
      context,
      "cursor-ninja.jumpToPreviousSymbol",
      "prev",
      middleware
    ),
    new JumpToFirstSiblingSymbolCommand(
      context,
      "cursor-ninja.jumpToFirstSiblingSymbol",
      "first",
      middleware
    ),
    new JumpToFirstSiblingSymbolCommand(
      context,
      "cursor-ninja.jumpToLastSiblingSymbol",
      "last",
      middleware
    ),
  ];
  for (const command of commands) {
    command.register();
  }
}

export function deactivate() {}
