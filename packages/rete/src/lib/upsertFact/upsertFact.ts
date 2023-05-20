import { AlphaNode, Fact, Session, TokenKind } from '@edict/rete'
import { getIdAttr } from '../getIdAttr/getIdAttr'
import { hashIdAttr } from '../utils'
import { rightActivationWithAlphaNode } from '../rightActivationWithAlphaNode/rightActivationWithAlphaNode'

export const upsertFact = <T>(
  session: Session<T>,
  fact: Fact<T>,
  nodes: Set<AlphaNode<T>>
) => {
  const idAttr = getIdAttr<T>(fact)
  const idAttrHash = hashIdAttr(idAttr)
  if (!session.idAttrNodes.has(idAttrHash)) {
    for (const n of nodes) {
      rightActivationWithAlphaNode(session, n, {
        fact,
        kind: TokenKind.INSERT,
      })
    }
  } else {
    const existingNodes = session.idAttrNodes.get(idAttrHash)
    if (existingNodes === undefined) {
      return
    }
    // retract any facts from nodes that the new fact wasn't inserted in
    // we use toSeq here to make a copy of the existingNodes, because
    // rightActivation will modify it
    const existingNodesCopy = new Set<AlphaNode<T>>(existingNodes.alphaNodes)
    for (const n of existingNodesCopy) {
      if (!nodes.has(n)) {
        const oldFact = n.facts.get(fact[0].toString())?.get(fact[1].toString())
        if (oldFact === undefined) {
          console.warn("Old fact doesn't exist?")
          return
        }
        rightActivationWithAlphaNode(session, n, {
          fact: oldFact,
          kind: TokenKind.RETRACT,
        })
      }
    }

    // update or insert facts, depending on whether the node already exists
    for (const n of nodes) {
      if (existingNodes.alphaNodes.has(n)) {
        const oldFact = n.facts.get(fact[0].toString())?.get(fact[1].toString())
        rightActivationWithAlphaNode(session, n, {
          fact,
          kind: TokenKind.UPDATE,
          oldFact,
        })
      } else {
        rightActivationWithAlphaNode(session, n, {
          fact,
          kind: TokenKind.INSERT,
        })
      }
    }
  }
}
