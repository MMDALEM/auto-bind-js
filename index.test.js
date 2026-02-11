const autoBind = require('../src/index.cjs');
const { autoBindReact, boundClass, bound } = require('../src/index.cjs');

// ─── Basic binding ──────────────────────────────────────────────────────────

describe('autoBind', () => {
  test('binds methods to the instance', () => {
    class Foo {
      constructor() {
        this.name = 'foo';
        autoBind(this);
      }
      getName() {
        return this.name;
      }
    }
    const foo = new Foo();
    const { getName } = foo;
    expect(getName()).toBe('foo');
  });

  test('returns the instance for chaining', () => {
    class Foo {
      constructor() {
        const result = autoBind(this);
        expect(result).toBe(this);
      }
      method() {}
    }
    new Foo();
  });

  test('does not bind constructor', () => {
    class Foo {
      constructor() {
        autoBind(this);
      }
      method() {}
    }
    const foo = new Foo();
    // constructor should not be bound as an own property
    expect(Object.getOwnPropertyDescriptor(foo, 'constructor')).toBeUndefined();
  });

  test('binds inherited methods', () => {
    class Base {
      constructor() {
        this.name = 'base';
      }
      baseName() {
        return this.name;
      }
    }
    class Child extends Base {
      constructor() {
        super();
        this.name = 'child';
        autoBind(this);
      }
      childName() {
        return this.name;
      }
    }
    const child = new Child();
    const { baseName, childName } = child;
    expect(baseName()).toBe('child');
    expect(childName()).toBe('child');
  });

  test('handles Symbol-keyed methods', () => {
    const sym = Symbol('myMethod');
    class Foo {
      constructor() {
        this.value = 42;
        autoBind(this);
      }
      [sym]() {
        return this.value;
      }
    }
    const foo = new Foo();
    const method = foo[sym];
    expect(method()).toBe(42);
  });
});

// ─── Options ────────────────────────────────────────────────────────────────

describe('autoBind options', () => {
  test('include: only binds specified methods', () => {
    class Foo {
      constructor() {
        this.name = 'foo';
        autoBind(this, { include: ['a'] });
      }
      a() { return this.name; }
      b() { return this.name; }
    }
    const foo = new Foo();
    const { a, b } = foo;
    expect(a()).toBe('foo');
    expect(() => b()).toThrow();
  });

  test('exclude: skips specified methods', () => {
    class Foo {
      constructor() {
        this.name = 'foo';
        autoBind(this, { exclude: ['b'] });
      }
      a() { return this.name; }
      b() { return this.name; }
    }
    const foo = new Foo();
    const { a, b } = foo;
    expect(a()).toBe('foo');
    expect(() => b()).toThrow();
  });

  test('pattern: only binds methods matching regex', () => {
    class Foo {
      constructor() {
        this.name = 'foo';
        autoBind(this, { pattern: /^handle/ });
      }
      handleClick() { return this.name; }
      handleSubmit() { return this.name; }
      otherMethod() { return this.name; }
    }
    const foo = new Foo();
    const { handleClick, handleSubmit, otherMethod } = foo;
    expect(handleClick()).toBe('foo');
    expect(handleSubmit()).toBe('foo');
    expect(() => otherMethod()).toThrow();
  });

  test('shorthand: autoBind(this, "method1", "method2")', () => {
    class Foo {
      constructor() {
        this.name = 'foo';
        autoBind(this, 'a', 'b');
      }
      a() { return this.name; }
      b() { return this.name; }
      c() { return this.name; }
    }
    const foo = new Foo();
    const { a, b, c } = foo;
    expect(a()).toBe('foo');
    expect(b()).toBe('foo');
    expect(() => c()).toThrow();
  });
});

// ─── Lazy binding ───────────────────────────────────────────────────────────

describe('lazy binding', () => {
  test('binds method on first access', () => {
    class Foo {
      constructor() {
        this.name = 'foo';
        autoBind(this, { lazy: true });
      }
      getName() {
        return this.name;
      }
    }
    const foo = new Foo();
    const { getName } = foo;
    expect(getName()).toBe('foo');
  });

  test('caches the bound method after first access', () => {
    class Foo {
      constructor() {
        this.name = 'foo';
        autoBind(this, { lazy: true });
      }
      getName() {
        return this.name;
      }
    }
    const foo = new Foo();
    const first = foo.getName;
    const second = foo.getName;
    expect(first).toBe(second);
  });
});

