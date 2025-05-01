// npx tsx <path/to/this/file>

import { Tree } from "../lib/tree";
import { deepEqual, strictEqual as equal } from "node:assert";

const sampleTree = () => {
  type X = string;
  const getChildren = (v: X): Tree<X>[] => {
    if (v.length > 3) {
      return [];
    }
    return [v + "0", v + "1", v + "2"].map((s) => new Tree(s, getChildren));
  };
  return new Tree<X>("0", (v) => getChildren(v));
};

const tree1 = async () => {
  const original = sampleTree();

  const expectedString = `0
 00
  000
   0000
   0001
   0002
  001
   0010
   0011
   0012
  002
   0020
   0021
   0022
 01
  010
   0100
   0101
   0102
  011
   0110
   0111
   0112
  012
   0120
   0121
   0122
 02
  020
   0200
   0201
   0202
  021
   0210
   0211
   0212
  022
   0220
   0221
   0222`;
  equal(original.toString(), expectedString);

  equal(
    original.map((v) => `~${v}~`).toString(),
    expectedString
      .split("\n")
      .map((v) => v.replace(/(\d+)/, "~$1~"))
      .join("\n")
  );

  equal(
    original
      .filterChildren((v) => Number(v) % 2 === 0)
      .toString()
      .split("\n")
      .every((v) => v.endsWith("0") || v.endsWith("2")),
    true
  );
};

const tree2 = async () => {
  const tree = sampleTree();

  deepEqual(
    tree.findIndicesDepth((v) => v.value === "0000"),
    [0, 0, 0]
  );
  deepEqual(
    tree.findIndicesDepth((v) => v.value.endsWith("2")),
    [0, 0, 2]
  );
  deepEqual(
    tree.findIndicesBreadth((v) => v.value.endsWith("2")),
    [2]
  );
  deepEqual(
    tree.findIndicesDepth(() => false),
    undefined
  );
  deepEqual(
    tree.findIndicesBreadth(() => false),
    undefined
  );
};

const tree3 = async () => {
  const tree = sampleTree();

  const idx = [0, 0, 0];

  equal(tree.of(idx).get()?.value, "0000");
  equal(tree.of(idx).parent().get()?.value, "000");
  equal(tree.of(idx).parent().parent().get()?.value, "00");
  equal(tree.of(idx).parent().parent().parent().get()?.value, "0");
  equal(tree.of(idx).next().get()?.value, "0001");
  equal(tree.of(idx).next().next().get()?.value, "0002");
  equal(tree.of(idx).next().next().next().get()?.value, undefined);
  equal(tree.of(idx).prev().get()?.value, undefined);

  equal(tree.of(idx).parent().next().get()?.value, "001");
  equal(tree.of(idx).parent().next().next().childAt(2).get()?.value, "0022");

  equal(tree.of(idx).first().get()?.value, "0000");
  equal(tree.of(idx).last().get()?.value, "0002");
};

if (require.main === module) {
  (async () => {
    await tree1();
    await tree2();
    await tree3();
    console.log("done");
  })();
}
