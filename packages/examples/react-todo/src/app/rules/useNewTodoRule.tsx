import {useTodoEdict} from "./todoEdict";
import {rule} from "@edict/core";

export const useNewTodoRule = () => {
  const {useRule} = useTodoEdict()
  return useRule(({taskTitle}) => rule({
    name: "New Todo",
    what: {
      newTodo: {
        taskTitle,
      }
    }
  }))
}
