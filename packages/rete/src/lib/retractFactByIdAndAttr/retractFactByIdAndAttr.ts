import { AlphaNode, Session, TokenKind } from '@edict/rete'
import { hashIdAttr } from '../utils'
import { rightActivationWithAlphaNode } from '../rightActivationWithAlphaNode/rightActivationWithAlphaNode'
import { fireRules } from '../fireRules/fireRules'
import { AuditAction, AuditRecordType } from '../audit/audit'

export const retractFactByIdAndAttr = <T>(
  session: Session<T>,
  id: string,
  attr: keyof T,
  autoFire?: boolean
) => {
  // Make a copy of idAttrNodes[idAttr], since rightActivationWithAlphaNode will modify it
  const idAttrNodes = new Set<AlphaNode<T>>()
  const alphaNodes =
    session.idAttrNodes.get(hashIdAttr([id, attr]))?.alphaNodes ?? []
  for (const alpha of alphaNodes) {
    idAttrNodes.add(alpha)
  }

  for (const node of idAttrNodes) {
    const fact = node.facts.get(id)?.get(attr.toString())
    if (fact) {
      session.auditor?.log({
        tag: AuditRecordType.FACT,
        action: AuditAction.RETRACTION,
        fact,
      })
      rightActivationWithAlphaNode(session, node, {
        fact,
        kind: TokenKind.RETRACT,
      })
    } else {
      console.warn('Missing fact during retraction?')
    }
  }
  if (autoFire ?? session.autoFire) {
    fireRules(session)
  }
}
