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
    /*** START DEBUGGING CODE ***/
    const matches = node.parent.matches
    let ms: any[] = []
    let i = 0
    matches.forEach((m) => {
      ms[i] = [JSON.stringify(m)]
      i++
    })
    i = 0
    for (const match of matches.values()) {
      ms[i] = [...ms[i], JSON.stringify(match)]
      i++
    }
    for (let i = 0; i < ms.length; i++) {
      const fe = ms[i][0]
      const fo = ms[i][1]
      console.log(fe == fo)
    }
    /*** END DEBUGGING CODE ***/

    // This was originally:
    // parent.node.matches.forEach( (match) => { ...
    // Which passes all my tests.
    // However, I've found that `forEach` calls can allocate a bunch of garbage.
    // Based on the chrome dev tools this is the current culprit for allocations, and
    // it's the last forEach in my codebase, so I'd like to remove it.
    //
    // However... when I switch to `for(const match of matches.values()) {...`
    // a bunch of tests break, and I have no idea why!!
    //
    // The debugging code above is trying to figure out if there is something that doesn't match up.
    // The best I could find is that if you have an array like `["a",,"c"]`, then `.forEach()` will
    // actually skip the second element, where `for..of` will not. But if you have `["a",undefined,"c"] then
    // both behave correctly.
    //
    // BUT, I don't expect to have any "holes" (that's what they call having an empty element in an array) in
    // these arrays! They're procedurally created! So I'm at a loss! I've got my memory usage
    // down from ~20MB/second for my angriest tests to ~700kb/second, so it would be nice to
    // trim it down this last little bit but this is blowing my mind!
    //
    // To see the problem you can run the "multiple joins" test in `rete.spec.ts`
    // or just run `npm run test`
    //
    // Here's a link tot hat test: https://github.com/trevordilley/edict/blob/6637b9e7b8cb25c5b8ff257450405b13b142011e/packages/rete/src/lib/rete.spec.ts
    for (const match of matches.values()) {
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
    }
    node.parent.matches.forEach((match) => {})
  }
}
