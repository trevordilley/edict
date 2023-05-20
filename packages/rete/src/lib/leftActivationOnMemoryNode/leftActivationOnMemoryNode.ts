import {
  Binding,
  IdAttrs,
  Match,
  MEMORY_NODE_TYPE,
  MemoryNode,
  Session,
  TokenKind,
} from '@edict/rete'
import { hashIdAttr, hashIdAttrs } from '../utils'
import { leftActivationWithoutAlpha } from '../leftActivationWithoutAlpha/leftActivationWithoutAlpha'
import { bindingsToMatch } from '../bindingsToMatch/bindingsToMatch'
import { Token } from '../types'

export const leftActivationOnMemoryNode = <T>(
  session: Session<T>,
  node: MemoryNode<T>,
  idAttrs: IdAttrs<T>,
  token: Token<T>,
  isNew: boolean,
  bindings: Binding<T>
) => {
  const idAttr = idAttrs[idAttrs.length - 1]
  const idAttrsHash = hashIdAttrs(idAttrs)
  if (
    isNew &&
    (token.kind === TokenKind.INSERT || token.kind === TokenKind.UPDATE) &&
    node.condition.shouldTrigger &&
    node.leafNode &&
    node.leafNode.nodeType
  ) {
    node.leafNode.nodeType.trigger = true
  }

  if (token.kind === TokenKind.INSERT || token.kind === TokenKind.UPDATE) {
    let match: Match<T>
    if (node.matches.has(idAttrsHash)) {
      match = node.matches.get(idAttrsHash)!.match!
    } else {
      node.lastMatchId += 1
      match = { id: node.lastMatchId }
    }
    match.bindings = bindings
    match.enabled =
      node.type !== MEMORY_NODE_TYPE.LEAF ||
      !node.nodeType?.condFn ||
      (node.nodeType?.condFn(bindingsToMatch(bindings)) ?? true)
    node.matchIds.set(match.id, idAttrs)
    node.matches.set(idAttrsHash, { idAttrs, match })
    if (node.type === MEMORY_NODE_TYPE.LEAF && node.nodeType?.trigger) {
      session.triggeredSubscriptionQueue.add(node.ruleName)
      if (node.nodeType?.thenFn) {
        session.thenQueue.add([node, idAttrsHash])
      }
      if (node.nodeType.thenFinallyFn) {
        session.thenFinallyQueue.add(node)
      }
    }
    node.parent.oldIdAttrs.add(hashIdAttr(idAttr))
  } else if (token.kind === TokenKind.RETRACT) {
    const idToDelete = node.matches.get(idAttrsHash)
    if (idToDelete) {
      node.matchIds.delete(idToDelete.match.id)
    }
    node.matches.delete(idAttrsHash)
    node.parent.oldIdAttrs.delete(hashIdAttr(idAttr))
    if (node.type === MEMORY_NODE_TYPE.LEAF && node.nodeType) {
      session.triggeredSubscriptionQueue.add(node.ruleName)
      if (node.nodeType.thenFinallyFn) {
        session.thenFinallyQueue.add(node)
      }
    }
  }
  if (node.type !== MEMORY_NODE_TYPE.LEAF && node.child) {
    leftActivationWithoutAlpha(session, node.child, idAttrs, token, bindings)
  }
}
