class Ring<T = never> {
  private idx: number = 0;
  private elements: T[];
  private listeners: ((arg: T) => void)[] = [];

  constructor(elements: T[]) {
    this.elements = elements;
  }

  next(): T {
    this.idx = ++this.idx % this.elements.length
    const element = this.elements[this.idx]
    this.notifyListeners(element)
    return element
  }

  prev(): T {
    this.idx--;
    if (this.idx < 0) this.idx += this.elements.length
    const element = this.elements[this.idx % this.elements.length];
    this.notifyListeners(element)
    return element
  }

  get(): T {
    return this.elements[this.idx]
  }

  reset(): void;
  reset(elements: T[]): void;
  reset(elements?: T[]) {
    if (elements) this.elements = elements
    this.idx = 0;
  }

  addListener(callback: (arg: T) => void) {
    this.listeners.push(callback)
  }

  private notifyListeners(element: T) {
    this.listeners.forEach((listener) => listener(element))
  }
}

type CacheValue<T = never> = { value: T } & { cachedAt: Date }

class Cache<T = never> {
  private key: string;
  protected value: CacheValue<T> | null;
  private valid: (value: CacheValue<T>) => boolean;

  constructor(key: string, valid: (value: CacheValue<T>) => boolean) {
    this.key = key;
    this.valid = valid;

    try {
      const ls = localStorage.getItem(this.key);
      if (!ls) {
        this.value = null
      } else {
        this.value = JSON.parse(ls, dateReviver)
      }
    } catch (error) {
      throw new Error("Error while parsing cached values", { cause: error })
    }
  }

  set(value: T) {
    localStorage.setItem(this.key, JSON.stringify({ value, cachedAt: new Date() }))
  }

  get(): CacheValue<T> | null {
    return this.value;
  }

  isValid(): this is ValuedCache<T> {
    return !!this.value && this.valid(this.value)
  }
}

class ValuedCache<T = never> extends Cache<T> {
  get(): CacheValue<T> {
    return this.value!
  }
}

// Source: https://cwestblog.com/2022/02/07/json-parse-reviver-for-dates/
function dateReviver(_key: string, value: unknown) {
  if ('string' === typeof value && /^\d{4}-[01]\d-[0-3]\dT[012]\d(?::[0-6]\d){2}\.\d{3}Z$/.test(value)) {
    const date = new Date(value);
    if (+date === +date) {
      return date;
    }
  }
  return value;
}

export { Ring, Cache };
