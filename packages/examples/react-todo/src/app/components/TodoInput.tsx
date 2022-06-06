import {FC} from "react";
import {Todo} from "../types";
import {useTodoEdict} from "../rules/todoEdict";

export const TodoInput: FC<Todo> = ({id, taskComplete, taskTitle}) => {
  const {insert, retract} = useTodoEdict()
  return (<li>
  <label>
    <input type={"checkbox"} checked={taskComplete} value={taskTitle} onChange={() => {
      insert({[id]: { taskComplete: !taskComplete }})
    }}/>
    {taskTitle}
    --
    <button onClick={() => retract(id, "taskComplete", "taskTitle")}>Delete</button>
  </label>
</li>)}
