import { AlphaNode, FactId, Field, Session } from '@edict/rete'
import { addNode } from '../addNode/addNode'

export const addNodes = <T>(
  session: Session<T>,
  nodes: [Field, keyof T | FactId][]
): AlphaNode<T> => {
  let result = session.alphaNode
  for (const node of nodes) {
    result = addNode(result, {
      id: session.nextId(),
      testField: node[0],
      testValue: node[1],
      successors: [],
      children: [],
      facts: new Map(),
    })
  }
  return result
}
