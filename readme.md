# Workhole module

Creates a bridge between main context and worker context 
for easier interaction. 

Importing an object from another context allows **access to
methods of that object** that **will be called in its native context**
with arguments passed to that context and result being returned 
back as a promise.

Module is symmetrical with same file and methods used in both
contexts.

## Usage

### Create a workhole

Main context:

```js
import Workhole from "workhole.js"

const worker = new Worker("worker.js", {
    type : "module"
})
const workhole = new Workhole(worker)
```

Worker context:

```js
import Workhole from "workhole.js"

const workhole = new Workhole(self)
```

### Share an object

"Exporting" context:

```js
const summator = {
    sum (a, b) {
       return a + b 
    }
}

workhole.export(summator, "summator")
```

"Importing" context:

```js
//does not care if object was actually exported
const summator = workhole.import("summator")
```
or
```js
//checks if object was actually exported, waits for it otherwise
const summator = await workhole.expectExport("summator")
```

Note the actual object is not transferred, 
but a handle for it is created instead on
"importing" side.

### Call methods of shared object

In "importing" context:
```js
console.log(await summator.sum(1, 2)) //3
```

## Caveats

As arguments are transferred between context, don't forget 
how sending objects between contexts works. Functions and DOM elements
can't cross the border, objects are cloned instead of being referenced.
