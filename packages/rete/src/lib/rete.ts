// Example implementation documentation:
// paper used by o'doyle rules: http://reports-archive.adm.cs.cmu.edu/anon/1995/CMU-CS-95-113.pdf

// Porting from docs/pararules/engine.nim
// Aiming to keep naming and syntax as close as possible to that source
// material initially to minimize defects where possiible until I have a
// real good handle on what's going  on!

import {
  AlphaNode, CondFn,
  Condition, ConvertMatchFn,
  ExecutedNodes,
  Fact,
  FactFragment,
  Field, InitMatchFn,
  JoinNode,
  Match,
  MatchT,
  MEMORY_NODE_TYPE,
  MemoryNode,
  Production,
  Session, ThenFinallyFn, ThenFn,
  Token,
  TokenKind,
  Var
} from "./types";
import {IdAttr, IdAttrs} from "@edict/types";
import {getIdAttr} from "@edict/common";

// NOTE: The generic type T is our SCHEMA type. MatchT is the map of bindings

const addNode = <T>(node: AlphaNode<T>, newNode: AlphaNode<T> ): AlphaNode<T> => {
  for(let i = 0; i < node.children.length; i++) {
    if(node.children[i].testField === newNode.testField && node.children[i].testValue === newNode.testValue) {
      return node.children[i]
    }
  }
  node.children.push(newNode)
  return newNode
}

const addNodes = <T>(session: Session<T>, nodes: [ Field, T][] ): AlphaNode<T> => {
  let result = session.alphaNode
  nodes.forEach(([testField, testValue]) => {
    result = addNode(result, {
      testField: testField,
      testValue: testValue,
      successors: [],
      children:[],
      facts: new Map()
    })
  })
  return result
}

function isVar (obj: any): obj is Var {
  return obj.name !== undefined && obj.field !== undefined
}

// To figure out MatchT we need to understand how Vars are treated (so we can understand how MatchT is mapped)
// We should also understand how conditions work in a Rete network

export const addConditionsToProduction = <T,U,MatchT>(production: Production<T,U>, id: Var | T, attr: T, value: Var | T, then: boolean) => {
  const condition: Condition<T> = {shouldTrigger: then, nodes: [], vars: []}
  const fieldTypes = [Field.IDENTIFIER, Field.ATTRIBUTE, Field.VALUE]


  fieldTypes.forEach(fieldType => {
    if(fieldType === Field.IDENTIFIER) {
      if(isVar(id)) {
        const temp = id
        temp.field = fieldType
        condition.vars.push(temp)
      }
      else {
        condition.nodes.push([fieldType, id])
      }
    } else if(fieldType === Field.ATTRIBUTE) {
      condition.nodes.push([fieldType, attr])
    } else if(fieldType === Field.VALUE) {
      if(isVar(value)) {
        const temp = value
        temp.field = fieldType
        condition.vars.push(temp)
      } else {
        condition.nodes.push([fieldType, value])
      }
    }
  })

  production.conditions.push(condition)
}

const isAncestor = <T, MatchT>(x: JoinNode<T >, y: JoinNode<T>): boolean => {
  let node = y
  while(node && node.parent) {
    if(node.parent.parent === x) {
      return true
    }
    else {
      node = node.parent.parent
    }
  }
  return false
}

