import { Binding, Fact, IdAttrs, JoinNode, Session } from '@edict/rete'
import { getIdAttr } from '../getIdAttr/getIdAttr'
import { hashIdAttr } from '../utils'
import { leftActivationOnMemoryNode } from '../leftActivationOnMemoryNode/leftActivationOnMemoryNode'
import { bindVarsFromFact } from '../bindVarsFromFact/bindVarsFromFact'
import { Token } from '../types'

export const leftActivationFromVars = <T>(
  session: Session<T>,
  node: JoinNode<T>,
  idAttrs: IdAttrs<T>,
  token: Token<T>,
  alphaFact: Fact<T>,
  bindings: Binding<T>
) => {
  const bindResults = bindVarsFromFact(
    node.condition,
    alphaFact,
    token,
    bindings
  )
  if (bindResults.didBindVar) {
    const idAttr = getIdAttr<T>(alphaFact)
    const newIdAttrs = [...idAttrs]
    newIdAttrs.push(idAttr)
    const newToken = { fact: alphaFact, kind: token.kind }
    const isNew = !node.oldIdAttrs?.has(hashIdAttr(idAttr))
    const child = node.child
    if (!child) {
      console.error('Session', JSON.stringify(session))
      console.error(`Node ${node.idName}`, JSON.stringify(node))
      throw new Error('Expected node to have child!')
    }
    leftActivationOnMemoryNode(
      session,
      child,
      newIdAttrs,
      newToken,
      isNew,
      bindResults.binding!
    )
  }
}
