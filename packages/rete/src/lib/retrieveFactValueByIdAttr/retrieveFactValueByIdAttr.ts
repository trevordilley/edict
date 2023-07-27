import { FactId, Session } from '@edict/rete'
import { hashIdAttr } from '../utils'

export const retrieveFactValueByIdAttr = <
  SCHEMA,
  T extends keyof SCHEMA,
  X extends SCHEMA[T]
>(
  session: Session<SCHEMA>,
  id: FactId,
  attr: T
): X | undefined => {
  const hashed = hashIdAttr([id, attr.toString()])
  const nodes = session.idAttrNodes.get(hashed)
  if (nodes === undefined) return
  const alphaNodes = nodes.alphaNodes
  for (const node of alphaNodes) {
    const result = node.facts.get(id.toString())?.get(attr.toString())
    if (result !== undefined) return result[2]
  }
  return undefined
}
