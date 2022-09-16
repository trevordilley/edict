function pad (hash: string, len: number) {
  while (hash.length < len) {
    hash = '0' + hash;
  }
  return hash;
}

function fold (hash: any, text: string) {
  let i;
  let chr;
  let len;
  if (text.length === 0) {
    return hash;
  }
  for (i = 0, len = text.length; i < len; i++) {
    chr = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash < 0 ? hash * -2 : hash;
}

function foldObject (hash: any, o: object, seen: any): any {
  return Object.keys(o).sort().reduce(foldKey, hash);
  function foldKey (hash: any, key: string) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return foldValue(hash, o[key], key, seen);
  }
}

function foldValue (input:number, value: object, key: string, seen: object[]) {
  const hash = fold(fold(fold(input, key), toString(value)), typeof value);
  if (value === null) {
    return fold(hash, 'null');
  }
  if (value === undefined) {
    return fold(hash, 'undefined');
  }
  if (typeof value === 'object' || typeof value === 'function') {
    if (seen.indexOf(value) !== -1) {
      return fold(hash, '[Circular]' + key);
    }
    seen.push(value);

    const objHash = foldObject(hash, value, seen)

    if (!('valueOf' in value) || typeof value.valueOf !== 'function') {
      return objHash;
    }

    try {
      return fold(objHash, String(value.valueOf()))
    } catch (err: any) {
      return fold(objHash, '[valueOf exception]' + (err.stack || err.message))
    }
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return fold(hash, value.toString());
}

function toString (o: object) {
  return Object.prototype.toString.call(o);
}




export function sum (o: any) {
  const b = performance.now()
  const r = pad(foldValue(0, o, '', []).toString(16), 8);
  const a = performance.now()
  const diff = a - b
  if (diff > 0.1) {
    console.log("sum ", a - b, "ms for ", o)

  }
  return r
}
