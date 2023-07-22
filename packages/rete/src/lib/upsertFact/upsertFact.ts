import { AlphaNode, Fact, Session, TokenKind } from '@edict/rete'
import { getIdAttr } from '../getIdAttr/getIdAttr'
import { hashIdAttr } from '../utils'
import { rightActivationWithAlphaNode } from '../rightActivationWithAlphaNode/rightActivationWithAlphaNode'
import { AuditAction, AuditRecordType } from '../audit/audit'

export const upsertFact = <T>(
  session: Session<T>,
  fact: Fact<T>,
  nodes: Set<AlphaNode<T>>
) => {
  try {
    const idAttr = getIdAttr<T>(fact)
    const idAttrHash = hashIdAttr(idAttr)
    if (!session.idAttrNodes.has(idAttrHash)) {
      session.auditor?.log({
        tag: AuditRecordType.FACT,
        fact,
        action: AuditAction.INSERTION,
      })
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
      let didRetract = false
      // retract any facts from nodes that the new fact wasn't inserted in
      // we use toSeq here to make a copy of the existingNodes, because
      // rightActivation will modify it
      const existingNodesCopy = new Set<AlphaNode<T>>(existingNodes.alphaNodes)
      for (const n of existingNodesCopy) {
        if (!nodes.has(n)) {
          const oldFact = n.facts
            .get(fact[0].toString())
            ?.get(fact[1].toString())
          if (oldFact === undefined) {
            console.warn("Old fact doesn't exist?")
            continue
          }
          didRetract = true
          rightActivationWithAlphaNode(session, n, {
            fact: oldFact,
            kind: TokenKind.RETRACT,
          })
        }
      }
      if (didRetract) {
        session.auditor?.log({
          tag: AuditRecordType.FACT,
          fact,
          action: AuditAction.RETRACTION,
        })
      }

      let didUpdate = undefined
      let oldFactRecord = undefined
      // update or insert facts, depending on whether the node already exists
      for (const n of nodes) {
        if (existingNodes.alphaNodes.has(n)) {
          const oldFact = n.facts
            .get(fact[0].toString())
            ?.get(fact[1].toString())
          didUpdate = true
          oldFactRecord = oldFact
          rightActivationWithAlphaNode(session, n, {
            fact,
            kind: TokenKind.UPDATE,
            oldFact,
          })
        } else {
          didUpdate = false
          rightActivationWithAlphaNode(session, n, {
            fact,
            kind: TokenKind.INSERT,
          })
        }
      }
      if (didUpdate === true) {
        session.auditor?.log({
          tag: AuditRecordType.FACT,
          fact,
          action: AuditAction.UPDATE,
          oldFact: oldFactRecord,
        })
      } else if (didUpdate === false) {
        session.auditor?.log({
          tag: AuditRecordType.FACT,
          fact,
          action: AuditAction.INSERTION,
        })
      }
    }
  } catch (e) {
    session.auditor?.flush()
    throw e
  }
}
