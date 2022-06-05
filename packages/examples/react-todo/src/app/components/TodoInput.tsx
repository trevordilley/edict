import {FC} from "react";
import {Todo} from "../types";
import {useTodoEdict} from "../rules/todoEdict";

export const TodoInput: FC<Todo> = ({id, taskComplete, taskTitle}) => {
  const {insert} = useTodoEdict()
  return (<li>
  <label>
    <input type={"checkbox"} checked={taskComplete} value={taskTitle} onChange={() => {
      insert({[id]: { taskComplete: !taskComplete }})
    }}/>
    {taskTitle}
  </label>
</li>)}
