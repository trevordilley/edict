import {FC, useState} from "react";
import { useTodoEdict} from "../rules/todoEdict";
import {TodoList} from "./TodoList";

export const NewTodo: FC = () => {
  const {insert,} = useTodoEdict()
  const [title, setTitle] = useState("")
  const id = (title: string) =>
    title.replace(" ", "-").toLowerCase()


  return (<form onSubmit={(e) => {
    e.preventDefault()
    insert( {[id(title)]: {taskTitle: title, taskComplete: false}})
    insert({newTask: {taskTitle: title}})
    setTitle("")
  }}>
    <input type={"text"} placeholder={"New Todo"} value={title} onChange={e => {
      setTitle(e.target.value)
    }}/>
    <input type={"submit"} value={"Add Todo!"} />
    <TodoList/>
  </form>)
}

