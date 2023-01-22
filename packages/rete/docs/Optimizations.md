# Optimizations

Currently, there are two main optimizations I'm looking at:

1. Improving hashing speed for IdAttrs (the pair of identifiers that point to a value)
2. `var` copying down the node tree. 
   3. `new Map` in specific spots drives the perf down a 1000x vs maintaining the ref to the map

I've recently stumbled on how to make a hash out of two numbers and pull them back out again. This enables 
leveraging arrays as a main source of access I think. How we arrange our data is really important now. 

# Improving IdAttr hashing

First, we maintain a few running Maps:

```typescript
// Maps id value to an index, "bob" => 11 
const ids = new Map<IdName, IdIdx>()

// Maps an attr name to an index, "age" => 3
const attrs = new Map<AttrName, AttrIdx>()
```

On the boundaries of the input (`insertFact` and `retractFact`) we take the id, and map it to an
index, and if none exists we create a new entry (perhaps reusing an old index from a retracted id?)

But throughout the rest of the application these facts and attrs will use their indices rather than there
string names. 

Making an `idAttrHash` will look like this `const hash = (id << 16) + hash`, which means these id attrs need
to be less than 2^15, which I think should be fine for our target use-case. That's quite a few individual ids among individual attrs. 


