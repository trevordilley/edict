import {
  Auditor as A,
  AuditorMode as AM,
  consoleAuditor as cA,
} from '@edict/rete'

export type Auditor = A
export type AuditorMode = AM
export const consoleAuditor = cA
