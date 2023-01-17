export type CowTablePayload<K, V> = {
  counter: number
  data: Map<K, V>
}

export class CowTable<K, V> {
  private p: CowTablePayload<K, V>

  constructor() {
    this.p = {
      counter: 0,
      data: new Map<K, V>(),
    }
  }

  public static copy<K, V>(a: CowTable<K, V>, b: CowTable<K, V>) {
    b.p.counter++
    a.p = b.p
  }

  public static destroy<K, V>(x: CowTable<K, V>) {
    if (x.p && x.p.counter === 0) {
      x.p = {
        counter: 0,
        data: new Map<K, V>(),
      }
    } else if (x.p) {
      x.p.counter--
    }
  }

  public deepCopy(): CowTable<K, V> {
    const result = new CowTable<K, V>()
    result.p.data = new Map(this.p.data)
    return result
  }

  public has(key: K): boolean {
    return this.p.data.has(key)
  }

  public get(key: K): V | undefined {
    return this.p.data.get(key)
  }

  public set(key: K, val: V) {
    if (this.p.counter > 0) {
      this.p = this.deepCopy().p
    }
    this.p.data.set(key, val)
  }

  public delete(key: K) {
    if (this.p.counter > 0) {
      this.p = this.deepCopy().p
    }
    this.p.data.delete(key)
  }

  public *pairs(): IterableIterator<[K, V]> {
    for (const x of this.p.data) {
      yield x
    }
  }

  public *values(): IterableIterator<V> {
    for (const x of this.p.data.values()) {
      yield x
    }
  }
}
