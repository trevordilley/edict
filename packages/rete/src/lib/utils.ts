import { Var } from '@edict/rete'

export const hashIdAttrs = <T>(
  idAttrs: (string | number | Var | symbol)[][]
): number => {
  let hash = 0,
    i,
    j,
    k,
    chr
  for (i = 0; i < idAttrs.length; i++) {
    for (j = 0; j < idAttrs[i].length; j++) {
      const s = idAttrs[i][j].toString()
      for (k = 0; k < s.length; k++) {
        chr = s.charCodeAt(k)
        hash = (hash << 5) - hash + chr
        hash |= 0 // Convert to 32bit integer
      }
    }
  }
  return hash
}

export const hashIdAttr = <T>(
  idAttr: (string | number | Var | symbol)[]
): number => {
  let hash = 0,
    i,
    j,
    chr
  for (i = 0; i < idAttr.length; i++) {
    const k = idAttr[i].toString()
    for (j = 0; j < k.length; j++) {
      chr = k.charCodeAt(j)
      hash = (hash << 5) - hash + chr
      hash |= 0 // Convert to 32bit integer
    }
  }

  return hash
}
