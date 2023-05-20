import { AlphaNode, Fact, Field, Session } from '@edict/rete'

export const getAlphaNodesForFact = <T>(
  session: Session<T>,
  node: AlphaNode<T>,
  fact: Fact<T>,
  root: boolean,
  nodes: Set<AlphaNode<T>>
) => {
  if (root) {
    for (const child of node.children) {
      getAlphaNodesForFact(session, child, fact, false, nodes)
    }
  } else {
    const val =
      node.testField === Field.IDENTIFIER
        ? fact[0]
        : node.testField === Field.ATTRIBUTE
        ? fact[1]
        : node.testField === Field.VALUE
        ? fact[2]
        : undefined
    if (val != node.testValue) {
      return
    }
    nodes.add(node)
    for (const child of node.children) {
      getAlphaNodesForFact(session, child, fact, false, nodes)
    }
  }
}
