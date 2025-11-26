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

class Observed<T = never> {
  private value: T | undefined;
  private listeners: ((arg: T) => void)[] = [];

  constructor(value?: T) {
    this.value = value;
  }

  get() {
    return this.value
  }

  set(value: T) {
    this.value = value;
    this.notifyListeners(this.value)
  }

  addListener(callback: (arg: T) => void) {
    this.listeners.push(callback)
  }

  private notifyListeners(element: T) {
    this.listeners.forEach((listener) => listener(element))
  }
}

export { Cache, Observed };
