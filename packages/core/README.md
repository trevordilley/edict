# @edict/core

Write your business logic simply and declaratively with Edict!

## Acknowledgements!

The API and underlying motivations were inspired by the [O'doyle rules](https://github.com/oakes/odoyle-rules) library. Edict aims to
expose an API which follows the reactive spirit of the O'doyle Rules library.

This library leverages the powerful and efficient Rete Algorithm. The `@edict/rete` package used in this library
is as literal a port from Sekao's Pararules engine.nim as possible. This library wouldn't have been remotely possible without the hard work he put into his implementation. This library stands on his shoulders in every way! 

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

### Inserting Facts

Now that we have our session, let's insert some facts.

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

  today: { todaysDate: new Date() },
});
```

> Under the hood, facts are represented as entity-attribute-value tuples. So the
> entry "bob" above is internally stored as
> ["bob", "name", "Bob Johnson"], ["bob", "email", "bob@hotmail.com"], etc.
> This enables maximum flexibility for rule definition and engine implementation.
> However a design goal of Edict is to expose an idiomatic javascript API
> to keep usage ergonomic.

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

     // The "then" block will receive two arguments. First is an object
     // with the matches (as described above) and the second is operations
     // that can be done within the session (for convenience in case the rule is not
     // in a scope where the session is available)
     then: ({ $user, today }, { insert }) => {
      insert({ [$user.id]: { isCelebratingBirthDay: true } });
     },
});
```

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
const usersCelebratingBirthdays = rule("All users celebrating their birthday", ({ isCelebratingBirthday }) =>
  ({
    $user: {
      isCelebratingBirthday,
    },
  })
).enact() // Don't forget to call `enact()`! Your editor should give you a hint when you go to query things!

const { $user } = usersCelebratingBirthdays.query();

$user.forEach((u) => console.log(`${u.name} is celebrating their birthday!`));
```
