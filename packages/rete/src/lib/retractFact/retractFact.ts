import { AlphaNode, Fact, Session, TokenKind } from '@edict/rete'
import { getIdAttr } from '../getIdAttr/getIdAttr'
import { hashIdAttr } from '../utils'
import { rightActivationWithAlphaNode } from '../rightActivationWithAlphaNode/rightActivationWithAlphaNode'
import { fireRules } from '../fireRules/fireRules'
import _ from 'lodash'

export const retractFact = <T>(session: Session<T>, fact: Fact<T>) => {
  const idAttr = getIdAttr(fact)
  const idAttrHash = hashIdAttr(idAttr)
  // Make a copy of idAttrNodes[idAttr], since rightActivationWithAlphaNode will modify it
  const idAttrNodes = new Set<AlphaNode<T>>()
  const alphaNodes = session.idAttrNodes.get(idAttrHash)?.alphaNodes ?? []

  for (const alpha of alphaNodes) {
    idAttrNodes.add(alpha)
  }

  for (const node of idAttrNodes) {
    const otherFact = node.facts
      .get(idAttr[0].toString())
      ?.get(idAttr[1].toString())
    if (!_.isEqual(fact, otherFact)) {
      throw new Error(
        `Expected fact ${fact} to be in node.facts at id: ${idAttr[0]}, attr: ${idAttr[1]}`
      )
    }

    rightActivationWithAlphaNode(session, node, {
      fact,
      kind: TokenKind.RETRACT,
    })
  }

  if (session.autoFire) {
    fireRules(session)
  }
}
