const { Seq, fromJS, toJS, is } = require("immutable");
const TreeUtils = require("./index");

describe("class `TreeUtils`", () => {
  const fixtures = {
    data: {
      name: "Article",
      type: "article",
      id: "1",
      childNodes: [
        {
          type: "paragraph",
          name: "Paragraph",
          id: "2"
        },
        {
          type: "list",
          name: "List",
          id: "3",
          childNodes: [
            {
              type: "listItem",
              name: "List item 1",
              id: "4",
              childNodes: [
                {
                  type: "paragraph",
                  name: "Nested paragraph",
                  id: "5"
                }
              ]
            },
            {
              type: "listItem",
              name: "List item 2",
              id: "6",
              childNodes: [
                {
                  type: "paragraph",
                  name: "Nested paragraph 2",
                  id: "7"
                }
              ]
            }
          ]
        }
      ]
    }
  };
  const state = fromJS(fixtures);
  const utils = new TreeUtils(Seq.of("data"));

  const getValue = keyPath => utils.id(state, keyPath);

  describe("constructor", () => {
    it("accepts a custom `none` argument", () => {
      const customUtils = new TreeUtils(
        Seq.of("data"),
        "id",
        "childNodes",
        false
      );

      const noneValue = customUtils.find(
        state,
        node => node.get("name") === "Not existing"
      );
      expect(noneValue).toBe(false);
    });
  });

  describe("method `id`", () => {
    it("returns the id value of an absolute key path", () => {
      expect(getValue(Seq(["data", "childNodes", 0]))).toEqual("2");
      expect(getValue(Seq(["data", "childNodes", 1]))).toEqual("3");
    });

    it("returns undefined if the key path has no id key.", () => {
      expect(getValue(Seq(["data", "childNodes", 4]))).toBeUndefined();
    });
  });

  describe("method `find`", () => {
    const findKeyPathById = (id, seq) => {
      return utils.find(
        state,
        item => {
          return item.get("id") === id;
        },
        seq
      );
    };

    it("returns the first key path whose item passed the comparator function.", () => {
      const keyPath = findKeyPathById("2");
      expect(keyPath.toJS()).toEqual(["data", "childNodes", 0]);
      expect(getValue(keyPath.toJS())).toEqual("2");

      const keyPath2 = findKeyPathById("3");
      expect(keyPath2.toJS()).toEqual(["data", "childNodes", 1]);
      expect(getValue(keyPath2.toJS())).toEqual("3");

      const keyPath3 = findKeyPathById(
        "4",
        Seq.of("data", "childNodes", 1, "childNodes", 0)
      );
      expect(keyPath3.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        0
      ]);
      expect(getValue(keyPath3.toJS())).toEqual("4");

      const keyPath4 = findKeyPathById(
        "5",
        Seq.of("data", "childNodes", 1, "childNodes", 0, "childNodes", 0)
      );
      expect(keyPath4.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        0,
        "childNodes",
        0
      ]);
      expect(getValue(keyPath4.toJS())).toEqual("5");

      const keyPath5 = findKeyPathById(
        "6",
        Seq.of("data", "childNodes", 1, "childNodes", 1)
      );
      expect(keyPath5.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        1
      ]);
      expect(getValue(keyPath5.toJS())).toEqual("6");

      const keyPath6 = findKeyPathById(
        "7",
        Seq.of("data", "childNodes", 1, "childNodes", 1, "childNodes", 0)
      );
      expect(keyPath6.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        1,
        "childNodes",
        0
      ]);
      expect(getValue(keyPath6.toJS())).toEqual("7");
    });

    it("passes the current node's key path as second argument to the comparator", () => {
      const findSameKeyPath = seq => {
        return utils.find(state, (node, keyPath) => is(seq, keyPath));
      };
      expect(
        utils.id(
          state,
          findSameKeyPath(Seq.of("data", "childNodes", 1, "childNodes", 0))
        )
      ).toEqual("4");
    });

    it("accepts an optional parameter `path` to restrict the haystack to a subtree.", () => {
      const keyPath = findKeyPathById(
        "3",
        Seq.of("data", "childNodes", 1, "childNodes", 0)
      );
      expect(keyPath).toBeUndefined();
    });
  });

  describe("method `filter`", () => {
    const filterKeyPathByType = (type, seq) => {
      return utils.filter(
        state,
        item => {
          return item.get("type") === type;
        },
        seq
      );
    };

    it("returns a list of all key paths whose items passed the comparator function.", () => {
      const keyPaths = filterKeyPathByType("paragraph");
      expect(keyPaths.toArray().map(m => m.toJS())).toEqual([
        ["data", "childNodes", 0],
        ["data", "childNodes", 1, "childNodes", 0, "childNodes", 0],
        ["data", "childNodes", 1, "childNodes", 1, "childNodes", 0]
      ]);
      expect(keyPaths.toArray().map(m => getValue(m.toJS()))).toEqual([
        "2",
        "5",
        "7"
      ]);

      const keyPaths2 = filterKeyPathByType("listItem");
      expect(keyPaths2.toArray().map(m => m.toJS())).toEqual([
        ["data", "childNodes", 1, "childNodes", 0],
        ["data", "childNodes", 1, "childNodes", 1]
      ]);
      expect(keyPaths2.toArray().map(m => getValue(m.toJS()))).toEqual([
        "4",
        "6"
      ]);
    });

    it("passes the current node's key path as second argument to the comparator", () => {
      const filterDescendants = seq =>
        utils.filter(state, (node, keyPath) => is(seq, keyPath.take(seq.size)));
      expect(
        filterDescendants(Seq.of("data", "childNodes", 1)).toJS()
      ).toEqual([
        ["data", "childNodes", 1],
        ["data", "childNodes", 1, "childNodes", 0],
        ["data", "childNodes", 1, "childNodes", 1],
        ["data", "childNodes", 1, "childNodes", 0, "childNodes", 0],
        ["data", "childNodes", 1, "childNodes", 1, "childNodes", 0]
      ]);
    });

    it("accepts an optional parameter `path` to restrict the haystack to a subtree.", () => {
      const keyPaths = filterKeyPathByType(
        "paragraph",
        Seq.of("data", "childNodes", 1, "childNodes", 0)
      );
      expect(keyPaths.toArray().map(m => m.toJS())).toEqual([
        ["data", "childNodes", 1, "childNodes", 0, "childNodes", 0]
      ]);
      expect(keyPaths.toArray().map(m => getValue(m.toJS()))).toEqual(["5"]);
    });
  });

  describe("method `byId`", () => {
    it("returns the key path of the first item whose id equals the id parameter.", () => {
      const keyPath = utils.byId(state, "7");
      expect(keyPath.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        1,
        "childNodes",
        0
      ]);
      expect(getValue(keyPath.toJS())).toEqual("7");

      const keyPath2 = utils.byId(state, "4");
      expect(keyPath2.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        0
      ]);
      expect(getValue(keyPath2.toJS())).toEqual("4");
    });
  });

  describe("method `byArbitrary`", () => {
    it("returns the key path representing an id.", () => {
      expect(utils.byArbitrary(state, "4").toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        0
      ]);
      expect(getValue(utils.byArbitrary(state, "4").toJS())).toEqual("4");
    });

    it("returns the key path parameter if it is an array / a key path already.", () => {
      expect(
        utils
          .byArbitrary(state, Seq(["data", "childNodes", 1, "childNodes", 0]))
          .toJS()
      ).toEqual(["data", "childNodes", 1, "childNodes", 0]);
      expect(
        getValue(
          utils
            .byArbitrary(state, Seq(["data", "childNodes", 1, "childNodes", 0]))
            .toJS()
        )
      ).toEqual("4");
    });
  });

  describe("method `nextSibling`", () => {
    it("returns the next sibling node.", () => {
      const keyPath = utils.nextSibling(state, "4");
      expect(keyPath.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        1
      ]);
      expect(getValue(keyPath.toJS())).toEqual("6");
    });

    it("returns undefined if the node at `id` does not have a next sibling.", () => {
      const keyPath = utils.nextSibling(state, "7");
      expect(keyPath).toBeUndefined();
    });
  });

  describe("method `previousSibling`", () => {
    it("returns the previous sibling node.", () => {
      const keyPath = utils.previousSibling(state, "6");
      expect(keyPath.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        0
      ]);
      expect(getValue(keyPath.toJS())).toEqual("4");
    });

    it("returns undefined if the node at `id` does not have a previous sibling.", () => {
      const keyPath = utils.previousSibling(state, "4");
      expect(keyPath).toBeUndefined();
    });
  });

  describe("method `parent`", () => {
    it("returns the parent element's key path of the first item whose id equals the id parameter.", () => {
      const keyPath = utils.parent(state, "7");
      expect(keyPath.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        1
      ]);
      expect(getValue(keyPath.toJS())).toEqual("6");
    });

    it("returns the parent parent element's key path of the first item whose id equals the id parameter.", () => {
      const keyPath = utils.parent(state, getValue(utils.parent(state, "7")));
      expect(keyPath.toJS()).toEqual(["data", "childNodes", 1]);
      expect(getValue(keyPath.toJS())).toEqual("3");
    });
  });

  describe("method `childIndex`", () => {
    it("returns the index of the first item whose id equals the id parameter according to its parent list.", () => {
      const index = utils.childIndex(state, "3");
      expect(index).toEqual(1);

      const index2 = utils.childIndex(state, "4");
      expect(index2).toEqual(0);
    });
  });

  describe("method `childAt`", () => {
    it("returns the composed keyPath that points at the child cursor.", () => {
      const keyPath = utils.childAt(state, "3", 0);
      expect(keyPath.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        0
      ]);
      expect(getValue(keyPath.toJS())).toEqual("4");

      const keyPath2 = utils.childAt(state, "3", 1);
      expect(keyPath2.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        1
      ]);
      expect(getValue(keyPath2.toJS())).toEqual("6");
    });

    it("returns undefined if the node at `id` has no child nodes or no child node at `index`.", () => {
      const keyPath = utils.childAt(state, "2", 1);
      expect(keyPath).toBeUndefined();
    });
  });

  describe("method `firstChild`", () => {
    it("returns the first child node.", () => {
      const keyPath = utils.firstChild(state, "4");
      expect(keyPath.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        0,
        "childNodes",
        0
      ]);
      expect(getValue(keyPath.toJS())).toEqual("5");
    });

    it("returns undefined if the node at `id` does not have a first child.", () => {
      const keyPath = utils.firstChild(state, "2");
      expect(keyPath).toBeUndefined();
    });
  });

  describe("method `lastChild`", () => {
    it("returns the last child node.", () => {
      const keyPath = utils.lastChild(state, "1");
      expect(keyPath.toJS()).toEqual(["data", "childNodes", 1]);
      expect(getValue(keyPath.toJS())).toEqual("3");
    });

    it("returns undefined if the node at `id` does not have a last child.", () => {
      const keyPath = utils.lastChild(state, "7");
      expect(keyPath).toBeUndefined();
    });
  });

  describe("method `hasChildNodes`", () => {
    it("returns true if a node has 1 or more child nodes.", () => {
      expect(utils.hasChildNodes(state, "4")).toBeTruthy();
    });

    it("returns false if a node has no child nodes.", () => {
      expect(utils.hasChildNodes(state, "5")).toBeFalsy();
    });
  });

  describe("method `numChildNodes`", () => {
    it("returns the number of child nodes.", () => {
      expect(utils.numChildNodes(state, "1")).toEqual(2);
    });
  });

  describe("method `siblings`", () => {
    it("returns list of all key paths with the same parent excluding the node itself.", () => {
      const keyPaths = utils.siblings(state, "6");
      expect(keyPaths.toArray().map(m => m.toJS())).toEqual([
        ["data", "childNodes", 1, "childNodes", 0]
      ]);

      expect(keyPaths.toArray().map(m => getValue(m.toJS()))).toEqual(["4"]);
    });
  });

  describe("method `childNodes`", () => {
    it("returns list of all key paths which are first level descendants of the given node.", () => {
      const keyPaths = utils.childNodes(state, "1");
      expect(keyPaths.toArray().map(m => m.toJS())).toEqual([
        ["data", "childNodes", 0],
        ["data", "childNodes", 1]
      ]);

      expect(keyPaths.toArray().map(m => getValue(m.toJS()))).toEqual([
        "2",
        "3"
      ]);
    });
  });

  describe("method `ancestors`", () => {
    it("returns a list of all key paths that point at the ancestor nodes of the item at `id`.", () => {
      const keyPaths = utils.ancestors(state, "7");
      expect(keyPaths.toArray().map(m => m.toJS())).toEqual([
        ["data", "childNodes", 1, "childNodes", 1],
        ["data", "childNodes", 1],
        ["data"]
      ]);

      expect(keyPaths.toArray().map(m => getValue(m.toJS()))).toEqual([
        "6",
        "3",
        "1"
      ]);
    });
  });

  describe("method `descendants`", () => {
    it("returns a list of all key paths that represent child nodes of the item at `id`", () => {
      const keyPaths = utils.descendants(state, "3");
      expect(keyPaths.toArray().map(m => m.toJS())).toEqual([
        ["data", "childNodes", 1, "childNodes", 0],
        ["data", "childNodes", 1, "childNodes", 1],
        ["data", "childNodes", 1, "childNodes", 0, "childNodes", 0],
        ["data", "childNodes", 1, "childNodes", 1, "childNodes", 0]
      ]);

      expect(keyPaths.toArray().map(m => getValue(m.toJS()))).toEqual([
        "4",
        "6",
        "5",
        "7"
      ]);
    });
  });

  describe("method `right`", () => {
    it("returns the next sibling of the node found at `id`", () => {
      const keyPath = utils.right(state, "2");
      expect(keyPath.toJS()).toEqual(["data", "childNodes", 1]);
      expect(getValue(keyPath.toJS())).toEqual("3");
    });

    it("returns the first child node if present.", () => {
      const keyPath = utils.right(state, "3");
      expect(keyPath.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        0
      ]);
      expect(getValue(keyPath.toJS())).toEqual("4");
    });

    it("returns the next sibling of the first ancestor that has a next sibling", () => {
      const keyPath = utils.right(state, "5");
      expect(keyPath.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        1
      ]);
      expect(getValue(keyPath.toJS())).toEqual("6");
    });

    it("returns undefined if it is the last node in the tree.", () => {
      const keyPath = utils.right(state, "7");
      expect(keyPath).toBeUndefined();
    });

    it("can iterate over the whole tree.", () => {
      let id = "1";
      let node = utils.right(state, id);
      const result = [];
      while (node) {
        id = utils.id(state, node);
        result.push(id);
        node = utils.right(state, id);
      }
      expect(result).toEqual(["2", "3", "4", "5", "6", "7"]);
    });
  });

  describe("method `position`", () => {
    it("returns a number representating the position of the node in relation to all other nodes.", () => {
      const position = utils.position(state, "2");
      expect(typeof position === "number").toBeTruthy();
    });

    it("returns a higher number for nodes appear later in the tree", () => {
      expect(
        utils.position(state, "7") > utils.position(state, "4")
      ).toBeTruthy();
      expect(
        utils.position(state, "4") > utils.position(state, "2")
      ).toBeTruthy();
      expect(
        utils.position(state, "6") > utils.position(state, "5")
      ).toBeTruthy();
    });
  });

  describe("method `left`", () => {
    it("returns the previous sibling of the node found at `id`", () => {
      const keyPath = utils.left(state, "3");
      expect(keyPath.toJS()).toEqual(["data", "childNodes", 0]);
      expect(getValue(keyPath.toJS())).toEqual("2");
    });

    it("returns the latest child of the previous sibling if exists.", () => {
      const keyPath = utils.left(state, "6");
      expect(keyPath.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        0,
        "childNodes",
        0
      ]);
      expect(getValue(keyPath.toJS())).toEqual("5");
    });

    it("returns the parent node if the node at `id` has no previous sibling.", () => {
      const keyPath = utils.left(state, "7");
      expect(keyPath.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        1
      ]);
      expect(getValue(keyPath.toJS())).toEqual("6");
    });

    it("returns undefined if it is the last node in the tree.", () => {
      const keyPath = utils.left(state, "1");
      expect(keyPath).toBeUndefined();
    });

    it("can iterate over the whole tree.", () => {
      let id = "7";
      let node = utils.left(state, id);
      const result = [];
      while (node) {
        id = utils.id(state, node);
        result.push(id);
        node = utils.left(state, id);
      }
      expect(result).toEqual(["6", "5", "4", "3", "2", "1"]);
    });
  });

  describe("method `firstDescendant`", () => {
    it("returns the first child node in the tree", () => {
      const keyPath = utils.firstDescendant(state, "1");
      expect(keyPath.toJS()).toEqual(["data", "childNodes", 0]);
      expect(getValue(keyPath.toJS())).toEqual("2");
    });
  });

  describe("method lastDescendant`", () => {
    it("returns the last child node in the tree", () => {
      const keyPath = utils.lastDescendant(state, "1");
      expect(keyPath.toJS()).toEqual([
        "data",
        "childNodes",
        1,
        "childNodes",
        1,
        "childNodes",
        0
      ]);
      expect(getValue(keyPath.toJS())).toEqual("7");
    });
  });
});