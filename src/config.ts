import * as vscode from "vscode";

/**
 * Described in package.json
 */
export interface Config {
  emptyLineBehavior: "empty" | "nonempty";
  cyclic: boolean;
  gapBehavior: "stop" | "parent" | "beyond";
}

export interface ConfigItem<T> {
  value: T;
}
