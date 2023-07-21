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
      meta?: any
    }
  | {
      rule: string
      trigger: AuditRuleTrigger
      state: AuditRuleTriggerState
      meta?: any
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
    let delta
    if ('action' in record) {
      const insertColor = `[32m`
      const retractionColor = `[31m`
      if (record.action === AuditAction.UPDATE) {
        delta = `\x1b[32m+[${record.fact}], \x1b[31m-[${record.oldFact}]`
      } else {
        const symbol =
          record.action === AuditAction.INSERTION ? `\x1b[32m+` : '\x1b[31m-'
        delta = `${symbol}[${record.fact}]`
      }
      const action =
        record.action === AuditAction.INSERTION
          ? 'Insert'
          : record.action === AuditAction.RETRACTION
          ? 'Retract'
          : 'Update'
      return `${delta}`
    } else {
      const state =
        record.state === AuditRuleTriggerState.ENTER ? 'Entered' : 'Exited'
      const trigger =
        record.trigger === AuditRuleTrigger.THEN ? 'then()' : 'thenFinally()'
      return `${record.rule} ${state} ${trigger}`
    }
  }

  const log = (record: AuditRecord) => {
    if (mode === AuditorMode.STREAM) {
      const entry = createLogEntry(record)
      if ('action' in record) {
        console.log(entry)
      } else {
        if (record.state === AuditRuleTriggerState.ENTER) {
          console.group(entry)
        } else {
          console.groupEnd()
        }
      }
    } else buffer.push(record)
  }

  const flush = () => {
    if (buffer.length === 0) return
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
