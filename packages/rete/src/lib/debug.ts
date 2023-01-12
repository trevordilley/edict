import {
  AlphaNode,
  Condition,
  JoinNode,
  MEMORY_NODE_TYPE,
  MemoryNode,
  Session,
} from './types'

const FIELD_TO_STR = ['Identifier', 'Attribute', 'Value']

interface Node {
  id: number
  attributes?: string
}

interface Edge {
  sources: Node[]
  sink: Node
  attributes?: string
}

interface NetworkGraph {
  title: string
  nodes: Map<number, Node>
  edges: Edge[]
}

const conditionToString = <SCHEMA>(condition: Condition<SCHEMA>) =>
  condition.vars.map((v) => `${FIELD_TO_STR[v.field]} ${v.name}`).join('\n')

const memoryNode = <SCHEMA>(node: MemoryNode<SCHEMA>): Node => {
  const fillColor =
    node.type === MEMORY_NODE_TYPE.LEAF ? ',fillcolor=green,style=filled' : ''

  const label = `${node.ruleName}\n${conditionToString(node.condition)}`
  return {
    id: node.id,
    attributes: `[color=green${fillColor}, label="${label}"]`,
  }
}

const alphaNode = <SCHEMA>(node: AlphaNode<SCHEMA>): Node => {
  const field = node.testField ? `${FIELD_TO_STR[node.testField]}` : ''
  const label = `${field}\n`
  return {
    id: node.id,
    attributes: `[color=blue, label="${label}"]`,
  }
}

const joinNode = <SCHEMA>(node: JoinNode<SCHEMA>): Node => {
  const cond = conditionToString(node.condition)
  const idName = node.idName ?? ''
  const disableFastUpdates = node.disableFastUpdates ?? false

  const label = `${node.ruleName}\n${idName}\n${cond}\nDisable Fast Updates? ${disableFastUpdates}`

  return {
    id: node.id,
    attributes: `[color=red, label="${label}"]`,
  }
}
const addMemoryNode = <SCHEMA>(
  node: MemoryNode<SCHEMA>,
  graph: NetworkGraph,
  source?: Node
) => {
  const gNode = memoryNode(node)
  graph.nodes.set(gNode.id, gNode)
  if (source) graph.edges.push({ sources: [source], sink: gNode })
  if (node.child) {
    addJoinNode(node.child, graph, gNode)
  }
}

const addJoinNode = <SCHEMA>(
  node: JoinNode<SCHEMA>,
  graph: NetworkGraph,
  source?: Node
) => {
  const gNode = joinNode(node)
  graph.nodes.set(gNode.id, gNode)
  if (source) graph.edges.push({ sources: [source], sink: gNode })
  const alpha = alphaNode(node.alphaNode)
  graph.nodes.set(alpha.id, alpha)
  graph.edges.push({ sources: [alpha], sink: gNode })
  if (node.child) {
    addMemoryNode(node.child, graph, gNode)
  }
}

const addAlphaNode = <SCHEMA>(
  node: AlphaNode<SCHEMA>,
  graph: NetworkGraph,
  source?: Node
) => {
  const gNode = alphaNode(node)
  graph.nodes.set(node.id, gNode)
  if (source) graph.edges.push({ sources: [source], sink: gNode })

  node.children.forEach((s) => {
    addAlphaNode(s, graph, gNode)
  })

  node.successors.forEach((s) => {
    addJoinNode(s, graph, gNode)
  })
}

const graphNetwork = <SCHEMA>(node: AlphaNode<SCHEMA>, graph: NetworkGraph) => {
  addAlphaNode(node, graph)
  return graph
}

const toDot = (graph: NetworkGraph) => {
  const lines: string[] = []
  lines.push(`digraph ${graph.title} {`)
  graph.nodes.forEach((n) => {
    lines.push(`${n.id} ${n.attributes ?? ''}`)
  })

  const edges = new Set<string>()
  graph.edges.forEach((e) => {
    e.sources.forEach((src) => {
      edges.add(`${src.id} -> ${e.sink.id} ${e.attributes ?? ''}`)
    })
  })
  edges.forEach((e) => lines.push(e))

  lines.push('}')
  return lines.join('\n')
}

export const viz = <SCHEMA>(session: Session<SCHEMA>) => {
  const root = session.alphaNode
  const graph: NetworkGraph = {
    title: 'Network',
    nodes: new Map(),
    edges: [],
  }
  graphNetwork(root, graph)

  return toDot(graph)
}
