

# Edict
Edict is a simple state management library exposing an ergonomic API separating data from logic. 
Edict takes a rule-based approach when determining how to reactively update state. 

The API and underlying motivations were inspired by the [O'doyle rules](https://github.com/oakes/odoyle-rules) library. Edict aims to 
expose an API which follows the reactive spirit of the O'doyle Rules library. 

## Usage

First we must define a _schema_ which describes all the allowed kinds of data we can
associated with an id. 

```typescript
const engine = edict({})
```
