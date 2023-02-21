// Example implementation documentation:
// paper used by o'doyle rules: http://reports-archive.adm.cs.cmu.edu/anon/1995/CMU-CS-95-113.pdf

// Porting from docs/pararules/engine.nim
// Aiming to keep naming and syntax as close as possible to that source
// material initially to minimize defects where possiible until I have a
// real good handle on what's going  on!

import {
  AlphaNode,
  Binding,
  CondFn,
  Condition,
  ConvertMatchFn,
  DebugFrame,
  DebugOptions,
  DEFAULT_MAX_FRAME_DUMPS,
  ExecutedNodes,
  Fact,
  FactFragment,
  FactId,
  Field,
  IdAttr,
  IdAttrs,
  IdAttrsHash,
  InternalFactRepresentation,
  JoinNode,
  Match,
  MatchT,
  MEMORY_NODE_TYPE,
  MemoryNode,
  Production,
  PRODUCTION_ALREADY_EXISTS_BEHAVIOR,
  QueryFilter,
  Session,
  ThenFinallyFn,
  ThenFn,
  Token,
  TokenKind,
  Var,
} from './types'
import * as _ from 'lodash'
import { hashIdAttr, hashIdAttrs } from './utils'

declare const process: {
  env: {
    NODE_ENV: string
  }
}

// NOTE: The generic type T is our SCHEMA type. MatchT is the map of bindings
export const getIdAttr = <SCHEMA>(
  fact: InternalFactRepresentation<SCHEMA>
): IdAttr<SCHEMA> => {
  // TODO: Good way to assert that fact[1] is actually keyof T at compile time?
  return [fact[0], fact[1] as keyof SCHEMA]
}

const addNode = <T>(
  node: AlphaNode<T>,
  newNode: AlphaNode<T>
): AlphaNode<T> => {
  for (let i = 0; i < node.children.length; i++) {
    if (
      node.children[i].testField === newNode.testField &&
      node.children[i].testValue === newNode.testValue
    ) {
      return node.children[i]
    }
  }
  node.children.push(newNode)
  return newNode
}

const addNodes = <T>(
  session: Session<T>,
  nodes: [Field, keyof T | FactId][]
): AlphaNode<T> => {
  let result = session.alphaNode
  for (const node of nodes) {
    result = addNode(result, {
      id: session.nextId(),
      testField: node[0],
      testValue: node[1],
      successors: [],
      children: [],
      facts: new Map(),
    })
  }
  return result
}

function isVar(obj: any): obj is Var {
  return obj.name !== undefined && obj.field !== undefined
}

// To figure out MatchT we need to understand how Vars are treated (so we can understand how MatchT is mapped)
// We should also understand how conditions work in a Rete network

const addConditionsToProduction = <T, U>(
  production: Production<T, U>,
  id: number | string | Var,
  attr: keyof T,
  value: Var | any,
  then: boolean
) => {
  const condition: Condition<T> = { shouldTrigger: then, nodes: [], vars: [] }
  const fieldTypes = [Field.IDENTIFIER, Field.ATTRIBUTE, Field.VALUE]
  for (const fieldType of fieldTypes) {
    if (fieldType === Field.IDENTIFIER) {
      if (isVar(id)) {
        const temp = id
        temp.field = fieldType
        condition.vars.push(temp)
      } else {
        condition.nodes.push([fieldType, id])
      }
    } else if (fieldType === Field.ATTRIBUTE) {
      condition.nodes.push([fieldType, attr])
    } else if (fieldType === Field.VALUE) {
      if (isVar(value)) {
        const temp = value
        temp.field = fieldType
        condition.vars.push(temp)
      } else {
        condition.nodes.push([fieldType, value])
      }
    }
  }
  production.conditions.push(condition)
}

const isAncestor = <T>(x: JoinNode<T>, y: JoinNode<T>): boolean => {
  let node = y
  while (node !== undefined && node.parent) {
    if (node.parent.parent === x) {
      return true
    } else {
      node = node.parent.parent
    }
  }
  return false
}

