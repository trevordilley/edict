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
integer id, and if none exists we create a new entry (perhaps reusing an old index from a retracted id?)

But throughout the rest of the application these facts and attrs will use their indices rather than there
string names. 

Making an `idAttrHash` will look like this `const hash = (id << 16) + hash`, which means these id attrs need
to be less than 2^15, which I think should be fine for our target use-case. That's quite a few individual ids among individual attrs. 

I don't think we ever need to get the string back out except for debugging purposes (seeing the actual string), so converting back 
isn't really a concern I think? 

## Facts and integer ids
So on insert or retract our facts might look like this:
`["bob", "middleName", "maude"]`

however, after looking up the id and attr idx's, they might look like:
`[4855, 4, "maude"]`

which we could hash to be: `[318_177_284, "maude"]`, so now
we can represent `idAttrs` with a single integer value. 

### Value storage

So the `id` part of the fact I don't think actually points to anything, 

However, I'm wondering if there isn't a better way to store values


So a Fact might have the following shape:
[4855, 4, 22]

And accessing the 22'nd value of attr 4 would be:
`attrs[4][22]` 

Running a `retract` would be a bit harder there, since we need to find the value to retract? 
