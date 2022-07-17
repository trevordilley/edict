// Example implementation documentation:
// paper used by o'doyle rules: http://reports-archive.adm.cs.cmu.edu/anon/1995/CMU-CS-95-113.pdf

// Porting from docs/pararules/engine.nim
// Aiming to keep naming and syntax as close as possible to that source
// material initially to minimize defects where possiible until I have a
// real good handle on what's going  on!

import {
  AlphaNode,
  Condition,
  Field,
  JoinNode,
  Match,
  MEMORY_NODE_TYPE,
  MemoryNode,
  Production,
  Session,
  Var,
  Token, Fact
} from "./types";
import { IdAttrs} from "@edict/types";
import {getIdAttr} from "@edict/common";

// NOTE: The generic type T is our SCHEMA type. MatchT is the map of bindings

const addNode = <T, MatchT>(node: AlphaNode<T, MatchT>, newNode: AlphaNode<T, MatchT> ): AlphaNode<T, MatchT> => {
  for(let i = 0; i < node.children.length; i++) {
    if(node.children[i].testField === newNode.testField && node.children[i].testValue === newNode.testValue) {
      return node.children[i]
    }
  }
  node.children.push(newNode)
  return newNode
}

const addNodes = <T, MatchT>(session: Session<T, MatchT>, nodes: [ Field, T][] ): AlphaNode<T, MatchT> => {
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

export const addConditionsToProduction = <T,U,MatchT>(production: Production<T,U,MatchT>, id: Var | T, attr: T, value: Var | T, then: boolean) => {
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

const isAncestor = <T, MatchT>(x: JoinNode<T, MatchT >, y: JoinNode<T, MatchT>): boolean => {
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

const addProductionToSession = <T, U, MatchT>(session: Session<T,MatchT>,production: Production<T, U, MatchT>) => {
  const memNodes: MemoryNode<T, MatchT>[] = []
  const joinNodes: JoinNode<T, MatchT>[] = []
  const last = production.conditions.length - 1
  const bindings = new Set<string>()
  const joinedBindings = new Set<string>()

  for (let i = 0; i < last; i++) {
    const condition = production.conditions[i]
    const leafAlphaNode = addNodes(session, condition.nodes)
    const parentMemNode = memNodes.length > 0 ? memNodes[memNodes.length - 1]: undefined
    const joinNode: JoinNode<T, MatchT> = {
      parent: parentMemNode, alphaNode: leafAlphaNode, condition, ruleName: production.name}
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
    const memNode: MemoryNode<T, MatchT> = {
      parent: joinNode,
      type: i === last ? MEMORY_NODE_TYPE.LEAF : MEMORY_NODE_TYPE.PARTIAL,
      condition,
      ruleName: production.name,
      lastMatchId: -1,
    matches: new Map<IdAttrs<T>, Match<MatchT>>(),
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
const getVarFromFact = <MatchT, T>(vars: MatchT, key: string, fact: T): boolean => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if(vars[key] && vars[key] != fact) {
    return false
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  vars[key] = fact
  return true
}



const getVarsFromFact = <MatchT, T>(vars: MatchT, condition: Condition<T>, fact: Fact<T>): boolean => {
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

const leftActivationWithoutAlpha = <T, MatchT>(session: Session<T, MatchT>, node: JoinNode<T, MatchT>, idAttrs: IdAttrs<T>, vars: MatchT, token: Token<T>) => {
  if(node.idName != "") {
    let id = vars[node.idName]
  }
}

const leftActivationOnMemoryNode = <T, MatchT>(session: Session<T, MatchT>, node: MemoryNode<T, MatchT>, idAttrs: IdAttrs<T>, vars: MatchT, token: Token<T>, isNew: boolean) =>{

}

const leftActivationFromVars = <T, MatchT>(session: Session<T, MatchT>, node: JoinNode<T, MatchT>, idAttrs: IdAttrs<T>, vars: MatchT, token: Token<T>, alphaFact: Fact<T>) => {
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

const leftActivateOnJoinNode = <T, MatchT>(session: Session<T, MatchT>, node: JoinNode<T, MatchT>, idAttrs: IdAttrs<T>, vars: MatchT, token: Token<T>, alphaFact: Fact<T>) => {

}