const addProductionToSession = <T, U>(
  session: Session<T>,
  production: Production<T, U>,
  alreadyExistsBehaviour = PRODUCTION_ALREADY_EXISTS_BEHAVIOR.ERROR
) => {
  if (session.leafNodes.has(production.name)) {
    const message = `${production.name} already exists in session`
    if (alreadyExistsBehaviour === PRODUCTION_ALREADY_EXISTS_BEHAVIOR.QUIET)
      return
    else if (
      alreadyExistsBehaviour === PRODUCTION_ALREADY_EXISTS_BEHAVIOR.WARN
    ) {
      console.warn(message)
      return
    } else if (
      alreadyExistsBehaviour === PRODUCTION_ALREADY_EXISTS_BEHAVIOR.ERROR
    ) {
      throw new Error(message)
    }
  }

  const memNodes: MemoryNode<T>[] = []
  const joinNodes: JoinNode<T>[] = []
  const last = production.conditions.length - 1
  const bindings = new Set<string>()
  const joinedBindings = new Set<string>()
  for (let i = 0; i <= last; i++) {
    const condition = production.conditions[i]
    const leafAlphaNode = addNodes(session, condition.nodes)
    const parentMemNode =
      memNodes.length > 0 ? memNodes[memNodes.length - 1] : undefined
    const joinNode: JoinNode<T> = {
      id: session.nextId(),
      parent: parentMemNode,
      alphaNode: leafAlphaNode,
      condition,
      ruleName: production.name,
      oldIdAttrs: new Set<number>(),
    }
    for (const v of condition.vars) {
      if (bindings.has(v.name)) {
        joinedBindings.add(v.name)
        if (v.field === Field.IDENTIFIER) {
          joinNode.idName = v.name
        }
      } else {
        bindings.add(v.name)
      }
    }
    if (parentMemNode) {
      parentMemNode.child = joinNode
    }
    leafAlphaNode.successors.push(joinNode)
    leafAlphaNode.successors.sort((x, y) => (isAncestor(x, y) ? 1 : -1))
    const memNode: MemoryNode<T> = {
      id: session.nextId(),
      parent: joinNode,
      type: i === last ? MEMORY_NODE_TYPE.LEAF : MEMORY_NODE_TYPE.PARTIAL,
      condition,
      ruleName: production.name,
      lastMatchId: -1,
      matches: new Map<IdAttrsHash, { idAttrs: IdAttrs<T>; match: Match<T> }>(),
      matchIds: new Map<number, IdAttrs<T>>(),
    }
    if (memNode.type === MEMORY_NODE_TYPE.LEAF) {
      memNode.nodeType = {
        condFn: production.condFn,
      }

      const pThenFn = production.thenFn
      if (pThenFn) {
        const sess = { ...session, insideRule: true }
        memNode.nodeType.thenFn = (vars) => {
          pThenFn({
            session: sess,
            rule: production,
            vars: production.convertMatchFn(vars),
          })
        }
      }
      const pThenFinallyFn = production.thenFinallyFn
      if (pThenFinallyFn) {
        const sess = { ...session, insideRule: true }
        memNode.nodeType.thenFinallyFn = () => {
          pThenFinallyFn(sess, production)
        }
      }

      if (session.leafNodes.has(production.name)) {
        throw new Error(
          `${production.name} already exists in session, this should have been handled above`
        )
      }
      session.leafNodes.set(production.name, memNode)
    }
    memNodes.push(memNode)
    joinNodes.push(joinNode)
    joinNode.child = memNode
  }

  const leafMemNode = memNodes[memNodes.length - 1]
  for (let i = 0; i < memNodes.length; i++) {
    memNodes[i].leafNode = leafMemNode
  }

  for (let i = 0; i < joinNodes.length; i++) {
    const node = joinNodes[i]
    const vars = node.condition.vars
    for (let j = 0; j < vars.length; j++) {
      const v = vars[j]
      if (v.field === Field.VALUE && joinedBindings.has(v.name)) {
        node.disableFastUpdates = true
        break
      }
    }
  }
}

const subscribeToProduction = <T, U>(
  session: Session<T>,
  production: Production<T, U>,
  callback: (results: U[]) => void,
  filter?: QueryFilter<T>
): (() => void) => {
  const sub = { callback, filter }
  production.subscriptions.add(sub)
  if (!session.subscriptionsOnProductions.has(production.name)) {
    session.subscriptionsOnProductions.set(production.name, () => {
      production.subscriptions.forEach(({ callback, filter }) =>
        callback(queryAll(session, production, filter))
      )
    })
  }
  const ret = () => {
    production.subscriptions.delete(sub)
    if (production.subscriptions.size === 0) {
      session.subscriptionsOnProductions.delete(production.name)
    }
  }
  return ret
}

