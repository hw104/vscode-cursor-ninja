export type GapBehavior = "stop" | "parent" | "beyond";
export type EmptyLineBehavior = "empty" | "nonempty";

/**
 * Described in package.json
 */
export interface Config {
  cyclic: boolean;
  gapBehavior: GapBehavior;
  ignoreLetters: string[];
  ignoreRegExps: string[];
}
