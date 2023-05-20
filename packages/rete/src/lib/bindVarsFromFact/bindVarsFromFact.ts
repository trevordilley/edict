import { Binding, Condition, Fact, Field } from '@edict/rete'
import { bindingWasSet } from '../bindingWasSet/bindingWasSet'
import { Token } from '../types'

export const bindVarsFromFact = <T>(
  condition: Condition<T>,
  fact: Fact<T>,
  token: Token<T>,
  existingBindings?: Binding<T>
): { didBindVar: boolean; binding?: Binding<T> } => {
  let currentBinding = existingBindings
  for (let i = 0; i < condition.vars.length; i++) {
    const v = condition.vars[i]
    if (v.field === Field.IDENTIFIER) {
      const result = bindingWasSet(currentBinding, v.name, fact[0])
      if (!result.didBindVar) {
        return result
      } else {
        currentBinding = result.binding
      }
    } else if (v.field === Field.ATTRIBUTE) {
      throw new Error(`Attributes can not contain vars: ${v}`)
    } else if (v.field === Field.VALUE) {
      const results = bindingWasSet(currentBinding, v.name, fact[2])
      if (!results.didBindVar) {
        return results
      } else {
        currentBinding = results.binding
      }
    }
  }
  return { didBindVar: true, binding: currentBinding }
}
