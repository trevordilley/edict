import { IdAttr, JoinNode, Session } from '@edict/rete'
import { leftActivationOnMemoryNode } from '../leftActivationOnMemoryNode/leftActivationOnMemoryNode'
import { bindVarsFromFact } from '../bindVarsFromFact/bindVarsFromFact'
import { getValFromBindings } from '../getValFromBindings/getValFromBindings'
import { Token } from '../types'

export const rightActivationWithJoinNode = <T>(
  session: Session<T>,
  node: JoinNode<T>,
  idAttr: IdAttr<T>,
  token: Token<T>
) => {
  if (node.parent === undefined) {
    const bindings = bindVarsFromFact(node.condition, token.fact, token)
    if (bindings.didBindVar) {
      if (!node.child) {
        throw new Error(`Unexpected undefined child for node ${node.idName}`)
      }
      leftActivationOnMemoryNode(
        session,
        node.child,
        [idAttr],
        token,
        true,
        bindings.binding!
      )
    }
  } else {
    /// Fix this, for some reason if we try to do a `for...of` loop it breaks all the things...
    // the foreach is creating a ton of allocations, we wanna stop that.
    node.parent.matches.forEach((match) => {
      // TODO: We need to find call sites where we need to consolidate the bindings into a match
      const idName = node.idName
      if (
        idName &&
        idName !== '' &&
        getValFromBindings(match.match.bindings, idName) != token.fact[0]
      ) {
        return
      }
      const bindings = bindVarsFromFact(
        node.condition,
        token.fact,
        token,
        match.match.bindings
      )
      if (bindings.didBindVar) {
        const newIdAttrs = [...match.idAttrs]
        newIdAttrs.push(idAttr)
        const child = node.child
        if (!child)
          throw new Error(`Unexpected null child for node: ${node.idName}`)

        leftActivationOnMemoryNode(
          session,
          child,
          newIdAttrs,
          token,
          true,
          bindings.binding!
        )
      }
    })
  }
}