const addProductionToSession = <T, U>(session: Session<T>,production: Production<T, U>) => {
  const memNodes: MemoryNode<T>[] = []
  const joinNodes: JoinNode<T>[] = []
  const last = production.conditions.length - 1
  const bindings = new Set<string>()
  const joinedBindings = new Set<string>()

  for (let i = 0; i < last; i++) {
    const condition = production.conditions[i]
    const leafAlphaNode = addNodes(session, condition.nodes)
    const parentMemNode = memNodes.length > 0 ? memNodes[memNodes.length - 1]: undefined
    const joinNode: JoinNode<T> = {
      parent: parentMemNode, alphaNode: leafAlphaNode, condition, ruleName: production.name, oldIdAttrs: new Set()}
    condition.vars.forEach(v => {
      if(bindings.has(v.name)) {
        joinedBindings.add(v.name)
        if(v.field === Field.IDENTIFIER) {
          joinNode.idName = v.name
        }
      }
      else {
        bindings.add(v.name)
      }
    })
    if(parentMemNode) {
      parentMemNode.child = joinNode
    }
    leafAlphaNode.successors.push(joinNode)
    leafAlphaNode.successors.sort((x,y) => isAncestor(x,y) ? 1 : -1)
    const memNode: MemoryNode<T> = {
      parent: joinNode,
      type: i === last ? MEMORY_NODE_TYPE.LEAF : MEMORY_NODE_TYPE.PARTIAL,
      condition,
      ruleName: production.name,
      lastMatchId: -1,
    matches: new Map<IdAttrs<T>, Match<T>>(),
    matchIds: new Map<number, IdAttrs<T>>()}
    if(memNode.type === MEMORY_NODE_TYPE.LEAF) {
      memNode.nodeType = {
        condFn : production.condFn
      }
      const pThenFn = production.thenFn
      if(pThenFn) {
        const sess = session
        sess.insideRule = true
        memNode.nodeType.thenFn = (vars ) => pThenFn(sess, production, production.convertMatchFn(vars))
      }
      const pThenFinallyFn = production.thenFinallyFn
      if(pThenFinallyFn) {
        const sess = session
        sess.insideRule = true
        memNode.nodeType.thenFinallyFn = () => pThenFinallyFn(sess, production)
      }

      if(session.leafNodes.has(production.name)) {
        throw new Error(`${production.name} already exists in session`)
      }
      session.leafNodes.set(production.name, memNode)
    }
    memNodes.push(memNode)
    joinNodes.push(joinNode)
    joinNode.child = memNode
  }

  const leafMemNode = memNodes[memNodes.length - 1]
  for(let i = 0; i < memNodes.length; i++) {
    memNodes[i].leafNode = leafMemNode
  }
  for(let i = 0; i < joinNodes.length; i++) {
    const node = joinNodes[i]
    const vars = node.condition.vars
    for(let j = 0; j < vars.length; j++) {
      const v = vars[j]
      if(v.field === Field.VALUE && joinedBindings.has(v.name)) {
        node.disableFastUpdates = true
        break
      }
    }
  }
}

// MatchT represents a mapping from condition key to a value
// So given this condidtion:
//
// $npc: {circle, speed, destX, destY},
//
// We'd need a map
const getVarFromFact = <T>(vars: MatchT<T>, key: string, fact: FactFragment<T>): boolean => {
  if(vars.has(key) && vars.get(key) != fact) {
    return false
  }
  vars.set(key, fact)
  return true
}



const getVarsFromFact = <T>(vars: MatchT<T>, condition: Condition<T>, fact: Fact<T>): boolean => {
  for(let i = 0; i < condition.vars.length; i++) {
    const v = condition.vars[i]
    if(v.field === Field.IDENTIFIER) {
      if(!getVarFromFact(vars, v.name, fact[0])) {
        return false
      }
    }
    else if (v.field === Field.ATTRIBUTE) {
      throw new Error(`Attributes can not contain vars: ${v}`)
    }
    else if (v.field === Field.VALUE) {
      if(!getVarFromFact(vars, v.name, fact[2])) {
        return false
      }
    }
  }
  return true
}

const leftActivationFromVars = <T>(session: Session<T>, node: JoinNode<T>, idAttrs: IdAttrs<T>, vars: MatchT<T>, token: Token<T>, alphaFact: Fact<T>) => {
  const newVars = vars
  if(getVarsFromFact(newVars, node.condition, alphaFact)) {
    const idAttr = getIdAttr<T>(alphaFact)
    const newIdAttrs = idAttrs
    newIdAttrs.push(idAttr)
    const newToken = {fact: alphaFact, kind: token.kind}
    const isNew = !node.oldIdAttrs?.has(idAttr)
    const child = node.child
    if(!child) {
      console.error("Session", JSON.stringify(session))
      console.error(`Node ${node.idName}`, JSON.stringify(node))
      throw new Error("Expected node to have child!")
    }
    leftActivationOnMemoryNode(session, child, newIdAttrs, newVars, newToken, isNew)
  }
}


