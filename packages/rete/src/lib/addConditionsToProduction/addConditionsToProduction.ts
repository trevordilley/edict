import { Condition, Field, Production, Var } from '@edict/rete'
import { isVar } from '../isVar/isVar'

export const addConditionsToProduction = <T, U>(
  production: Production<T, U>,
  id: number | string | Var,
  attr: keyof T,
  value: Var | any,
  then: boolean
) => {
  const condition: Condition<T> = { shouldTrigger: then, nodes: [], vars: [] }
  const fieldTypes = [Field.IDENTIFIER, Field.ATTRIBUTE, Field.VALUE]
  for (const fieldType of fieldTypes) {
    if (fieldType === Field.IDENTIFIER) {
      if (isVar(id)) {
        const temp = id
        temp.field = fieldType
        condition.vars.push(temp)
      } else {
        condition.nodes.push([fieldType, id])
      }
    } else if (fieldType === Field.ATTRIBUTE) {
      condition.nodes.push([fieldType, attr])
    } else if (fieldType === Field.VALUE) {
      if (isVar(value)) {
        const temp = value
        temp.field = fieldType
        condition.vars.push(temp)
      } else {
        condition.nodes.push([fieldType, value])
      }
    }
  }
  production.conditions.push(condition)
}
