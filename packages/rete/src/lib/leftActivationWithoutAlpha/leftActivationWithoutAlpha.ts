import { Binding, IdAttrs, JoinNode, Session } from '@edict/rete'
import { getValFromBindings } from '../getValFromBindings/getValFromBindings'
import { leftActivationFromVars } from '../leftActivationFromVars/leftActivationFromVars'
import { Token } from '../types'

export const leftActivationWithoutAlpha = <T>(
  session: Session<T>,
  node: JoinNode<T>,
  idAttrs: IdAttrs<T>,
  token: Token<T>,
  binding: Binding<T>
) => {
  if (node.idName && node.idName != '') {
    const id = getValFromBindings(binding, node.idName) //vars.get(node.idName)
    const idStr = id !== undefined ? `${id}` : undefined
    if (idStr !== undefined && node.alphaNode.facts.get(idStr)) {
      const alphaFacts = [...(node.alphaNode.facts.get(idStr)?.values() ?? [])]
      if (!alphaFacts)
        throw new Error(`Expected to have alpha facts for ${node.idName}`)
      for (const alphaFact of alphaFacts) {
        leftActivationFromVars(
          session,
          node,
          idAttrs,
          token,
          alphaFact,
          binding
        )
      }
    }
  } else {
    for (const fact of node.alphaNode.facts.values()) {
      for (const alphaFact of fact.values()) {
        leftActivationFromVars(
          session,
          node,
          idAttrs,
          token,
          alphaFact,
          binding
        )
      }
    }
  }
}