const leftActivationWithoutAlpha = <T>(session: Session<T>, node: JoinNode<T>, idAttrs: IdAttrs<T>, vars: MatchT<T>, token: Token<T>) => {
  if(node.idName && node.idName != "") {
    const id = vars.get(node.idName)
    if(!id) throw new Error(`Could not find var for node ${node.idName}`)
    if(node.alphaNode.facts.has(id)) {
      const alphaFacts = [...node.alphaNode.facts.get(id)?.values() ?? []]
      if(!alphaFacts) throw new Error(`Expected to have alpha facts for ${node.idName}`)
      alphaFacts.forEach(alphaFact => {
        leftActivationFromVars(session, node, idAttrs, vars, token, alphaFact)
      })
    }
  }
  else {
    const factsForId = [...node.alphaNode.facts.values()]
    factsForId.forEach(facts => {
      const alphas =[...facts.values()]
      alphas.forEach(alphaFact => {
        leftActivationFromVars(session, node, idAttrs, vars, token, alphaFact)
      })
    })
  }
}

const leftActivationOnMemoryNode = <T>(session: Session<T>, node: MemoryNode<T>, idAttrs: IdAttrs<T>, vars: MatchT<T>, token: Token<T>, isNew: boolean) =>{
  const idAttr = idAttrs[idAttrs.length - 1]


  // if the insert/update fact is new and this condition doesn't have then = false, let the leaf node trigger
  if(isNew && (token.kind === TokenKind.INSERT || token.kind === TokenKind.UPDATE) && node.condition.shouldTrigger && node.nodeType) {
    node.nodeType.trigger = true
  }

  if(token.kind === TokenKind.INSERT || token.kind === TokenKind.UPDATE) {
      let match: Match<T>;
      if (node.matches.has(idAttrs)) {
        match = node.matches.get(idAttrs)!
      } else {
        node.lastMatchId += 1
        match = {id: node.lastMatchId}
      }
      match.vars = vars
    match.enabled = node.type !== MEMORY_NODE_TYPE.LEAF || !node.nodeType?.condFn || node.nodeType?.condFn(vars)
    node.matchIds.set(match.id, idAttrs)
    node.matches.set(idAttrs, match)
    if(node.type === MEMORY_NODE_TYPE.LEAF && node.nodeType?.trigger) {
      if(node.nodeType?.thenFn) {
        session.thenQueue.add([node, idAttrs])
      }
      if(node.nodeType.thenFinallyFn) {
        session.thenFinallyQueue.add(node)
      }
    }
    node.parent.oldIdAttrs.add(idAttr)
  }
  else if( token.kind === TokenKind.RETRACT) {
    const idToDelete = node.matches.get(idAttrs)
    if(idToDelete){
      node.matchIds.delete(idToDelete.id)
    }
    node.matches.delete(idAttrs)
    node.parent.oldIdAttrs.delete(idAttr)
    if(node.type === MEMORY_NODE_TYPE.LEAF && node.nodeType) {
      if(node.nodeType.thenFinallyFn) {
        session.thenFinallyQueue.add(node)
      }
    }
  }

  if(node.type !== MEMORY_NODE_TYPE.LEAF && node.child) {
    leftActivationWithoutAlpha(session, node.child, idAttrs, vars, token)
  }
}

// session: var Session[T, MatchT], node: JoinNode[T, MatchT], idAttr: IdAttr, token: Token[T]) =
const rightActivationWithJoinNode = <T>(session: Session<T>, node: JoinNode<T>, idAttr: IdAttr<T>, token: Token<T>) => {
  if(!node.parent) {
    const vars = session.initMatch(node.ruleName)
    if(getVarsFromFact(vars, node.condition, token.fact)) {
      if(!node.child) {
        throw new Error(`Unexpected undefined child for node ${node.idName}`)
      }
      leftActivationOnMemoryNode(session, node.child, [idAttr], vars, token, true)
    }
  } else {

    node.parent.matches.forEach((match, idAttrs) => {
      const vars = match.vars
      const idName = node.idName
      if(idName && idName !== "" &&
        // REALLY NOT SURE ABOUT THIS LINE!!!
        vars?.get(idName) != token.fact[0]) {
          console.debug("match??", vars?.get(idName), token.fact[0])
          return
      }
      if(!vars) {
        throw new Error("Expected vars to not be undefinied???")
      }
      // Deviating from pararules here, he makes a mutable
      // copy, I'm not doing that. I think he's doing a Nim
      // perf thing that may not be possible in Javascript
      if (getVarsFromFact(vars, node.condition, token.fact)) {
        const newIdAttrs = idAttrs
        newIdAttrs.push(idAttr)
        const child = node.child
        if(!child) throw new Error(`Unexpected null child for node: ${node.idName}`)
        leftActivationOnMemoryNode(session, child, newIdAttrs, vars, token, true)
      }
    })
  }
}
// (session: var Session[T, MatchT], node: var AlphaNode[T, MatchT], token: Token[T]) =