// ─── autoBindReact ──────────────────────────────────────────────────────────

describe('autoBindReact', () => {
  test('skips React lifecycle methods', () => {
    class FakeComponent {
      constructor() {
        this.name = 'comp';
        autoBindReact(this);
      }
      render() { return this.name; }
      componentDidMount() { return this.name; }
      handleClick() { return this.name; }
    }
    const comp = new FakeComponent();
    const { handleClick } = comp;
    expect(handleClick()).toBe('comp');

    // render and componentDidMount should NOT be bound to the instance
    const ownKeys = Object.getOwnPropertyNames(comp);
    expect(ownKeys).not.toContain('render');
    expect(ownKeys).not.toContain('componentDidMount');
    expect(ownKeys).toContain('handleClick');
  });
});

// ─── Decorators ─────────────────────────────────────────────────────────────

describe('boundClass decorator', () => {
  test('auto-binds all methods on instantiation', () => {
    class Foo {
      constructor() {
        this.name = 'foo';
      }
      getName() {
        return this.name;
      }
    }
    const BoundFoo = boundClass(Foo);
    const foo = new BoundFoo();
    const { getName } = foo;
    expect(getName()).toBe('foo');
  });

  test('preserves class name', () => {
    class MyClass {
      method() {}
    }
    const BoundClass = boundClass(MyClass);
    expect(BoundClass.name).toBe('MyClass');
  });

  test('instanceof still works', () => {
    class Foo {
      method() {}
    }
    const BoundFoo = boundClass(Foo);
    const foo = new BoundFoo();
    expect(foo instanceof Foo).toBe(true);
  });
});

describe('bound method decorator', () => {
  test('lazily binds individual method', () => {
    class Foo {
      constructor() {
        this.name = 'foo';
      }
      getName() {
        return this.name;
      }
    }

    // Simulate decorator application
    const descriptor = Object.getOwnPropertyDescriptor(Foo.prototype, 'getName');
    const newDescriptor = bound(Foo.prototype, 'getName', descriptor);
    Object.defineProperty(Foo.prototype, 'getName', newDescriptor);

    const foo = new Foo();
    const { getName } = foo;
    expect(getName()).toBe('foo');
  });

  test('caches the bound function', () => {
    class Foo {
      constructor() { this.name = 'foo'; }
      getName() { return this.name; }
    }

    const descriptor = Object.getOwnPropertyDescriptor(Foo.prototype, 'getName');
    const newDescriptor = bound(Foo.prototype, 'getName', descriptor);
    Object.defineProperty(Foo.prototype, 'getName', newDescriptor);

    const foo = new Foo();
    expect(foo.getName).toBe(foo.getName);
  });
});

// ─── Edge cases ─────────────────────────────────────────────────────────────

describe('edge cases', () => {
  test('does not bind getters/setters', () => {
    class Foo {
      constructor() {
        this._val = 10;
        autoBind(this);
      }
      get val() { return this._val; }
      set val(v) { this._val = v; }
      method() { return this._val; }
    }
    const foo = new Foo();
    expect(foo.val).toBe(10);
    foo.val = 20;
    expect(foo.val).toBe(20);
  });

  test('does not bind non-function properties', () => {
    class Foo {
      constructor() {
        this.data = 123;
        autoBind(this);
      }
      method() { return this.data; }
    }
    const foo = new Foo();
    expect(foo.data).toBe(123);
  });

  test('works with empty class', () => {
    class Empty {
      constructor() {
        autoBind(this);
      }
    }
    expect(() => new Empty()).not.toThrow();
  });

  test('works with deeply nested inheritance', () => {
    class A {
      constructor() { this.val = 'a'; }
      getA() { return this.val; }
    }
    class B extends A {
      getB() { return this.val; }
    }
    class C extends B {
      constructor() {
        super();
        this.val = 'c';
        autoBind(this);
      }
      getC() { return this.val; }
    }
    const c = new C();
    const { getA, getB, getC } = c;
    expect(getA()).toBe('c');
    expect(getB()).toBe('c');
    expect(getC()).toBe('c');
  });

  test('bound methods are writable', () => {
    class Foo {
      constructor() {
        autoBind(this);
      }
      method() { return 'original'; }
    }
    const foo = new Foo();
    foo.method = () => 'replaced';
    expect(foo.method()).toBe('replaced');
  });
});
