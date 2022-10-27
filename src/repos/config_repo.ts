import { WorkspaceConfiguration } from "vscode";
import { Config } from "../models/config";

export class ConfigRepo {
  constructor(private readonly workspaceConfig: WorkspaceConfiguration) {}

  get(): Config {
    const keys: Record<keyof Config, string> = {
      cyclic: "",
      gapBehavior: "",
      ignoreLetters: "",
      ignoreRegExps: "",
    };
    return Object.fromEntries(
      Object.keys(keys).map((key) => [
        key,
        this.workspaceConfig.get(key) as any,
      ])
    ) as Config;
  }
}
