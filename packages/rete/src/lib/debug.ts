import {AlphaNode, JoinNode, MemoryNode, Session} from "@edict/rete";
// @ts-ignore
import {NodeModel, RootGraphModel, attribute as a, digraph, toDot} from "ts-graphviz";

const alphaId = <SCHEMA>(node: AlphaNode<SCHEMA>) => `${node.testField}: ${node.testValue}`

let id = 0

const addMemoryNde = <SCHEMA>(node: MemoryNode<SCHEMA>, graph: RootGraphModel, source?: NodeModel) => {
  const gNode = graph.node(`${id++}`, graph)
  if(source) graph.edge(source, gNode)

  if(node.child) {
    addJoinNode(node.child, graph, node)
  }
}

const addJoinNode = <SCHEMA>(node: JoinNode<SCHEMA>, graph: RootGraphModel, source?: NodeModel) => {
  const gNode = graph.node(`${id++}`, {
    [a.color]: "pink"
  })

  if(source) graph.edge(source, gNode)

  if(node.child) {
    addMemoryNde(node.child, graph, node)
  }
}


const addAlphaNode = <SCHEMA>(node: AlphaNode<SCHEMA>, graph: RootGraphModel, source?:NodeModel ) => {
  const gNode = graph.node(`${id++}`, {
    [a.color]: "blue"
  })

  if(source) graph.edge(source, gNode)

  node.children.forEach(s => {
    addAlphaNode(s, graph, node)
  })

  node.successors.forEach(s => {
    addJoinNode(s, graph, node)
  })
}



const graphNetwork = <SCHEMA>(node: AlphaNode<SCHEMA>, graph: RootGraphModel) => {
  addAlphaNode(node, graph)
  if(node.children.length === 0) return
  else {
    node.children.forEach(n => graphNetwork(n, graph))
  }
  return graph
}

export const viz = <SCHEMA>(session: Session<SCHEMA>) => {
  const root = session.alphaNode
  const G = digraph('Network', (g: RootGraphModel) => {
    graphNetwork(root, g)
  })

  return toDot(G)
}
