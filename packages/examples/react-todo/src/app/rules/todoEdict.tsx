import {invokeEdict} from "@edict/react";
import {attr, edict, rule} from "@edict/core";
const todoEdict = edict({
  factSchema: {
    // Tasks
    taskComplete: attr<boolean>(),
    taskTitle: attr<string>(),
  }})

const { Edict, useEdict } = invokeEdict(todoEdict)


export const TodoEdict = Edict
export const useTodoEdict = useEdict

