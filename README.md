# Edict
**current version: `0.0.0-coding-before-children-start-screaming`**

Edict is a simple state management library exposing an ergonomic API separating data from logic. 
Edict takes a rule-based approach when determining how to reactively update state. 

The API and underlying motivations were inspired by the [O'doyle rules](https://github.com/oakes/odoyle-rules) library. Edict aims to 
expose an API which follows the reactive spirit of the O'doyle Rules library. 

## Usage

Let's walk through a simple usage of Edict. To illustrate the leverage rule-based 
systems provide during implementation we will build the following app (without a UI! Please see
the React example in the `examples/` directory to see how this ties to UI!).

In this example we'll build an application that figures out which users are 
having a birthday!

### The _AttributeSchema_

The `attributeSchema` describes the shape of your facts, specifically the
types of data that can be associated with an id and value. Later when we insert
a fact it will be clearer how the schema relates to both rules and
facts.

```typescript
// TODO: RENAME `factSchema` to `attributeSchema`! 
const factSchema = {
  // `attr()` is a type narrowing function 
  // that also lets us avoid needing
  // to provide a value while using a JSON object
  // to describe our schema!
  // Open to suggestions concerning better ways to do this!
  name: attr<string>(),
  email: attr<string>(),
  birthDay: attr<Date>(),
  isCelebratingBirthDay: attr<boolean>(),
  
  // An attribute that will be tied to a "single" fact  
  todaysDate: attr<Date>(),
}

// This `session` will maintain it's own database of facts and rules. It also will
// expose functions to add/remove new rules and facts, query the facts etc. 
//
// Edict does not create "global" objects, each invocation of `edict()` creates
// new independent sessions
const mySession = edict(factSchema)
```

One the key benefits to having an attribute schema is type-safety. Edict will not allow you to insert
facts with attributes not declared in the schema for that session. The other really nice benefit is that
with proper editor tooling (auto-completion!) it's trivial to explore the space of possible facts and attributes! 

### Inserting Facts
Now that we have our session, let's insert some facts.  

```typescript
// Here is how you would insert multiple facts about different people with names and emails
const {insert} = mySession

insert({
  // "bob" is the "id", it could be an integer, uuid, whatever makes sense for your application! 
  "bob": {name: "Bob Johnson", email: "bob@hotmail.com", birthDay: new Date("2008-01-19")},
  "tom": {name: "Tom Kennedy", email: "tomk@aol.com", birthDay: new Date("1967-03-02")},
  
  // Let's assume these two are twins born on the same day!
  "jack": {name: "Jack Maxwell", email: "jack@gmail.com", birthDay: new Date("2022-03-02")},
  "jill": {name: "Jill Maxwell", email: "jill@gmail.com", birthDay: new Date("2022-03-02")},
  
  "today": {todaysDate: new Date()}
})
```

> Under the hood, facts are represented as entity-attribute-value tuples. So the 
> entry "bob" above is internally stored as 
> ["bob", "name", "Bob Johnson"], ["bob", "email", "bob@hotmail.com"], etc.
> This enables maximum flexibility for rule definition and engine implementation.
> However a design goal of Edict is to expose an idiomatic javascript API
> to keep usage ergonomic.

Now let's create our first rule!

```typescript
const { addRule } = mySession 

const birthDaysMatchingTodayAreCelebrating! = addRule(({birthDay, todaysDate}) => rule({
  // All rules have a unique name, it can be descriptive!
  name: "When a birthday is today, celebrate the birthday!",
 
  what: {
    // "today" matches the id when inserting the fact (see above)
    today: {
      todaysDate
    },
    
    // "$user" is a _bound_ id. By prefixing the id with "$" you signal to edict that
    // you want to match ANY fact with the following attributes. This allows you to "join"
    // many facts to be processed by this rule! 
    $user: {
      birthDay,
    }
  }, 
 
  // "when" filters out facts, runs before "then"
  when: ({$user, today}) => {
    // Match users who have a birthday today! 
    return $user.birthDay.getMonth() === today.todaysDate.getMonth() && 
      $user.birthDay.getDate() === today.todaysDate.getDate() 
  },
  
  // The "then" block will receive two arguments. First is an object
  // with the matches (as described above) and the second is operations
  // that can be done within the session (for convenience in case the rule is not 
  // in a scope where the session is available)
  then: ({$user, today}, {insert}) => {
    insert({[$user.id]: { isCelebratingBirthDay: true }})
  }
}))
```

### Queries

All rules are also queries. The `birthDaysMatchingTodayAreCelebrating` exposes a `query()` function
that will return the facts matched by the rule. This is helpful because often your rules match
the data you need for the rest of your applications logic. 

Some rules are just queries, here's an example of that:

```typescript
const usersCelebratingBirthdays = addRule(({isCelebratingBirthday}) => rule({
  name: "All users celebrating their birthday",
  what: {
    $user: {
      isCelebratingBirthday
    }
  }
}))

// Queries won't have data until at least one `fire()` is called!
mySession.fire()

const {$user} = usersCelebratingBirthdays.query()

$user.forEach(u => console.log(`${u.name} is celebrating their birthday!`))
```

The subtle power of this is that we're really leaning on JSON being a native Javascript 
feature, so we can use language features like the spread operator to reuse `what` blocks and compose
rules in general! 
