import * as vscode from "vscode";

/**
 * Described in package.json
 */
export interface Config {
  emptyLineBehavior: "empty" | "nonempty";
  cyclic: boolean;
}

export interface ConfigItem<T> {
  value: T;
}

