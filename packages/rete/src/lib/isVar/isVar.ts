import { Var } from '@edict/rete'

export function isVar(obj: any): obj is Var {
  return obj.name !== undefined && obj.field !== undefined
}
