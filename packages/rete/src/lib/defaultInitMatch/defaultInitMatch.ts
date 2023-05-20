import { FactFragment } from '@edict/rete'

export const defaultInitMatch = <T>() => {
  return new Map<string, FactFragment<T>>()
}
