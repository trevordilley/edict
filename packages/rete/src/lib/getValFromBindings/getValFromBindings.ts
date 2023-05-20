import { Binding } from '@edict/rete'

export const getValFromBindings = <T>(
  bindings: Binding<T> | undefined,
  key: string
) => {
  let cur = bindings
  while (cur !== undefined) {
    if (cur.name === key) {
      return cur.value
    }
    cur = cur.parentBinding
  }
  return undefined
}
