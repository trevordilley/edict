import { ExecutedNodes } from '@edict/rete'

export const raiseRecursionLimit = <T>(
  limit: number,
  executedNodes: ExecutedNodes<T>
) => {
  let nodes = {}
  for (let i = executedNodes.length - 1; i >= 0; i--) {
    const currNodes = {}
    const nodeToTriggeredNodes = executedNodes[i]
    for (const n of nodeToTriggeredNodes) {
      const node = n[0]
      const triggeredNodes = n[1]

      const obj = {}
      for (const triggeredNode of triggeredNodes) {
        if (triggeredNode.ruleName in nodes) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          obj[triggeredNode.ruleName] = nodes[triggeredNode.ruleName]
        }
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      currNodes[node.ruleName] = obj
    }
    nodes = currNodes
  }
}
