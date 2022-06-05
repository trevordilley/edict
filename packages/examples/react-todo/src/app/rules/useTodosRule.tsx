import {useTodoEdict} from "./todoEdict";
import {rule} from "@edict/core";

export const useTodosRule = () => {
  const { useRule } = useTodoEdict()
  return useRule(({taskTitle, taskComplete}) => rule({
    name: "All Todos",
    what: {
      $todo: {
        taskTitle,
        taskComplete,
      }
    }
  }))
}
