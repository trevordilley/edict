import { edict } from '@edict/core';
import { FC, useEffect, useState } from 'react';
import { ITodo } from './types';

// Edict is a simple state management library leveraging a reactive rule-based
// approach to simplify and decouple logic from data
//
// Below is a very **simple** todo app showcasing Edict's react
// bindings. For a more interesting an involved example leveraging
// some of great leverage gained from this state management library
// please refer to the game example!

// First we use this react specific function `invokeEdict`
// which returns a Context Provider and a hook.
//
// The `factSchema` is a mapping from name to type via the `attr()`
// function. Providing a fact schema will provide comprehensive type
// safety.

const { rule, retract, insert } = edict<{ isComplete: boolean; title: string }>(
  true,
  { enabled: true }
);

const { subscribe, query } = rule('All Todos', ({ title, isComplete }) => ({
  // `$todo` is a _bound_ id. What that means is we're not matching on a
  // specific id for a fact, but any facts which have the `title` and `isComplete`
  // attribute.
  $todo: {
    title,
    isComplete,
  },
})).enact();

// the `useEdict()` function exposes the api of the Edict library.
// Here we're defining a rule which grabs all facts in the fact database
// which have a `title` and `isComplete` attribute
//
// There are a few important elements here, which we'll go over line by line
// below.
export const useTodosRule = () => {
  const [todos, setTodos] = useState(query());
  useEffect(() => {
    return subscribe((results) => {
      console.log(results);
      setTodos(results);
    });
  });
  return todos;
};

const NewTodo: FC = () => {
  const [title, setTitle] = useState('');
  const id = (title: string) => title.replace(' ', '-').toLowerCase();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        // Here we use the `insert` function to add a new fact.
        insert({
          // The key is the fact's id
          [id(title)]: {
            // The attribute of this object are the attribute-value pairs of the fact
            title: title,
            isComplete: false,
          },
        });
        setTitle('');
      }}
    >
      <input
        type={'text'}
        placeholder={'New Todo'}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
        }}
      />
      <input type={'submit'} value={'Add Todo!'} />
    </form>
  );
};

const Todo: FC<ITodo> = ({ id, isComplete, title }) => {
  return (
    <li>
      <label>
        <input
          type={'checkbox'}
          checked={isComplete}
          value={title}
          onChange={() => {
            // Using the `id` of the todo, we update it's `isComplete` attribute.
            // Insertions are _upserts_
            insert({ [id]: { isComplete: !isComplete } });
          }}
        />
        {title}
        --
        <button
          onClick={() =>
            // Retractions take a fact id, and then the list of attribute names to remove.
            // It's useful to know that internally Edict stores facts as `[id, attribute, value]` tuples
            // but exposes as idiomatic javascript syntax as possible when working with facts.
            //
            // Currently, `retract` is the only function which doesn't adhere to this approach.
            retract(id, 'isComplete', 'title')
          }
        >
          Delete
        </button>
      </label>
    </li>
  );
};

const TodoList: FC = () => {
  // the `useRule()` (which `useTodosRule()` composes) hook returns
  // the results of the firing of the rule.
  const todos = useTodosRule();

  // The results of a rule is always an array of objects with attributes
  // matching the id's used in the `what` block.
  const el = todos.map(({ $todo }) => <Todo key={$todo.id} {...$todo} />);
  return <ul>{el}</ul>;
};

export function App() {
  return (
    <>
      <h1>Example To-Do App</h1>
      <div>
        <NewTodo />
        <TodoList />
      </div>
    </>
  );
}

export default App;
