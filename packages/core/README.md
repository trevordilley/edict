# @edict/core

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
early mornings to keep on this work!


## Usage

Let's walk through a simple usage of Edict.

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

  // An attribute that will be tied to a "single" fact
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
  },
  jill: {
    name: 'Jill Maxwell',
    email: 'jill@gmail.com',
    birthDay: new Date('2022-03-02'),
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
const usersCelebratingBirthdays = rule("All users celebrating their birthday", ({ isCelebratingBirthDay }) =>
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

### More Advanced Examples

_Coming soon! I'll cover complex joins and value matching!_ 

However, you can also look at [basic.spec.ts](src/lib/basic.spec.ts) for
very advanced examples of usage!
