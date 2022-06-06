import {FC} from "react";
import {TodoInput} from "./TodoInput";
import {useTodosRule} from "../rules/useTodosRule";

export const TodoList:FC = () => {
  const todos = useTodosRule()
   const el = todos.map(({$todo}) =>
      <TodoInput key={$todo.id} {...$todo} />
   )
  return <ul>{el}</ul>
}
