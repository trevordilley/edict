import {
  AlphaNode,
  Condition,
  Field,
  JoinNode,
  MEMORY_NODE_TYPE,
  MemoryNode,
  Session,
} from './types'
import { hashIdAttr } from './utils'
import { bindingsToMatch } from './bindingsToMatch/bindingsToMatch'

const FIELD_TO_STR = ['ID', 'ATTR', 'VAL']

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

const conditionToString = <SCHEMA>(condition: Condition<SCHEMA>) => {
  const nodeStr = condition.nodes
    .map((n) => `[${FIELD_TO_STR[n[0]]} ${n[1]}]`)
    .join('\n')

  const varStr = condition.vars
    .map((v) => `${FIELD_TO_STR[v.field]}: ${v.name}`)
    .join('\n')

  return `-- nodes --\n ${nodeStr}\n\n -- vars -- \n ${varStr}`
}

const memoryNode = <SCHEMA>(node: MemoryNode<SCHEMA>): Node => {
  const fillColor =
    node.type === MEMORY_NODE_TYPE.LEAF ? ',fillcolor=green,style=filled' : ''
  const matchStrs: string[] = []
  node.matches.forEach((v, k) => {
    const idAttrStr = v.idAttrs
      .map(([id, attr]) => `[${id}, ${attr}] - ${hashIdAttr([id, attr])}`)
      .join('\n')
    const enabled = v.match.enabled
    const varStr: string[] = []
    const vars = bindingsToMatch(v.match.bindings)
    vars?.forEach((vv, kk) => {
      varStr.push(`${kk} => ${vv}`)
    })
    const matchStr = `\n\nmatch ${v.match.id} is ${
      enabled ? 'enabled' : 'disabled'
    } \n\n idAttrs: ${idAttrStr}\n hash: ${k} \n\n -- vars -- \n\n ${varStr.join(
      '\n'
    )}`
    matchStrs.push(matchStr)
  })
  const label = `MEMORY ${node.id}\n\nrule: ${
    node.ruleName
  }\n\n ** CONDITIONS ** \\n${conditionToString(
    node.condition
  )}\n\n** MATCHES ** \n${matchStrs}\n\n`
  return {
    id: node.id,
    attributes: `[shape=rect, color=green${fillColor}, label="${label}"]`,
  }
}

const alphaNode = <SCHEMA>(node: AlphaNode<SCHEMA>): Node => {
  const testVal = node.testField
    ? `${FIELD_TO_STR[node.testField]} ${node.testValue}`
    : node.testValue
    ? `${FIELD_TO_STR[Field.IDENTIFIER]} ${node.testValue}`
    : 'dummy root'
  const factStrs: string[] = []

  const fieldKind = new Set<string>()

  node.facts.forEach((v, k) => {
    v.forEach((vv, kk) => {
      if (node.testField === Field.IDENTIFIER) {
        fieldKind.add(vv[0].toString())
      } else if (node.testField === Field.ATTRIBUTE) {
        fieldKind.add(vv[1].toString())
      } else if (node.testField === Field.VALUE) {
        fieldKind.add(vv[2].toString())
      }
      factStrs.push(`${vv}`)
    })
  })

  const label = `ALPHA ${node.id}\n\n ${testVal} \n${factStrs.join('\n')}`
  return {
    id: node.id,
    attributes: `[color=blue, label="${label}"]`,
  }
}

const joinNode = <SCHEMA>(node: JoinNode<SCHEMA>): Node => {
  const cond = conditionToString(node.condition)
  const idName = node.idName ?? ''
  const label = `${node.ruleName}\n${idName}\n\n**CONDITIONS**\n\n${cond}`

  return {
    id: node.id,
    attributes: `[color=red, label="JOIN ${node.id}\n\n${label}"]`,
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
  node.children.forEach((c) => {
    addAlphaNode(c, graph, gNode)
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

export const vizOnlineUrl = <SCHEMA>(
  session: Session<SCHEMA>,
  openInBrowser?: boolean
) => {
  const datums = viz(session)
  const encoded = encodeURIComponent(datums)
  const url = `https://dreampuf.github.io/GraphvizOnline/#${encoded}`
  if (openInBrowser) open(url)
  return url
}