const rightActivationWithAlphaNode = <T>(session: Session<T>, node: AlphaNode<T>, token: Token<T>) => {
  const idAttr =  getIdAttr(token.fact)
  const [id, attr] = idAttr
  if(token.kind === TokenKind.INSERT) {
    if(!node.facts.has(id)) {
      node.facts.set(id, new Map<FactFragment<T>, Fact<T>>())
    }
    node.facts.get(id)!.set(attr, token.fact)
    if(!session.idAttrNodes.has(idAttr)) {
      session.idAttrNodes.set(idAttr, new Set())
    }
    session.idAttrNodes.get(idAttr)!.add(node)
  } else if(token.kind === TokenKind.RETRACT) {
    node.facts.get(id)?.delete(attr)
    session.idAttrNodes.get(idAttr)!.delete(node)
    if(session.idAttrNodes.get(idAttr)!.size == 0) {
     session.idAttrNodes.delete(idAttr)
    }
  } else if (token.kind === TokenKind.UPDATE) {
    node.facts.get(id)!.set(attr, token.fact)
  }
  node.successors.forEach(child => {
    if(token.kind === TokenKind.UPDATE && child.disableFastUpdates) {
      rightActivationWithJoinNode(session, child, idAttr, { fact: token.oldFact!, kind: TokenKind.RETRACT})
      rightActivationWithJoinNode(session, child, idAttr, { fact: token.fact, kind: TokenKind.INSERT})
    } else {
      rightActivationWithJoinNode(session, child, idAttr, token)
    }
  })
}

const raiseRecursionLimitException = (limit: number, additionalText?: string) => {
  const msg = `Recursion limit hit. The current limit is ${limit} (set by the recursionLimit param of fireRules).`
  throw new Error(`${msg} ${additionalText}\n Try using the transient_ variants in your schema to prevent triggering rules in an infinite loop.`)
}

const raiseRecursionLimit = <T>(limit: number, executedNodes: ExecutedNodes<T>) => {
 let nodes = {}
  for(let i = executedNodes.length - 1; i >= 0; i--) {
    const currNodes = {}
    const nodeToTriggeredNodes = executedNodes[i]
    nodeToTriggeredNodes.forEach((triggeredNodes,node) => {
      const obj = {}
      triggeredNodes.forEach(triggeredNode => {
        if(triggeredNode.ruleName in nodes) {
         obj[triggeredNode.ruleName] = nodes[triggeredNode.ruleName]
        }
      })
      currNodes[node.ruleName] = obj
    })
    nodes = currNodes
  }

  const findCycles = (cycles: Set<string[]>, k: string, v: object, cyc: string[]) => {
    const newCyc = cyc
    newCyc.push(k)
    const index = cyc.indexOf(k)
    if(index >= 0) {
      cycles.add(newCyc.splice(index, newCyc.length))
    } else {
      Object.keys(v).forEach(key => {
        findCycles(cycles, key, v[key], newCyc)
      })
    }
  }

  const cycles = new Set<string[]>()
  Object.keys(nodes).forEach(key => {
    findCycles(cycles, key, nodes[key], [])
  })
  let text = ""
  cycles.forEach(cycle => {
    text = `${text}\nCycle detected! `
    if(cycle.length == 2) {
      text = `${text}${cycle[0]} is triggering itself`
    } else {
      text = `${text}${cycle.join(" -> ")}`
    }
    raiseRecursionLimitException(limit, text)
  })


}

