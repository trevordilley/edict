# Edict
Organize your business logic in terms of rules which trigger reactively

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

## Installation

```bash
yarn add @edict/core @edict/types @edict/rete lodash typescript-collections

# or...

npm i @edict/core @edict/types @edict/rete lodash typescript-collections
```

## Acknowledgements!

Edict is inspired by [Zach Oakes'](https://github.com/oakes) libraries [O'doyle rules](https://github.com/oakes/odoyle-rules) and [Pararules](https://github.com/oakes/pararules)!
Edict aims to bring their ideas into the TypeScript ecosystem!

Edict leverages the powerful and efficient Rete Algorithm. The [@edict/rete](https://github.com/trevordilley/edict/tree/main/packages/rete) package used in Edict
is an extremely literal port of [Pararules engine.nim](https://github.com/paranim/pararules/blob/master/src/pararules/engine.nim). This library wouldn't have been
remotely possible without Zach's work. This library stands on his shoulders in every way!

(Also, if Javascript didn't allow `$` in the variable names, or allow the simple syntax of json attribute names, this libraries API wouldn't have worked either.)

I'd also like to thank my youngest child for waking me up at god-awful early hours to "flatten his blanket" and "turn his pillow the other way", allowing me plenty of
early mornings to keep on this work!

## Project Breakdown

* [@edict/core](packages/core/README.md) is the main library used by other applications
* [@edict/rete](packages/rete/README.md) this is the port from Pararules that does all the heavy lifting. It's a separate library so anyone that wants to leverage a robust rules engine implementation in the javascript ecosystem can do so!
* [examples](packages/examples) are where I keep my running versions of apps that use this library for testing.
  * [phaser](packages/examples/phaser-game) A perf test using phaser. Also shows how to incorporate the edict library into your game logic (in a basic way)
  * [todo](packages/examples/react-todo) A simple todo app
  * [react performance](packages/examples/react-perf) This example really digs into nested rules. The goal is to push `edict` performance and show rule usage in a non-trivial way
  * [realworld app](packages/examples/react-realworld/README.md) An implementation of [Conduit](https://demo.realworld.io/#/) (by [gothinkster's RealWorldApp](https://github.com/gothinkster/realworld))

## Usage
We'll explore usage by example. 

In this example we'll build an application that figures out which users are
having a birthday!

### The Schema

The `Schema` describes the shape of your facts, specifically the
types of data that can be associated with an id and value. Later when we insert
a fact it will be clearer how the schema relates to both rules and
facts.

```typescript
type Schema = {
  name: string,
  email: string,
  birthDay: Date,
  isCelebratingBirthDay: boolean,
  sibling: string,
  todaysDate: Date,
};

// This `session` will maintain it's own database of facts and rules. It also will
// expose functions to add/remove new rules and facts, query the facts etc.
//
// Edict does not create "global" data, each invocation of `edict()` creates
// new independent sessions
const mySession = edict<Schema>();
```

One the key benefits to having an attribute schema is type-safety. Edict will not allow you to insert
facts with attributes not declared in the schema for that session. The other really nice benefit is that
with proper editor tooling (auto-completion!) it's trivial to explore the space of possible facts and attributes!


Now let's create our first rule!

```typescript
const { rule } = mySession;

const results = rule('When a birthday is today, celebrate the birthday!',
  ({ birthDay, todaysDate }) =>
    ({
      // "today" matches the id when inserting the fact (see above)
      today: {
        todaysDate,
      },

      // "$user" is a _bound_ id. By prefixing the id with "$" you signal to edict that
      // you want to match ANY fact with the following attributes. This allows you to "join"
      // many facts to be processed by this rule!
      $user: {
        birthDay,
      },
    }))
    // `rule()` returns an object with `enact()` 
    // `enact()` let's you apply reactions to the
    // rule you've defined, and adds it to the session
    .enact({
      // "when" filters out facts, runs before "then"
      when: ({ $user, today }) => {
        // Match users who have a birthday today!
        return (
          $user.birthDay.getMonth() === today.todaysDate.getMonth() &&
          $user.birthDay.getDate() === today.todaysDate.getDate()
        )
     },

     then: ({ $user }) => {
      insert({ [$user.id]: { isCelebratingBirthDay: true } });
     },
});
```

### Inserting Facts

Now that we have our session, let's insert some facts.

*Note! You need to define rules before your facts are inserted!*

```typescript
// Here is how you would insert multiple facts about different people with names and emails
const { insert } = mySession;

insert({
  // "bob" is the "id", it could be an integer, uuid, whatever makes sense for your application!
  bob: {
    name: 'Bob Johnson',
    email: 'bob@hotmail.com',
    birthDay: new Date('2008-01-19'),
  },
  tom: {
    name: 'Tom Kennedy',
    email: 'tomk@aol.com',
    birthDay: new Date('1967-03-02'),
  },

  // Let's assume these two are twins born on the same day!
  jack: {
    name: 'Jack Maxwell',
    email: 'jack@gmail.com',
    birthDay: new Date('2022-03-02'),
    sibling: "jill"
  },
  jill: {
    name: 'Jill Maxwell',
    email: 'jill@gmail.com',
    birthDay: new Date('2022-03-02'),
    sibling: "jack"
  },

  // Let's pretend it's Tom, Jack and Jill's birthdays!
  today: {todaysDate: new Date('2022-03-02')},
});
```

> Under the hood, facts are represented as entity-attribute-value tuples. So the
> entry "bob" above is internally stored as
> ["bob", "name", "Bob Johnson"], ["bob", "email", "bob@hotmail.com"], etc.
> This enables maximum flexibility for rule definition and engine implementation.
> However a design goal of Edict is to expose an idiomatic javascript API
> to keep usage ergonomic.

### Queries

The object returned from calling `rule()` contains a function named `enact()`.

The arguments to `enact()` are optional, but allow you to specify what happens when a rule
is triggered by the fact database.

The return value of `enact()` is an object containing the `query()` function. `query()` will
return an array of facts matching your rule.

You don't have to supply arguments to `enact()` by the way! Some rules are more
like queries, and allow you to pull out a subset of the facts matching the conditions
of the rule!

```typescript
const usersCelebratingBirthdays = rule("All users celebrating their birthday", ({ name, isCelebratingBirthDay }) =>
  ({
    $user: {
      name, 
      isCelebratingBirthDay,
    },
  })
).enact(
  {when: ({$user}) => $user.isCelebratingBirthDay}
)

const {fire} = mySession

// fire() will actually trigger your rules. If you call edict like
// this: `edict(true)` then every insert or retraction will automatically
// call `fire()`, which may or may not be what you want depending on your
// use-case.
fire()

const users = usersCelebratingBirthdays.query();

users.forEach(({$user}) => console.log(`${$user.name} is celebrating their birthday!`));
```

#### Use filters to get specific results
Sometimes we want to get very specific subsets of facts, say all the data for
a particular user, but we don't want to make a whole rule specifically for that
user. 

To achieve this, we can pass arguments to `query()` to narrow the results to 
the fact we want

```typescript
// Continueing the example above, let's get jack's facts

const jack = usersCelebratingBirthdays.query({
  $name: {
      ids: ["jack"]
  }
})
```

The object passed into `query` has this shape:
```
{
  sameIdAsCondition: {
    ids: ["array","of","ids"],
    someAttribute: ["array","of","values","to","match"]
  }
}
```

It can be cumbersome to deal with an array of results if you _know_ there 
will just be a single result. In that case you can use `queryOne()`
```typescript

// Return the first matching fact. This is nice if you expect there to be 
// just one result (say for an id you know is unique). Returns `undefined`
// if nothing matches
const justJack = usersCelebratingBirthdays.queryOne({
    $name: {
        ids: ["jack"]
    }
}) 
```

### Subscriptions
To make integrating with reactive frameworks like React or RxJs, `edict` also provides
subscription functions. They follow the same patterns as `query()` and `queryOne()`,
exposing `subscribe()` and `subscribeOne()`. These functions also take filter objects
just like `query()`

```typescript
// Whenever facts which would trigger this rule are inserted, the callback
// passed into subscribe will be called. 
const unsub = usersCelebratingBirthdays.subscribe(users => {
    console.log(users)
})

// To stop subscribing, just call the returned callback
unsub()

// You can use a filter object as well, and if you expect a single result there
// is a `subscribeOne` variation
const unsubOne = usersCelebratingBirthdays.subscribeOne(jack => {
    console.log(jack)
},
  { // The filter arg is the second argument
    $users: {
        ids: ["jack"]
    }
})

// Then unsub later:
unsubOne()
```

#### Integrating with React
It's not too hard to integrate this nicely with React, and other frameworks
and libraries should be just as simple (honestly, React is probably the most
complex one to integrate with). Below is an example `useBirthdayCelebrators` hook

```typescript
const useBirthdayCelebrators = () => {
    const [celebrators, setCelebrators] = useState(usersCelebratingBirthdays.query())
    useEffect(() => {
        return usersCelebratingBirthdays.subscribe(users => setCelebrators(users))
    })
    return celebrators
}
```

You'll probably be making quite a few hooks, and it can get tedious doing the above, 
here's a general hook you can use with a given rule so you can focus on data transforming
in hooks instead of plumbing

```typescript

// These examples should help expose the types you'll need to
// work with if you want to make general purpose subscriptions
// to rules in other frameworks like RxJs
export const useRuleOne = <SCHEMA, T extends ConditionArgs<SCHEMA>>(
  rule: EnactionResults<SCHEMA, T>,
  filter?: QueryArgs<SCHEMA, T>
) => {
  const [match, setMatch] = useState(rule.queryOne(filter))
  useEffect(() => rule.subscribeOne((d) => setMatch(d), filter))
  return match
}

export const useRule = <SCHEMA, T extends ConditionArgs<SCHEMA>>(
  rule: EnactionResults<SCHEMA, T>,
  filter?: QueryArgs<SCHEMA, T>
) => {
  const [match, setMatch] = useState(rule.query(filter))
  useEffect(() => rule.subscribe((d) => setMatch(d), filter))
  return match
}
```
You can rewrite the `useBirthdayCelebrators` hook with `useRule` like so...

```typescript
const useBirthdayCelebrators = () => useRule(usersCelebratingBirthdays) 
```

### Complex Conditions (joins and matches)

#### Id joins with $
In a rules conditions, any id starting with a `$` is considered a 
_joined id_. Instead of matching on a _specific_ id, the rule will
any set of facts which have the same id AND have an entry for each 
attribute.

The above examples already leverage this, but let's look in a bit more detail
```typescript
const results = rule('All users with a birtday', ({ birthDay }) =>
    ({
      $user: {
        birthDay,
      },
    })).enact()
```

because `$user` starts with a `$`, this rule will apply to all facts which
have an entry for `birthDay`. 

#### Attribute joins to relate ids
**TODO: Make a test for these examples**
Sometimes, you may want to match facts based on their relationship to
each other. The example below illustrates such a condition 

```typescript
rule("Users with same birthday", ({ name, birthDay }) =>
  ({
    $userA: {
      name,
      birthDay,
      sibling: { join: "$userB" }
    },
    $userB: { 
      name,
      birthDay,
      sibling: { join: "$userA" }
    },
  })
).enact(
  {
    when: ({$userA, $userB}) => console.log(`${$userA.name} and ${$userB.name} are siblings!`)
  }
)
```

#### Constraining matches to a specific value
To match your conditions only when a specific value is supplied, you can use
the `{match: someValue}` option on an attribute

```typescript
const bobsBirthDay = rule("Users born on 2008-01-19", ({name}) => ({
  $user: {
    name,
    birthDay: {match: "2008-01-19"}
  }
})).enact()

const bob = bobsBirthDay.queryOne()

// "Bob Johnson"
console.log(bob.$user.name)
```

## Avoiding infinite loops
Sometimes a rule may run an `insert` or `retract` that causes
a rule (or several) to re-trigger infinitely. The solution to this is to mark
which attributes in your conditions should not cause a retrigger. 

```typescript
rule("Updating the date",({todaysDate}) => ({
  today: {
      todaysDate
  } 
})).enact({
  then: ({today}) => {
      // This rule will trigger infinitely 
      insert({
        today: {
            todaysDate: `${new Date()}`
        }
      })
  }
})
```
To rememedy this, you can use the `{then: false}` option on an attribute
to ensure the rule can't re-trigger itself in the same `fire()` if that
specific attribute is changed

```typescript
rule("Updating the date",() => ({
  today: {
    todaysDate: {then: false}
  }
})).enact({
  then: ({today}) => {
    // This rule will trigger once.
    // This is obviously a contrived example, generally if
    // an attribute is causing an infinite trigger, that is a 
    // bug
    insert({
      today: {
        todaysDate: `${new Date()}`
      }
    })
  }
})
```
## Debugging 
> The tooling around this is still very much under active development!

When creating a new `edict` session, you can pass in an option to enable debugging

**NOTE: Enabling profile WILL IMPACT PERFORMANCE!!!**

```typescript
const session = edict<Schema>(
  // Autofire defaults to false 
  false, 
  
  // `enabled: true` turns on debug profiling
  { enabled: true}
)
```
With profiling enabled, you now have access to various tools

```typescript

// A 'frame' is all the rules executed in a given `fire()`. Contains
// The initial mutations applied on the first trigger, and then a list of 
// rules triggered until the `fire()` completed. Includes timing data for the 
// entire frame. The number of retained frames is equal to the value
// of `maxFrameDumps` (defaults to 40)
session.engineDebug.frames

// How many frames have been created since starting the session,
// useful to determine if you're overfiring (especially if `autoFire` is true)
session.engineDebug.numFramesSinceInit

// An array of the inserts and retractions that have
// been added since the last `fire()` call. 
session.engineDebug.mutationsSinceLastFire

// Returns a ton of `performance` API data 
session.perf() 

// Dumps a string that is a graphviz dotfile which diagrams
// the rete network. Probably not that useful to you
session.dotFile()
```
Future changes in this space will be visualizations of rule
execution, and delta's between the fact database before a `fire()` and after a
`fire()` completes. 

## Contributing and setup

Execute the following

```
# Install the things from root
npm i

# Now you can do things
npm run test # runs all the tests
npm run  build # builds all the things
npm run example:phaser # Run the phaser example
npm run example:react # Run the react example!
npm run example:realworld # Run the conduit realworld example!
```
