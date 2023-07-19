export enum AuditAction {
  INSERTION,
  RETRACTION,
}

export enum AuditRuleTrigger {
  THEN,
  THEN_FINALLY,
}
export type AuditRecord = {
  action: AuditAction
  fact: [string, string, any]
  rule?: string
  trigger?: AuditRuleTrigger
  timestamp: number
}
interface Auditor {
  // Hook to send a record somewhere
  emit: () => void

  // Hook to dump the entire buffer of records and reset it
  flush: () => void

  // Retrieve the current state of the buffer
  currentBuffer: () => AuditRecord[]

  // Track a record
  log: (record: AuditRecord) => void

  // Dump the records without triggering flush logic
  reset?: () => void
}
