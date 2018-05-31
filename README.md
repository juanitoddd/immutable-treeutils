Immutable TreeUtils
===================

1.2.0 | ![Travis status](https://travis-ci.org/lukasbuenger/immutable-treeutils.svg?branch=v1.2.0)

This CommonJS module is a collection of helpers to access and traverse [ImmutableJS](http://facebook.github.io/immutable-js/) tree data structure with a DOM-inspired interface.

It imposes some very basic conventions on your data structure, but I tried to make everything as low-level and configurable as possible. Still, a few
conditions that need to be met remain:

* A tree can have only one root node.
* Every node has to provide a unique identifier value under a key that is the same for all nodes in the tree.
* Child nodes have to be stored in an [List](http://facebook.github.io/immutable-js/docs/#/List) under a key that is the same for all nodes containing children.

Supports and tested against ImmutableJS versions `^4.0.0-rc.9 || >=3.8`.
Check the [changelog](https://github.com/lukasbuenger/immutable-treeutils/blob/v1.2.0/CHANGELOG.md) for further information and migration instructions.

## Getting started

You probably should feel comfortable working with [ImmutableJS](http://facebook.github.io/immutable-js/) data structures, so if you don't I strongly recommend you to get familiar with the concepts of [ImmutableJS](http://facebook.github.io/immutable-js/) first.

### Understanding key paths

As you already know, with [ImmutableJS](http://facebook.github.io/immutable-js/) we retrieve nested values like this:

```js
let map = Immutable.Map({a: { b: 'c' }});
map.getIn(['a', 'b']);
// 'c'
```
We could say that the key path to the value `'c'` is `['a', 'b']`.
Instead of an array you can also use [Seq](http://facebook.github.io/immutable-js/docs/#/Seq) objects to describe key paths:
```js
map.getIn(Immutable.Seq(['a', 'b']));
// 'c'
```

This might feel a little over the top at first but comes with a few advantages that are pivotal to [TreeUtils](#TreeUtils).
As a matter of fact, all the functions in this lib, that give you a node or a collection of nodes don't return the actual [ImmutableJS](http://facebook.github.io/immutable-js/) values but the key paths to the substate where the resulting node(s) are located. A lot of operations become very trivial with key paths. Let's look at the [parent](#TreeUtils-parent) function. Determining the parent of a given node represented by a key path is as simple as this:
```js
let nodePath = Immutable.Seq(['data', 'childNodes', 0, 'childNodes', 1]);
let parentPath = nodePath.skipLast(2);
```

The actual retrieval of the [ImmutableJS](http://facebook.github.io/immutable-js/) values is left to you, but you will notice that working with key paths can be quite fun. Imagine you want to get value at key `content` of the next sibling of a given node. You could do this like so:
```js
let keyPath = treeUtils.nextSibling(state, 'node-id');
let content = state.getIn(keyPath.concat('content'));

// or even shorter
let content = state.getIn(treeUtils.nextSibling(state, 'node-id').concat('name'));
```

**Please note, that while ImmutableJS works well with Arrays as key paths, [TreeUtils](#TreeUtils) will only accept [Seq](http://facebook.github.io/immutable-js/docs/#/Seq) objects as valid key paths.**

### Working with cursors

[TreeUtils](#TreeUtils) works just fine with cursor libraries like [immutable-cursor](https://github.com/redbadger/immutable-cursor) because cursors actually implement [ImmutableJS](http://facebook.github.io/immutable-js/) interfaces.

### Tree mutation

[TreeUtils](#TreeUtils) doesn't provide mutation helpers, because IMHO the variety of use cases and implementations is just too huge to spec a sensible API for that kind of thing. However, simple mutation functions can easily be implemented. An insert function could look something like this:
```js
function insert(state, newNode, parentId, index) {
	return state.updateIn(
		tree.getById(state, parentId).concat('childNodes'),
		childNodes => childNodes.splice(index, 0, newNode)
	);
}
```

### Install and setup

Install the package from [npm](https://www.npmjs.com/package/immutable-treeutils):

```
npm install immutable-treeutils
```

Import the module and provide some state. Examples in the docs below refer to this data structure:

```javascript
const Immutable = require('immutable');
// import Immutable from 'immutable';
const TreeUtils = require('immutable-treeutils');
// import TreeUtils from 'immutable-treeutils';

let treeUtils = new TreeUtils();

let data = Immutable.fromJS({
	id: 'root',
	name: 'My Documents',
	type: 'folder',
	childNodes: [
		{
			id: 'node-1',
			name: 'Pictures',
			type: 'folder',
			childNodes: [
				{
					id: 'node-2',
					name: 'Me in Paris',
					type: 'image'
				},
				{
					id: 'node-3',
					name: 'Barbecue July 2015',
					type: 'image'
				}
			]
		},
		{
			id: 'node-4',
			name: 'Music',
			type: 'folder',
			childNodes: [
				{
					id: 'node-5',
					name: 'Pink Floyd - Wish You Were Here',
					type: 'audio'
				},
				{
					id: 'node-6',
					name: 'The Doors - People Are Strange',
					type: 'audio'
				}
			]
		}
	]
});
```

## API Docs

- - -
<sub>[See Source](https://github.com/lukasbuenger/immutable-treeutils/tree/v1.2.0/index.js)</sub>
- - - 
<a id="TreeUtils"></a>




### *class* TreeUtils

A collection of functional tree traversal helper functions for [ImmutableJS](http://facebook.github.io/immutable-js/) data structures.

**Example**

```js
var treeUtils = new TreeUtils(Immutable.Seq(['path', 'to', 'tree']));
```

**With custom key accessors**

```js
var treeUtils = new TreeUtils(Immutable.Seq(['path', 'to', 'tree']), '__id', '__children');
```

**With custom *no result*-default**

```js
var treeUtils = new TreeUtils(Immutable.Seq(['path', 'to', 'tree']), 'id', 'children', false);
```

**Note**
The first argument of every method of a `TreeUtils` object is the state you want to analyse. I won't mention / explain it again in method descriptions bellow. The argument `idOrKeyPath` also appears in most signatures, its purpose is thoroughly explained in the docs of [byArbitrary](#TreeUtils-byArbitrary).


###### Signature:
```js
new TreeUtils(
   rootPath?: immutable.Seq,
   idKey?: string,
   childNodesKey?: string,
   nonValue?: any
)
```

###### Arguments:
* `rootPath` - The path to the substate of your [ImmutableJS](http://facebook.github.io/immutable-js/) state that represents the root node of your tree. Default: `Immutable.Seq()`.
* `idKey` - The name of the key that points at unique identifiers of all nodes in your tree . Default: `'id'`.
* `childNodesKey` - The name of the key at which child nodes can be found. Default: `'childNodes'`.
* `noneValue` - The value that will get returned if a query doesn't return any results. Default: `undefined`.

###### Returns:
* A new `TreeUtils` object
 

- - - 
<a id="TreeUtils-walk"></a>



#### *method* walk()

Main traversal algorithm. Lets you walk over all nodes in the tree **in no particular order**.

###### Signature:
```js
walk(
   state: Immutable.Iterable,
   iterator: (
     accumulator: any,
     keyPath: Immutable.Seq<string|number>
     stop: (
       value: any
     ): any
   ): any,
   path?: Immutable.Seq<string|number>
): any
```

###### Arguments:
* `iterator` - A function that gets passed an accumulator, the current key path and a stop function:
   * If the iterator returns a value, this value will be kept as reduction and passed as accumulator to further iterations.
   * If the iterator returns a `stop` call, the walk operation will return immediately, giving back any value you passed to the `stop` function.
* `path` - The key path that points at the root of the (sub)tree you want to walk over. Default: The `TreeUtils` object's `rootPath`.

###### Returns:
The result of the walk operation.
 

- - - 
<a id="TreeUtils-nodes"></a>



#### *method* nodes()

```js
treeUtils.nodes(state).forEach(
  keyPath =>
    console.log(treeUtils.id(state, keyPath));
)
```

###### Signature:
```
nodes(
    state: Immutable.Iterable,
    path?: Immutable.Seq<string|number>
): Immutable.List<Immutable.Seq<string|number>>
```

###### Arguments:
* `path` - The key path that points at the root of the (sub)tree whose descendants you want to iterate. Default: The `TreeUtils` object's `rootPath`.

###### Returns:
An **unordered** [List](http://facebook.github.io/immutable-js/docs/#/List) of all key paths that point to nodes in the tree, including the root of the (sub)tree..
 

- - - 
<a id="TreeUtils-find"></a>



#### *method* find()

Returns the key path to the first node for which `compatator` returns `true`. Uses [nodes](#TreeUtils-nodes) internally and as [nodes](#TreeUtils-nodes) is an **unordered** List, you should probably use this to find unique occurences of data.
```js
treeUtils.find(state, node => node.get('name') === 'Me in Paris');
// Seq ["childNodes", 0, "childNodes", 0]
```

###### Signature:
```js
find(
   state: Immutable.Iterable,
   comparator: (
        node: Immutable.Iterable,
        keyPath: Immutable.Seq<string|number>
    ): boolean,
   path?: Immutable.Seq<string|number>
): Immutable.Seq<string|number>
```

###### Arguments:
* `comparator` - A function that gets passed a `node` and its `keyPath` and should return whether it fits the criteria or not.
* `path?` - An optional key path to the (sub)state you want to analyse: Default: The `TreeUtils` object's `rootPath`.

###### Returns:
The key path to the first node for which `comparator` returned `true`.
 

- - - 
<a id="TreeUtils-filter"></a>



#### *method* filter()

Returns an [List](http://facebook.github.io/immutable-js/docs/#/List) of key paths pointing at the nodes for which `comparator` returned `true`.
```js
treeUtils.filter(state, node => node.get('type') === 'folder');
//List [ Seq[], Seq["childNodes", 0], Seq["childNodes", 1] ]
```

###### Signature:
```js
filter(
    state: Immutable.Iterable,
    comparator: (
        node: Immutable.Iterable,
        keyPath: Immutable.Seq<string|number>
    ): boolean,
    path?: Immutable.Seq<string|number>
): List<Immutable.Seq<string|number>>
```

###### Arguments:
* `comparator` - A function that gets passed a `node` and its `keyPath` and should return whether it fits the criteria or not.
* `path?` - An optional key path to the (sub)state you want to analyse: Default: The `TreeUtils` object's `rootPath`.


###### Returns:
A [List](http://facebook.github.io/immutable-js/docs/#/List) of all the key paths that point at nodes for which `comparator` returned `true`.
 

- - - 
<a id="TreeUtils-byId"></a>



#### *method* byId()

Returns the key path to the node with id === `id`.

###### Signature:
```js
id(
   state: Immutable.Iterable,
   id: string
): Immutable.Seq<string|number>
```

###### Arguments:
* `id` - A unique identifier

###### Returns:
The key path to the node with id === `id`.
 

- - - 
<a id="TreeUtils-byArbitrary"></a>



#### *method* byArbitrary()

Returns `idOrKeyPath` if it is a [Seq](http://facebook.github.io/immutable-js/docs/#/Seq), else returns the result of [byId](#TreeUtils-byId) for `idOrKeyPath`. This is used in all other functions that work on a unique identifiers in order to reduce the number of lookup operations.

###### Signature:
```js
byArbitrary(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>
): Immutable.Seq<string|number>
```
###### Returns:
The key path pointing at the node found for id === `idOrKeyPath` or, if is a [Seq](http://facebook.github.io/immutable-js/docs/#/Seq), the `idOrKeyPath` itself.

 

- - - 
<a id="TreeUtils-id"></a>



#### *method* id()

Returns the id for the node at `keyPath`. Most useful when you want to get the id of the result of a previous tree query:
```js
treeUtils.id(state, treeUtils.parent(state, 'node-3'));
// 'node-1'
```

###### Signature:
```js
id(
   state: Immutable.Iterable,
   keyPath: Immutable.Seq<string|number>
): string
```

###### Arguments:
* `keyPath` - The absolute key path to the substate / node whose id you want to retrieve

###### Returns:
The unique identifier of the node at the given key path.

 

- - - 
<a id="TreeUtils-nextSibling"></a>



#### *method* nextSibling()

###### Signature:
```js
nextSibling(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>
): Immutable.Seq<string|number>
```

###### Returns:
Returns the next sibling node of the node at `idOrKeyPath`
 

- - - 
<a id="TreeUtils-previousSibling"></a>



#### *method* previousSibling()

###### Signature:
```js
previousSibling(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>
): Immutable.Seq<string|number>
```

###### Returns:
Returns the previous sibling node of the node at `idOrKeyPath`
 

- - - 
<a id="TreeUtils-firstChild"></a>



#### *method* firstChild()

###### Signature:
```js
firstChild(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>
): Immutable.Seq<string|number>
```

###### Returns:
Returns the first child node of the node at `idOrKeyPath`
 

- - - 
<a id="TreeUtils-lastChild"></a>



#### *method* lastChild()

###### Signature:
```js
lastChild(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>
): Immutable.Seq<string|number>
```

###### Returns:
Returns the last child node of the node at `idOrKeyPath`
 

- - - 
<a id="TreeUtils-siblings"></a>



#### *method* siblings()

###### Signature:
```js
siblings(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>
): Immutable.List<Immutable.Seq<string|number>>
```

###### Returns:
Returns a [List](http://facebook.github.io/immutable-js/docs/#/List) of key paths pointing at the sibling nodes of the node at `idOrKeyPath`
 

- - - 
<a id="TreeUtils-childNodes"></a>



#### *method* childNodes()

###### Signature:
```js
childNodes(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>
): Immutable.List<Immutable.Seq<string|number>>
```

###### Returns:
Returns a [List](http://facebook.github.io/immutable-js/docs/#/List) of all child nodes of the node at `idOrKeyPath`
 

- - - 
<a id="TreeUtils-childAt"></a>



#### *method* childAt()

###### Signature:
```js
childAt(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>,
   index: number
): Immutable.Seq<string|number>
```

###### Returns:
Returns the child node at position of `index` of the node at `idOrKeyPath`
 

- - - 
<a id="TreeUtils-descendants"></a>



#### *method* descendants()

###### Signature:
```js
descendants(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>,
): Immutable.List<Immutable.Seq<string|number>>
```

###### Returns:
Returns a list of key paths pointing at all descendants of the node at `idOrKeyPath`
 

- - - 
<a id="TreeUtils-childIndex"></a>



#### *method* childIndex()

###### Signature:
```js
childIndex(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>,
): number
```

###### Returns:
Returns the index at which the node at `idOrKeyPath` is positioned in its parent child nodes list.
 

- - - 
<a id="TreeUtils-hasChildNodes"></a>



#### *method* hasChildNodes()

###### Signature:
```js
hasChildNodes(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>,
): boolean
```

###### Returns:
Returns whether the node at `idOrKeyPath` has children.
 

- - - 
<a id="TreeUtils-numChildNodes"></a>



#### *method* numChildNodes()

###### Signature:
```js
numChildNodes(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>,
): number
```

###### Returns:
Returns the number of child nodes the node at `idOrKeyPath` has.
 

- - - 
<a id="TreeUtils-parent"></a>



#### *method* parent()

###### Signature:
```js
parent(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>,
): Immutable.Seq<string|number>
```

###### Returns:
Returns the key path to the parent of the node at `idOrKeyPath`.
 

- - - 
<a id="TreeUtils-ancestors"></a>



#### *method* ancestors()

###### Signature:
```js
ancestors(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>,
): Immutable.Seq<string|number>
```

###### Returns:
An [List](http://facebook.github.io/immutable-js/docs/#/List) of all key paths that point at direct ancestors of the node at `idOrKeyPath`.
 

- - - 
<a id="TreeUtils-depth"></a>



#### *method* depth()

###### Signature:
```js
depth(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>,
): number
```

###### Returns:
A numeric representation of the depth of the node at `idOrKeyPath`
 

- - - 
<a id="TreeUtils-position"></a>



#### *method* position()

This method is a very naive attempt to calculate a unique numeric position descriptor that can be used to compare two nodes for their absolute position in the tree.
```js
treeUtils.position(state, 'node-4') > treeUtils.position(state, 'node-3');
// true
```

Please note that `position` should not get used to do any comparison with the root node.

###### Signature:
```js
position(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>,
): number
```

###### Returns:
Returns a unique numeric value that represents the absolute position of the node at `idOrKeyPath`.
 

- - - 
<a id="TreeUtils-right"></a>



#### *method* right()

Returns the key path to the next node to the right. The next right node is either:
* The first child node.
* The next sibling.
* The next sibling of the first ancestor that in fact has a next sibling.
* The none value

```js
var nodePath = treeUtils.byId(state, 'root');
while (nodePath) {
   console.log(nodePath);
   nodePath = treeUtils.right(state, nodePath);
}
// 'root'
// 'node-1'
// 'node-2'
// 'node-3'
// 'node-4'
// 'node-5'
// 'node-6'
```

###### Signature:
```js
right(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>,
): Immutable.Seq<string|number>
```

###### Returns:
Returns the key path to the node to the right of the one at `idOrKeyPath`.
 

- - - 
<a id="TreeUtils-left"></a>



#### *method* left()

Returns the key path to the next node to the left. The next left node is either:
* The last descendant of the previous sibling node.
* The previous sibling node.
* The parent node.
* The none value

```js
var nodePath = treeUtils.lastDescendant(state, 'root');
while (nodePath) {
   console.log(nodePath);
   nodePath = treeUtils.left(state, nodePath);
}
// 'node-6'
// 'node-5'
// 'node-4'
// 'node-3'
// 'node-2'
// 'node-1'
// 'root'
```


###### Signature:
```js
left(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>,
): Immutable.Seq<string|number>
```

###### Returns:
Returns the key path to the node to the right of the one at `idOrKeyPath`.
 

- - - 
<a id="TreeUtils-firstDescendant"></a>



#### *method* firstDescendant()

Alias of [firstChild](#TreeUtils-firstChild).
 

- - - 
<a id="TreeUtils-lastDescendant"></a>



#### *method* lastDescendant()

Returns the key path to the most right node in the given subtree (keypath). The last child of the most deep descendant, if that makes any sense. Look at the example:

```js
treeUtils.lastDescendant(state, 'root');
// 'node-6'
```

###### Signature:
```js
lastDescendant(
   state: Immutable.Iterable,
   idOrKeyPath: string|Immutable.Seq<string|number>,
): Immutable.Seq<string|number>
```

###### Returns:
Returns the key path to the last descendant of the node at `idOrKeyPath`.
 



## Development

Setup:
```
git clone https://github.com/lukasbuenger/immutable-treeutils
npm install
```

Run the tests:
```
npm test
```

Build the docs / README:
```
npm run docs
```

Update all local dependencies:
```
npx ncu -a
```

There's a pre-commit hook in place that keeps things in line with the [Prettier](https://github.com/prettier/prettier) guidelines. Please note that Node >= 4.2 is required for the pre-commit hooks ([lint-staged](https://github.com/okonet/lint-staged), [husky](https://github.com/typicode/husky))

## Changelog

See [CHANGELOG](https://github.com/lukasbuenger/immutable-treeutils/blob/v1.2.0/CHANGELOG.md)

## License

See [LICENSE](https://github.com/lukasbuenger/immutable-treeutils/blob/v1.2.0/LICENSE).
