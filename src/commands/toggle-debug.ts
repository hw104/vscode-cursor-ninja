import * as vscode from "vscode";
import { Command, CommandMiddleware } from "../command/command";

export class ToggleDebugCommand extends Command {
  private static debug = false;

  static get isDebug() {
    return ToggleDebugCommand.debug;
  }

  static set isDebug(v: boolean) {
    ToggleDebugCommand.debug = v;
  }

  constructor(
    context: vscode.ExtensionContext,
    command: string,
    middlewares: CommandMiddleware<unknown>[] = []
  ) {
    super(context, command, middlewares);
  }

  async execute() {
    ToggleDebugCommand.debug = !ToggleDebugCommand.debug;
  }
}
