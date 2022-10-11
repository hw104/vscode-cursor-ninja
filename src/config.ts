import { LazyObj } from "./util";

/**
 * Described in package.json
 */
export interface Config {
  emptyLineBehavior: "empty" | "nonempty";
  cyclic: boolean;
  gapBehavior: "stop" | "parent" | "beyond";
}

export type LazyConfig = LazyObj<Config>;
