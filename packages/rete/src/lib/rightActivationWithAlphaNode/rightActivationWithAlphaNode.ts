import { AlphaNode, Fact, Session, TokenKind } from '@edict/rete'
import { getIdAttr } from '../getIdAttr/getIdAttr'
import { hashIdAttr } from '../utils'
import { rightActivationWithJoinNode } from '../rightActivationWithJoinNode/rightActivationWithJoinNode'
import { Token } from '../types'

export const rightActivationWithAlphaNode = <T>(
  session: Session<T>,
  node: AlphaNode<T>,
  token: Token<T>
) => {
  const idAttr = getIdAttr(token.fact)
  const idAttrHash = hashIdAttr(idAttr)
  const [id, attr] = idAttr
  if (token.kind === TokenKind.INSERT) {
    if (!node.facts.has(id.toString())) {
      node.facts.set(id.toString(), new Map<string, Fact<T>>())
    }
    node.facts.get(id.toString())!.set(attr.toString(), token.fact)
    if (!session.idAttrNodes.has(idAttrHash)) {
      session.idAttrNodes.set(idAttrHash, {
        alphaNodes: new Set<AlphaNode<T>>(),
        idAttr,
      })
    }
    session.idAttrNodes.get(idAttrHash)!.alphaNodes.add(node)
  } else if (token.kind === TokenKind.RETRACT) {
    node.facts.get(id.toString())?.delete(attr.toString())
    session.idAttrNodes.get(idAttrHash)!.alphaNodes.delete(node)
    if (session.idAttrNodes.get(idAttrHash)!.alphaNodes.size == 0) {
      session.idAttrNodes.delete(idAttrHash)
    }
  } else if (token.kind === TokenKind.UPDATE) {
    const idAttr = node.facts.get(id.toString())
    if (idAttr === undefined) throw new Error(`Expected fact id to exist ${id}`)
    idAttr.set(attr.toString(), token.fact)
  }
  for (const child of node.successors) {
    if (token.kind === TokenKind.UPDATE && child.disableFastUpdates) {
      if (token.oldFact === undefined)
        throw new Error(`Expected token ${token.fact} to have an oldFact`)

      rightActivationWithJoinNode(session, child, idAttr, {
        fact: token.oldFact,
        kind: TokenKind.RETRACT,
      })
      rightActivationWithJoinNode(session, child, idAttr, {
        fact: token.fact,
        kind: TokenKind.INSERT,
      })
    } else {
      rightActivationWithJoinNode(session, child, idAttr, token)
    }
  }
}
