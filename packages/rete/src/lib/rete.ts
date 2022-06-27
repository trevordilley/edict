// Example implementation documentation:
// paper used by o'doyle rules: http://reports-archive.adm.cs.cmu.edu/anon/1995/CMU-CS-95-113.pdf

import {AlphaNode, Condition, Field, JoinNode, MemoryNode, Production, Session, Var} from "./types";

export function rete(): string {
  return 'rete';
}

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
}
