import { AlphaNode, Fact, Session, TokenKind } from '@edict/rete'
import { getIdAttr } from '../getIdAttr/getIdAttr'
import { hashIdAttr } from '../utils'
import { rightActivationWithAlphaNode } from '../rightActivationWithAlphaNode/rightActivationWithAlphaNode'
import { fireRules } from '../fireRules/fireRules'
import _ from 'lodash'
import { AuditAction, AuditRecordType } from '../audit'

export const retractFact = <T>(session: Session<T>, fact: Fact<T>) => {
  try {
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
      session.auditor?.log?.({
        action: AuditAction.RETRACTION,
        fact,
        tag: AuditRecordType.FACT,
      })
      rightActivationWithAlphaNode(session, node, {
        fact,
        kind: TokenKind.RETRACT,
      })
    }
    if (session.autoFire) {
      fireRules(session)
    }
  } catch (e) {
    session.auditor?.flush?.()
    throw e
  }
}
