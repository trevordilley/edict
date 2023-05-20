import { Binding, FactFragment } from '@edict/rete'

export const bindingWasSet = <T>(
  binding: Binding<T> | undefined,
  conditionName: string,
  factIdorVal: FactFragment<T>
) => {
  let cur = binding
  while (cur !== undefined) {
    if (cur.name === conditionName && cur.value !== factIdorVal) {
      return { didBindVar: false, binding: binding! }
    }
    cur = cur.parentBinding
  }
  const newBinding = {
    name: conditionName,
    value: factIdorVal,
    parentBinding: binding,
  }
  return { didBindVar: true, binding: newBinding }
}
