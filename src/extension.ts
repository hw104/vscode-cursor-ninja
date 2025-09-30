import * as vscode from "vscode";
import { ExtensionMode } from "vscode";
import { commandTimer } from "./command/middleware";
import { DebugSymbolsCommand } from "./commands/debug-symbols";
import { JumpToFirstSiblingSymbolCommand } from "./commands/jump-to-first-sibling";
import { JumpToSiblingSymbolCommand } from "./commands/jump-to-next-sibling-symbol";
import { JumpToNextSymbolCommand } from "./commands/jump-to-next-symbol";
import { ToggleDebugCommand } from "./commands/toggle-debug";

export function activate(context: vscode.ExtensionContext) {
  const middleware =
    context.extensionMode === ExtensionMode.Production ? [commandTimer()] : [];

  const commands = [
    new ToggleDebugCommand(context, "cursor-ninja.toggleDebug", [
      commandTimer(),
    ]),
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
