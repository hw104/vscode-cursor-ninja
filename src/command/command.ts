import * as vscode from "vscode";

type Handler<T> = () => Promise<T>;

export type CommandMiddleware<T> = (
  next: Handler<T>,
  command: Command<T>
) => Promise<T>;

export abstract class Command<T = unknown> {
  private readonly handlers: CommandMiddleware<T>[];

  constructor(
    public readonly context: vscode.ExtensionContext,
    public readonly command: string,
    middlewares: CommandMiddleware<T>[] = []
  ) {
    this.handlers = [() => this.execute(), ...middlewares];
  }

  abstract execute(): Promise<T>;

  private _execute(i: number = this.handlers.length - 1): Handler<T> {
    if (i === 0) {
      return () => this.execute();
    }
    return () => this.handlers.at(i)!(this._execute(i - 1), this);
  }

  register() {
    const disposable = vscode.commands.registerCommand(this.command, () => {
      return this._execute()();
    });

    this.context.subscriptions.push(disposable);
  }
}
