import { EditorRepo } from "../repos/editor_repo";

export function scrollToCenterCursor(editorRepo: EditorRepo) {
  editorRepo.setCursorLine(editorRepo.getCurrentLineNum(), true);
}