const DEFAULT_RECURSION_LIMIT = 16
const fireRules = <T>(session: Session<T>, recursionLimit: number = DEFAULT_RECURSION_LIMIT) => {
  if(session.insideRule) {
    return
  }
  // Only for debugging purposes, should we remove for prod usage?
  const executedNodes: ExecutedNodes<T> = []

  let recurCount = 0
  // `raiseRecursionLimit(recursionLimit, executedNodes) will explode
  // noinspection InfiniteLoopJS
  while(true) {
    if(recursionLimit >= 0) {
      if(recurCount == recursionLimit) {
        raiseRecursionLimit(recursionLimit, executedNodes)
      }
      recurCount += 1
    }

    const thenQueue = session.thenQueue
    const thenFinallyQueue = session.thenFinallyQueue
    if(thenQueue.size == 0 && thenFinallyQueue.size == 0) {
      return
    }

    // reset state
    session.thenQueue.clear()
    session.thenFinallyQueue.clear()
    thenQueue.forEach( ([node, idAttrs]) => {
      if(node.nodeType) {
        node.nodeType!.trigger = false
      }
    })
    thenFinallyQueue.forEach(node => {
      if(node.nodeType) {
        node.nodeType!.trigger = false
      }
    })

    const nodeToTriggeredNodeIds = new Map<MemoryNode<T>, Set<MemoryNode<T>>>()
    const add = (t: Map<MemoryNode<T>, Set<MemoryNode<T>>>, nodeId: MemoryNode<T>, s:Set<MemoryNode<T>>) => {
      if(nodeId !in t) {
        t[nodeId] = new Set<MemoryNode<T>>()
      }
      t[nodeId]!.add(s)
    }

    //  keep a copy of the matches before executing the :then functions.
    //  if we pull the matches from inside the for loop below,
    //  it'll produce non-deterministic results because `matches`
    //  could be modified by the for loop itself. see test: "non-deterministic behavior"

    const nodeToMatches: Map<MemoryNode<T>, Map<IdAttrs<T>, Match<T>>> = new Map()

    thenQueue.forEach( ([node, _]) => {
     if(!nodeToMatches.has(node)) {
       nodeToMatches.set(node, node.matches)
     }
    })

    // Execute `then` blocks
    thenQueue.forEach(([node, idAttrs]) => {
      const matches = nodeToMatches.get(node)
      if(matches.has(idAttrs)) {
        const match = matches.get(idAttrs)
        if(match.enabled) {
          session.triggeredNodeIds.clear()
          if(!match.vars) {
            throw new Error(`expected match ${match.id} to have vars??`)
          }
          node.nodeType?.thenFn?.(match.vars)
          add(nodeToTriggeredNodeIds, node, session.triggeredNodeIds)
        }
      }
    })

    // Execute `thenFinally` blocks
    thenFinallyQueue.forEach(node => {
      session.triggeredNodeIds.clear()
      node.nodeType?.thenFinallyFn?.()
      add(nodeToTriggeredNodeIds, node, session.triggeredNodeIds)
    })

    executedNodes.push(nodeToTriggeredNodeIds)
  }
}

const getAlphaNodesForFact = <T>(session: Session<T>, node: AlphaNode<T>, fact: Fact<T>, root: boolean, nodes: Set<AlphaNode<T>>) => {
  if(root) {
    node.children.forEach(child =>  {
      getAlphaNodesForFact(session, child, fact, false, nodes)
    })
  }
  else {
    const val = node.testField === Field.IDENTIFIER ? fact[0] : node.testField === Field.ATTRIBUTE ? fact[1] : node.testField === Field.VALUE ? fact[2] : throw new Error("Wat?")
    if(val != node.testValue) {
      return
    }
    nodes.add(node)
    node.children.forEach(child => {
      getAlphaNodesForFact(session, child, fact, false, nodes)
    })
  }
}

