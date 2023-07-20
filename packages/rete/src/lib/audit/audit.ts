export enum AuditAction {
  INSERTION,
  UPDATE,
  RETRACTION,
}

export enum AuditRuleTrigger {
  THEN,
  THEN_FINALLY,
}

export enum AuditRuleTriggerState {
  ENTER,
  EXIT,
}

export type AuditRecord =
  | {
      action: AuditAction
      // Fix this type lol
      fact: [any, any, any]
      oldFact?: [any, any, any]
    }
  | {
      rule: string
      trigger: AuditRuleTrigger
      state: AuditRuleTriggerState
    }

export enum AuditorMode {
  STREAM,
  BATCH,
}
export interface Auditor {
  // Hook to dump the entire buffer of records and reset it
  flush: () => void

  // Retrieve the current state of the buffer
  currentBuffer: () => Readonly<AuditRecord[]>

  log: (record: AuditRecord) => void

  // Dump the records without triggering flush logic
  reset?: () => void
}

export const consoleAuditor = (
  mode: AuditorMode = AuditorMode.STREAM
): Auditor => {
  const buffer: AuditRecord[] = []

  const createLogEntry = (record: AuditRecord): string => {
    if ('action' in record) {
      const actionSymbol =
        record.action === AuditAction.INSERTION
          ? '+'
          : record.action === AuditAction.RETRACTION
          ? '-'
          : '<=='
      return `${record.fact.join(',')} ${actionSymbol} ${
        record.oldFact?.join(',') ?? ''
      }`
    } else {
      const state =
        record.state === AuditRuleTriggerState.ENTER ? 'Entered' : 'Exited'
      const trigger =
        record.trigger === AuditRuleTrigger.THEN ? 'then()' : 'thenFinally()'
      return `${record.rule} ${state} ${trigger}`
    }
  }

  const log = (record: AuditRecord) => {
    if (mode === AuditorMode.STREAM) console.log(createLogEntry(record))
    else buffer.push(record)
  }

  const flush = () => {
    console.log(buffer.map((r) => createLogEntry(r)).join('\n'))
    buffer.length = 0
  }

  const currentBuffer = () => buffer

  const reset = () => (buffer.length = 0)

  return {
    log,
    currentBuffer,
    reset,
    flush,
  }
}
