import { Session } from '@edict/rete'
import { hashIdAttr } from '../utils'

export const contains = <T>(
  session: Session<T>,
  id: string,
  attr: keyof T
): boolean => session.idAttrNodes.has(hashIdAttr([id, attr]))
