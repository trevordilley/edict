# Edict

**current version: `0.1.0-beta`**

Write declarative business logic driven by facts with Edict!

```typescript
// Contrived foobar example, more interesting 
// examples below! Just wanna be sure you see the code
// right away!

// Shape of the data you'll work with
type Schema = {
  count: number
  message: string
}

// Start a session, `true` turns on autofiring!
const {insert, rule, fire} = edict<Schema>(true) 

// Rules capturiing your business logic, select only the relevant data!
rule("multiples of 5 are foo, multiples of 7 are bar, multiples of both are foobar, otherwise it's just the count", 
  ({count,}) => ({
  current: {
    count,
  }
})).enact({
  then: ({current}) =>   {
    const foo = current.count % 5 === 0 ? "foo" : ""
    const bar = current.count % 7 === 0 ? "bar" : ""
    const message = `${foo}${bar}`
    insert({print: { message: message === "" ? `${current.count}` : message }})
  } 
})

rule("console.log when count changes", ({message}) => ({
  print: {
    message
  }
})).enact({
  then: ({print}) => console.log(print.message)
})

// Insert facts for your rules!
insert({current: {count: 1}}) // "1"
insert({current: {count: 5}}) // "foo"
insert({current: {count: 7}}) // "bar"
insert({current: {count: 35}}) // "foobar"
```

## Acknowledgements!

Edict is inspired by [Zach Oakes'](https://github.com/oakes) libraries [O'doyle rules](https://github.com/oakes/odoyle-rules) and [Pararules](https://github.com/oakes/pararules)!
Edict aims to bring their ideas into the TypeScript ecosystem!

Edict leverages the powerful and efficient Rete Algorithm. The [@edict/rete](https://github.com/trevordilley/edict/tree/main/packages/rete) package used in Edict
is an extremely literal port  [Pararules engine.nim](https://github.com/paranim/pararules/blob/master/src/pararules/engine.nim) as possible. This library wouldn't have been
remotely possible without Zach's work. This library stands on his shoulders in every way!

(Also, if Javascript didn't allow `$` in the variable names, or allow the simple syntax of json attribute names, this libraries API wouldn't have worked either.)

I'd also like to thank my youngest child for waking me up at god-awful early hours to "flatten his blanket" and "turn his pillow the other way", allowing me plenty of
early morning hours to keep on this work!

## Project Breakdown

* [@edict/core](packages/core/README.md) is the main library used by other applications
* [@edict/rete](packages/rete/README.md) this is the port from Pararules that does all the heavy lifting. It's a separate library so anyone that wants to leverage a robust rules engine implementation in the javascript ecosystem can do so!
* [examples](packages/examples) are where I keep my running versions of apps that use this library for testing. A little bare now but I plan to move one of my meatier Phaser games in there soon!
