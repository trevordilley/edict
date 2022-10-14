import {AlphaNode, JoinNode, MemoryNode, Session} from "@edict/rete";


interface Node {
  id: number,
  attributes?: string
}

interface Edge {
  sources: Node[]
  sink: Node
  attributes?: string
}

interface NetworkGraph {
  title: string,
  nodes: Map<number, Node>
  edges: Edge[]
}


const memoryNode = <SCHEMA>(node: MemoryNode<SCHEMA>): Node => ({
  id: node.id,
  attributes: `[color=green]`
})

const alphaNode = <SCHEMA>(node: AlphaNode<SCHEMA>):Node => ({
  id: node.id,
  attributes: `[color=blue]`
})

const joinNode = <SCHEMA>(node: JoinNode<SCHEMA>):Node => ({
  id: node.id,
  attributes: `[color=red]`
})
const addMemoryNde = <SCHEMA>(node: MemoryNode<SCHEMA>, graph: NetworkGraph, source?: Node) => {
  const gNode = memoryNode(node)
  graph.nodes.set(gNode.id, gNode)
  if(source) graph.edges.push({sources: [source], sink: gNode})


  if(node.child) {
    addJoinNode(node.child, graph, gNode)
  }
}

const addJoinNode = <SCHEMA>(node: JoinNode<SCHEMA>, graph: NetworkGraph, source?: Node) => {
  const gNode = joinNode(node)
  graph.nodes.set(gNode.id, gNode)
  if(source) graph.edges.push({sources: [source], sink: gNode})
  const alpha = alphaNode(node.alphaNode)
  graph.nodes.set(alpha.id, alpha)
  graph.edges.push({sources: [alpha], sink: gNode})
  if(node.child) {
    addMemoryNde(node.child, graph, gNode)
  }
}


const addAlphaNode = <SCHEMA>(node: AlphaNode<SCHEMA>, graph: NetworkGraph, source?:Node ) => {
  const gNode = alphaNode(node)
  graph.nodes.set(node.id, gNode)
  if(source) graph.edges.push({sources: [source], sink: gNode})

  node.children.forEach(s => {
    addAlphaNode(s, graph, gNode)
  })

  node.successors.forEach(s => {
    addJoinNode(s, graph, gNode)
  })
}



const graphNetwork = <SCHEMA>(node: AlphaNode<SCHEMA>, graph: NetworkGraph) => {
  addAlphaNode(node, graph)
  // if(node.children.length === 0) return
  // else {
  //   node.children.forEach(n => graphNetwork(n, graph))
  // }
  return graph
}

const toDot = (graph: NetworkGraph) => {
  const lines: string[] = []
  lines.push(`digraph ${graph.title} {`)
  graph.nodes.forEach(n => {
    lines.push(`${n.id} ${n.attributes ?? ""}`)
  })
  graph.edges.forEach(e => {
    e.sources.forEach(src => {
      lines.push(`${src.id} -> ${e.sink.id} ${e.attributes ?? ""}`)
    })
  })
  lines.push("}")
  return lines.join("\n")
}

export const viz = <SCHEMA>(session: Session<SCHEMA>) => {
  const root = session.alphaNode
  const graph: NetworkGraph = {
    title: "Network",
    nodes: new Map(),
    edges: []
  }
  graphNetwork(root, graph)

  return toDot(graph)
}