const getValFromBindings = <T>(
  bindings: Binding<T> | undefined,
  key: string
) => {
  let cur = bindings
  while (cur !== undefined) {
    if (cur.name === key) {
      return cur.value
    }
    cur = cur.parentBinding
  }
  return undefined
}

export const bindingsToMatch = <T>(binding: Binding<T> | undefined) => {
  const result: MatchT<T> = new Map()
  let cur = binding
  while (cur !== undefined) {
    result.set(cur.name, cur.value)
    cur = cur.parentBinding
  }
  return result
}

const bindingWasSet = <T>(
  binding: Binding<T> | undefined,
  conditionName: string,
  factIdorVal: FactFragment<T>
) => {
  let cur = binding
  while (cur !== undefined) {
    if (cur.name === conditionName && cur.value !== factIdorVal) {
      return { didBindVar: false, binding: binding! }
    }
    cur = cur.parentBinding
  }
  const newBinding = {
    name: conditionName,
    value: factIdorVal,
    parentBinding: binding,
  }
  return { didBindVar: true, binding: newBinding }
}

const bindVarsFromFact = <T>(
  condition: Condition<T>,
  fact: Fact<T>,
  token: Token<T>,
  existingBindings?: Binding<T>
): { didBindVar: boolean; binding?: Binding<T> } => {
  let currentBinding = existingBindings
  for (let i = 0; i < condition.vars.length; i++) {
    const v = condition.vars[i]
    if (v.field === Field.IDENTIFIER) {
      const result = bindingWasSet(currentBinding, v.name, fact[0])
      if (!result.didBindVar) {
        return result
      } else {
        currentBinding = result.binding
      }
    } else if (v.field === Field.ATTRIBUTE) {
      throw new Error(`Attributes can not contain vars: ${v}`)
    } else if (v.field === Field.VALUE) {
      const results = bindingWasSet(currentBinding, v.name, fact[2])
      if (!results.didBindVar) {
        return results
      } else {
        currentBinding = results.binding
      }
    }
  }
  return { didBindVar: true, binding: currentBinding }
}
const leftActivationFromVars = <T>(
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

const leftActivationWithoutAlpha = <T>(
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
      alphaFacts.forEach((alphaFact) => {
        leftActivationFromVars(
          session,
          node,
          idAttrs,
          token,
          alphaFact,
          binding
        )
      })
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

const leftActivationOnMemoryNode = <T>(
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

const rightActivationWithJoinNode = <T>(
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

const rightActivationWithAlphaNode = <T>(
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
  node.successors.forEach((child) => {
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
  })
}

const raiseRecursionLimitException = (
  limit: number,
  additionalText?: string
) => {
  const msg = `Recursion limit hit. The current limit is ${limit} (set by the recursionLimit param of fireRules).`
  throw new Error(
    `${msg} ${additionalText}\n Try using the transient_ variants in your schema to prevent triggering rules in an infinite loop.`
  )
}

const raiseRecursionLimit = <T>(
  limit: number,
  executedNodes: ExecutedNodes<T>
) => {
  let nodes = {}
  for (let i = executedNodes.length - 1; i >= 0; i--) {
    const currNodes = {}
    const nodeToTriggeredNodes = executedNodes[i]
    nodeToTriggeredNodes.forEach((triggeredNodes, node) => {
      const obj = {}
      triggeredNodes.forEach((triggeredNode) => {
        if (triggeredNode.ruleName in nodes) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          obj[triggeredNode.ruleName] = nodes[triggeredNode.ruleName]
        }
      })
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      currNodes[node.ruleName] = obj
    })
    nodes = currNodes
  }
}

const DEFAULT_RECURSION_LIMIT = 16
const fireRules = <T>(
  session: Session<T>,
  recursionLimit: number = DEFAULT_RECURSION_LIMIT
) => {
  if (session.insideRule) {
    return
  }
  let debugFrame: DebugFrame<T> | undefined = undefined
  let startingFacts: Fact<T>[] = []
  if (process.env.NODE_ENV === 'development') {
    if (session.debug.enabled) {
      startingFacts = queryFullSession(session)
      debugFrame = {
        initialMutations: [...session.debug.mutationsSinceLastFire],
        triggeredRules: [],
        dt: 0,
        startingFacts,
        endingFacts: [],
      }
    }
  }
  // Only for debugging purposes, should we remove for prod usage?
  const executedNodes: ExecutedNodes<T> = []

  let recurCount = 0
  // `raiseRecursionLimit(recursionLimit, executedNodes) will explode
  // noinspection InfiniteLoopJS
  // eslint-disable-next-line no-constant-condition
  let notFinishedExecuting = true
  while (notFinishedExecuting) {
    if (recursionLimit >= 0) {
      if (recurCount == recursionLimit) {
        raiseRecursionLimit(recursionLimit, executedNodes)
      }
      recurCount += 1
    }

    const thenQueue = new Array(...session.thenQueue)
    const thenFinallyQueue = new Array(...session.thenFinallyQueue)
    if (thenQueue.length == 0 && thenFinallyQueue.length == 0) {
      notFinishedExecuting = false
      break
    }

    // reset state
    session.thenQueue.clear()
    session.thenFinallyQueue.clear()
    thenQueue.forEach(([node]) => {
      if (node.nodeType) {
        node.nodeType!.trigger = false
      }
    })
    thenFinallyQueue.forEach((node) => {
      if (node.nodeType) {
        node.nodeType!.trigger = false
      }
    })

    const nodeToTriggeredNodeIds = new Map<MemoryNode<T>, Set<MemoryNode<T>>>()
    const add = (
      t: Map<MemoryNode<T>, Set<MemoryNode<T>>>,
      nodeId: MemoryNode<T>,
      s: Set<MemoryNode<T>>
    ) => {
      if (!t.has(nodeId)) {
        t.set(nodeId, new Set<MemoryNode<T>>())
      }
      const existing = t.get(nodeId) ?? new Set<MemoryNode<T>>()
      const ns = new Set<MemoryNode<T>>()
      s.forEach((e) => ns.add(e))
      existing.forEach((e) => ns.add(e))
      t.set(nodeId, ns)
    }

    //  keep a copy of the matches before executing the :then functions.
    //  if we pull the matches from inside the for loop below,
    //  it'll produce non-deterministic results because `matches`
    //  could be modified by the for loop itself. see test: "non-deterministic behavior"

    const nodeToMatches: Map<
      MemoryNode<T>,
      Map<IdAttrsHash, { idAttrs: IdAttrs<T>; match: Match<T> }>
    > = new Map()

    thenQueue.forEach(([node]) => {
      if (!nodeToMatches.has(node)) {
        nodeToMatches.set(node, node.matches)
      }
    })

    // Execute `then` blocks
    thenQueue.forEach(([node, idAttrsHash]) => {
      const matches = nodeToMatches.get(node)
      if (matches !== undefined && matches.has(idAttrsHash)) {
        const match = matches.get(idAttrsHash)
        if (
          match !== undefined &&
          match.match !== undefined &&
          match.match.enabled
        ) {
          session.triggeredNodeIds.clear()
          if (!match.match.bindings) {
            throw new Error(
              `expected match ${match.match.id} to have bindings??`
            )
          }
          node.nodeType?.thenFn?.(bindingsToMatch(match.match.bindings))
          add(nodeToTriggeredNodeIds, node, session.triggeredNodeIds)
        }
      }
    })

    // Execute `thenFinally` blocks
    thenFinallyQueue.forEach((node) => {
      session.triggeredNodeIds.clear()
      if (process.env.NODE_ENV === 'development') {
        if (session.debug.enabled) {
          debugFrame?.triggeredRules.push({
            ruleName: node.ruleName,
            kind: 'thenFinally',
          })
        }
      }
      node.nodeType?.thenFinallyFn?.()
      add(nodeToTriggeredNodeIds, node, session.triggeredNodeIds)
    })

    executedNodes.push(nodeToTriggeredNodeIds)
  }

  if (
    session.subscriptionsOnProductions.size > 0 &&
    session.triggeredSubscriptionQueue.size > 0
  ) {
    session.triggeredSubscriptionQueue.forEach((ts) => {
      const fn = session.subscriptionsOnProductions.get(ts)
      if (fn) fn()
    })
  }
  session.triggeredSubscriptionQueue.clear()
  if (process.env.NODE_ENV === 'development') {
    if (session.debug.enabled) {
      const endingFacts = queryFullSession(session)
      debugFrame!.endingFacts = endingFacts
      session.debug.numFramesSinceInit = session.debug.numFramesSinceInit + 1
      session.debug.frames.push(debugFrame!)
      const maxFrames = session.debug.maxFrameDumps ?? DEFAULT_MAX_FRAME_DUMPS
      if (maxFrames > -1 && session.debug.frames.length > maxFrames) {
        session.debug.frames.shift()
      }
      session.debug.mutationsSinceLastFire = []
    }
  }
  //console.table(varUpdateLog)
  return { executedNodes, session }
}

const getAlphaNodesForFact = <T>(
  session: Session<T>,
  node: AlphaNode<T>,
  fact: Fact<T>,
  root: boolean,
  nodes: Set<AlphaNode<T>>
) => {
  if (root) {
    for (const child of node.children) {
      getAlphaNodesForFact(session, child, fact, false, nodes)
    }
  } else {
    const val =
      node.testField === Field.IDENTIFIER
        ? fact[0]
        : node.testField === Field.ATTRIBUTE
        ? fact[1]
        : node.testField === Field.VALUE
        ? fact[2]
        : undefined
    if (val != node.testValue) {
      return
    }
    nodes.add(node)
    for (const child of node.children) {
      getAlphaNodesForFact(session, child, fact, false, nodes)
    }
  }
}

const upsertFact = <T>(
  session: Session<T>,
  fact: Fact<T>,
  nodes: Set<AlphaNode<T>>
) => {
  const idAttr = getIdAttr<T>(fact)
  const idAttrHash = hashIdAttr(idAttr)
  if (!session.idAttrNodes.has(idAttrHash)) {
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
    // retract any facts from nodes that the new fact wasn't inserted in
    // we use toSeq here to make a copy of the existingNodes, because
    // rightActivation will modify it
    const existingNodesCopy = new Set<AlphaNode<T>>(existingNodes.alphaNodes)
    for (const n of existingNodesCopy) {
      if (!nodes.has(n)) {
        const oldFact = n.facts.get(fact[0].toString())?.get(fact[1].toString())
        if (oldFact === undefined) {
          console.warn("Old fact doesn't exist?")
          return
        }
        rightActivationWithAlphaNode(session, n, {
          fact: oldFact,
          kind: TokenKind.RETRACT,
        })
      }
    }

    // update or insert facts, depending on whether the node already exists
    for (const n of nodes) {
      if (existingNodes.alphaNodes.has(n)) {
        const oldFact = n.facts.get(fact[0].toString())?.get(fact[1].toString())
        rightActivationWithAlphaNode(session, n, {
          fact,
          kind: TokenKind.UPDATE,
          oldFact,
        })
      } else {
        rightActivationWithAlphaNode(session, n, {
          fact,
          kind: TokenKind.INSERT,
        })
      }
    }
  }
}
const insertFact = <T>(session: Session<T>, fact: Fact<T>) => {
  const nodes = new Set<AlphaNode<T>>()
  getAlphaNodesForFact(session, session.alphaNode, fact, true, nodes)
  upsertFact(session, fact, nodes)
  if (process.env.NODE_ENV === 'development') {
    session.debug.mutationsSinceLastFire.push({
      kind: 'insert',
      fact,
    })
  }
  if (session.autoFire) {
    fireRules(session)
  }
}

const retractFact = <T>(session: Session<T>, fact: Fact<T>) => {
  if (process.env.NODE_ENV === 'development') {
    session.debug.mutationsSinceLastFire.push({
      kind: 'retract',
      fact,
    })
  }
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

const retractFactByIdAndAttr = <T>(
  session: Session<T>,
  id: string,
  attr: keyof T,
  autoFire?: boolean
) => {
  if (process.env.NODE_ENV === 'development') {
    session.debug.mutationsSinceLastFire.push({
      kind: 'retract',
      fact: [id, attr, undefined],
    })
  }
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

const defaultInitMatch = <T>() => {
  return new Map<string, FactFragment<T>>()
}
const initSession = <T>(
  autoFire = true,
  debug: DebugOptions = {
    enabled: false,
    maxFrameDumps: 40,
  }
): Session<T> => {
  let nodeIdCounter = 0
  const nextId = () => nodeIdCounter++
  const alphaNode: AlphaNode<T> = {
    id: nodeIdCounter,
    facts: new Map<string, Map<string, Fact<T>>>(),
    successors: [],
    children: [],
  }
  nextId()
  const leafNodes = new Map<string, MemoryNode<T>>()

  const idAttrNodes = new Map<
    number,
    { alphaNodes: Set<AlphaNode<T>>; idAttr: IdAttr<T> }
  >()

  const thenQueue = new Set<[MemoryNode<T>, IdAttrsHash]>()

  const thenFinallyQueue = new Set<MemoryNode<T>>()

  const triggeredNodeIds = new Set<MemoryNode<T>>()

  const subscriptionQueue = new Map<string, () => void>()

  const initMatch = () => defaultInitMatch()

  return {
    alphaNode,
    leafNodes,
    idAttrNodes,
    thenQueue,
    thenFinallyQueue,
    triggeredNodeIds,
    initMatch,
    insideRule: false,
    subscriptionsOnProductions: subscriptionQueue,
    triggeredSubscriptionQueue: new Set<string>(),
    autoFire,
    nextId,
    debug: {
      ...debug,
      numFramesSinceInit: 0,
      frames: [],
      mutationsSinceLastFire: [],
    },
  }
}

const initProduction = <SCHEMA, U>(production: {
  name: string
  convertMatchFn: ConvertMatchFn<SCHEMA, U>
  condFn?: CondFn<SCHEMA>
  thenFn?: ThenFn<SCHEMA, U>
  thenFinallyFn?: ThenFinallyFn<SCHEMA, U>
}): Production<SCHEMA, U> => {
  return {
    ...production,
    conditions: [],
    subscriptions: new Set(),
  }
}

const queryAll = <T, U>(
  session: Session<T>,
  prod: Production<T, U>,
  filter?: QueryFilter<T>
): U[] => {
  const result: U[] = []

  // TODO: Optimize result access?
  // I feel like we should cache the results of these matches until the next `fire()`
  // then make it easy to query the data via key map paths or something. Iterating over all
  // matches could become cumbersome for large data sets
  const matches = session.leafNodes.get(prod.name)?.matches ?? []
  for (const match of matches) {
    const { enabled, bindings } = match[1].match
    if (enabled && bindings) {
      const vars = bindingsToMatch(bindings)
      if (!filter) {
        result.push(prod.convertMatchFn(vars))
      } else {
        const filterKeys = filter.keys() // All keys must be present to match the value
        let hasAllFilterKeys = true

        for (const f of filterKeys) {
          if (!hasAllFilterKeys) break
          if (!vars.has(f)) {
            hasAllFilterKeys = false
            break
          } else {
            const fVal = filter.get(f)
            const vVal = vars.get(f)
            if (!fVal || !vVal || !fVal.includes(vVal)) {
              hasAllFilterKeys = false
              break
            }
          }
        }

        if (hasAllFilterKeys) {
          result.push(prod.convertMatchFn(vars))
        }
      }
    }
  }

  return result
}

const queryFullSession = <T>(session: Session<T>): Fact<T>[] => {
  const result: Fact<T>[] = []
  session.idAttrNodes.forEach(({ alphaNodes, idAttr }) => {
    const nodesArr = new Array(...alphaNodes)
    if (nodesArr.length <= 0) throw new Error('No nodes in session?')
    const firstNode = nodesArr[0]
    const fact = firstNode.facts
      .get(idAttr[0].toString())
      ?.get(idAttr[1].toString())
    if (fact) {
      result.push([idAttr[0], idAttr[1], fact[2]])
    } else {
      console.warn('Missing fact??')
    }
  })

  return result
}

const get = <T, U>(
  session: Session<T>,
  prod: Production<T, U>,
  i: number
): U | undefined => {
  const idAttrs = session.leafNodes.get(prod.name)?.matchIds.get(i)
  if (!idAttrs) return
  const idAttrsHash = hashIdAttrs(idAttrs)
  const vars = session.leafNodes.get(prod.name)?.matches.get(idAttrsHash)
    ?.match.bindings
  if (!vars) {
    console.warn('No vars??')
    return
  }
  return prod.convertMatchFn(bindingsToMatch(vars))
}

const contains = <T>(session: Session<T>, id: string, attr: keyof T): boolean =>
  session.idAttrNodes.has(hashIdAttr([id, attr]))

export const rete = {
  get,
  queryAll,
  queryFullSession,
  initProduction,
  initSession,
  fireRules,
  retractFact,
  retractFactByIdAndAttr,
  insertFact,
  contains,
  addProductionToSession,
  addConditionsToProduction,
  subscribeToProduction,
}
