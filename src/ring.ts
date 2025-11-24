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

export default Ring;