const upsertFact = <T>(session: Session<T>, fact: Fact<T>, nodes: Set<AlphaNode<T>>) => {
 const idAttr = getIdAttr<T>(fact)
 if(!session.idAttrNodes.has(idAttr)) {
   nodes.forEach(n => {
     rightActivationWithAlphaNode(session, n, {fact, kind: TokenKind.INSERT})
   })
 }
 else {
   const existingNodes = session.idAttrNodes.get(idAttr)

   // retract any facts from nodes that the new fact wasn't inserted in
   // we use toSeq here to make a copy of the existingNodes, because
   // rightActivation will modify it
   existingNodes.forEach(n => {
     if(!nodes.has(n)) {
       const oldFact = n.facts.get(fact[0]).get(fact[1])
       rightActivationWithAlphaNode(session, n, {fact: oldFact, kind: TokenKind.RETRACT})
     }
   })

    // update or insert facts, depending on whether the node already exists
   nodes.forEach(n => {
     if(existingNodes.has(n)) {
       let oldFact = n.facts.get(fact[0]).get(fact[1])
       rightActivationWithAlphaNode(session, n, {fact, kind: TokenKind.UPDATE, oldFact})
     }
     else {
       rightActivationWithAlphaNode(session, n, {fact, kind: TokenKind.INSERT})
     }
   })
 }
}

export const insertFact = <T>(session: Session<T>, fact: Fact<T>) => {
  const nodes = new Set<AlphaNode<T>>()
  getAlphaNodesForFact(session, session.alphaNode, fact, true, nodes)
  upsertFact(session, fact, nodes)
  if(session.autoFire) {
    fireRules(session)
  }
}

export const retractFact = <T>(session: Session<T>, fact: Fact<T>) => {
  const idAttr = getIdAttr(fact)
  // Make a copy of idAttrNodes[idAttr], since rightActivationWithAlphaNode will modify it
  const idAttrNodes = new Set(session.idAttrNodes.get(idAttr))
  idAttrNodes.forEach(node => {

    if(fact !== node.facts.get(idAttr[0]).get(idAttr[1])) {
      throw new Error(`Expected fact ${fact} to be in node.facts at id: ${idAttr[0]}, attr: ${idAttr[1]}`)
    }

    rightActivationWithAlphaNode(session, node, {fact, kind: TokenKind.RETRACT})
  })
}

const refractFactByIdAndAttr = <T>(session:Session<T>, id: string, attr: keyof T) => {
  const idAttr = [id, attr]

  // TODO: this function is really simliar to the retractFact function, can we make things
  // DRYer?
  // Make a copy of idAttrNodes[idAttr], since rightActivationWithAlphaNode will modify it
  const idAttrNodes = new Set(session.idAttrNodes.get(idAttr))
  idAttrNodes.forEach(node => {
    const fact = node.facts.get(idAttr[0]).get(idAttr[1])
    rightActivationWithAlphaNode(session, node, {fact, kind: TokenKind.RETRACT})
  })
}

const defaultInitMatch = <T>() => {
  return new Map<string, FactFragment<T>>()
}

const initSession = <T>(autoFire: boolean = true) => {
  const alphaNode: AlphaNode<T> = {
    facts: new Map<FactFragment<T>, Map<FactFragment<T>, Fact<T>>>(),
    successors: [],
    children: []
  }

  const leafNodes = new Map<string, MemoryNode<T>>()

  const idAttrNodes = new Map<IdAttr<T>, Set<AlphaNode<T>>>()

  const thenQueue = new Set<[MemoryNode<T>, IdAttrs<T>]>()

  const thenFinallyQueue = new Set<MemoryNode<T>>()

  const triggeredNodeIds = new Set<MemoryNode<T>>()

  const initMatch = defaultInitMatch()

  return {
    alphaNode,
    leafNodes,
    idAttrNodes,
    thenQueue,
    thenFinallyQueue,
    triggeredNodeIds,
    initMatch
  }
}

export const initProduction = <T, U>(name: string, convertMatchFn: ConvertMatchFn<MatchT<T>, U>, condFn: CondFn<T>, thenFn: ThenFn<T, U>, thenFinallyFn: ThenFinallyFn<T, U>): Production<T, U> => {
  return {
    name,
    convertMatchFn,
    condFn,
    thenFn,
    thenFinallyFn,
    conditions: []
  }
}

const matchParams = <I,T>(vars: MatchT<T>, params: [I, [string, T]]): boolean => {

}
