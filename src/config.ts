export interface Config {
  /**
   * Jump behavior when cursor on empty line.
   * Default is `nonempty`.
   *
   * - `nonempty`: Jump to next/previous non empty line.
   * - `empty`: Jump to next/previous empty line
   */
  emptyLineBehavior: "empty" | "nonempty";
//   circle: boolean;
}

export interface ConfigItem<T> {
  value: T;
}
