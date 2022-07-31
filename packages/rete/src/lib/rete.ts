// Example implementation documentation:
// paper used by o'doyle rules: http://reports-archive.adm.cs.cmu.edu/anon/1995/CMU-CS-95-113.pdf

// Porting from docs/pararules/engine.nim
// Aiming to keep naming and syntax as close as possible to that source
// material initially to minimize defects where possiible until I have a
// real good handle on what's going  on!

import {
  AlphaNode,
  Condition,
  Fact,
  FactFragment,
  Field,
  JoinNode,
  Match,
  MatchT,
  MEMORY_NODE_TYPE,
  MemoryNode,
  Production,
  Session,
  Token,
  TOKEN_KIND,
  Var
} from "./types";
import {IdAttrs} from "@edict/types";
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
  if(isNew && (token.kind === TOKEN_KIND.INSERT || token.kind === TOKEN_KIND.UPDATE) && node.condition.shouldTrigger && node.nodeType) {
    node.nodeType.trigger = true
  }

  if(token.kind === TOKEN_KIND.INSERT || token.kind === TOKEN_KIND.UPDATE) {
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
  else if( token.kind === TOKEN_KIND.RETRACT) {
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


