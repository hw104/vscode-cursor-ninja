import { Direction } from "../models/direction";
import { ConfigRepo } from "../repos/config_repo";
import { EditorRepo } from "../repos/editor_repo";

export function jumpByIndent(
  editorRepo: EditorRepo,
  configRepo: ConfigRepo,
  direction: Direction
) {
  const from = editorRepo.getCurrentLineNum();
  const to = editorRepo.getLineByIndent(
    {
      direction,
      from,
      indent: editorRepo.getLine(from).indent,
    },
    configRepo.get()
  );

  if (to != null) {
    editorRepo.setCursorLine(to);
    return to;
  }

  return undefined;
}
