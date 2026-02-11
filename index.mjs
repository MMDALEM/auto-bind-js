/**
 * auto-bind-js
 * Automatically bind class methods to their instance.
 *
 * Features:
 * - Bind all own and inherited prototype methods
 * - Include/exclude specific methods
 * - Regex pattern matching for method names
 * - Lazy binding (bind on first access via getter)
 * - React-aware variant (skips lifecycle methods)
 * - Class & method decorator support
 * - Full TypeScript support
 * - Zero dependencies
 */

const BUILTIN_OBJECT_METHODS = new Set([
  'constructor',
  'toString',
  'toLocaleString',
  'valueOf',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

/**
 * Get all method names from the prototype chain (excluding Object.prototype)
 */
function getAllMethodNames(obj) {
  const methods = new Set();
  let proto = Object.getPrototypeOf(obj);

  while (proto && proto !== Object.prototype) {
    const keys = Object.getOwnPropertyNames(proto);
    for (const key of keys) {
      if (key === 'constructor') continue;
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      if (descriptor && typeof descriptor.value === 'function') {
        methods.add(key);
      }
    }

    // Also handle Symbol-keyed methods
    const symbols = Object.getOwnPropertySymbols(proto);
    for (const sym of symbols) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, sym);
      if (descriptor && typeof descriptor.value === 'function') {
        methods.add(sym);
      }
    }

    proto = Object.getPrototypeOf(proto);
  }

  return methods;
}

/**
 * Filter methods based on options
 */
function filterMethods(methods, options = {}) {
  let filtered = [...methods];

  // Remove built-in object methods
  filtered = filtered.filter((m) => typeof m === 'symbol' || !BUILTIN_OBJECT_METHODS.has(m));

  // Include only specific methods
  if (options.include) {
    const includeSet = new Set(options.include);
    filtered = filtered.filter((m) => includeSet.has(m));
  }

  // Exclude specific methods
  if (options.exclude) {
    const excludeSet = new Set(options.exclude);
    filtered = filtered.filter((m) => !excludeSet.has(m));
  }

  // Match pattern
  if (options.pattern) {
    filtered = filtered.filter(
      (m) => typeof m === 'string' && options.pattern.test(m)
    );
  }

  return filtered;
}

/**
 * Bind methods eagerly (standard mode)
 */
function bindEager(self, methods) {
  for (const method of methods) {
    const val = self[method];
    if (typeof val === 'function') {
      Object.defineProperty(self, method, {
        value: val.bind(self),
        writable: true,
        configurable: true,
        enumerable: false,
      });
    }
  }
}

/**
 * Bind methods lazily (bind on first access)
 */
function bindLazy(self, methods) {
  for (const method of methods) {
    const proto = Object.getPrototypeOf(self);
    const descriptor = Object.getOwnPropertyDescriptor(proto, method) ||
      findDescriptorInChain(self, method);

    if (!descriptor || typeof descriptor.value !== 'function') continue;

    const originalFn = descriptor.value;

    Object.defineProperty(self, method, {
      configurable: true,
      enumerable: false,
      get() {
        const boundFn = originalFn.bind(self);
        // Replace getter with the bound value on first access
        Object.defineProperty(self, method, {
          value: boundFn,
          writable: true,
          configurable: true,
          enumerable: false,
        });
        return boundFn;
      },
    });
  }
}

function findDescriptorInChain(obj, key) {
  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    const desc = Object.getOwnPropertyDescriptor(proto, key);
    if (desc) return desc;
    proto = Object.getPrototypeOf(proto);
  }
  return undefined;
}

/**
 * Main autoBind function
 *
 * @param {object} self - The class instance (usually `this`)
 * @param {object} [options] - Configuration options
 * @param {string[]} [options.include] - Only bind these methods
 * @param {string[]} [options.exclude] - Don't bind these methods
 * @param {RegExp} [options.pattern] - Only bind methods matching this regex
 * @param {boolean} [options.lazy] - Use lazy binding (bind on first access)
 * @returns {object} The instance (for chaining)
 */
function autoBind(self, options) {
  // Support autoBind(this, 'method1', 'method2') shorthand
  if (typeof options === 'string') {
    const methodNames = [options, ...Array.from(arguments).slice(2)];
    options = { include: methodNames };
  }

  const allMethods = getAllMethodNames(self);
  const methods = filterMethods(allMethods, options);

  if (options && options.lazy) {
    bindLazy(self, methods);
  } else {
    bindEager(self, methods);
  }

  return self;
}

// ─── React-aware variant ────────────────────────────────────────────────────

const REACT_LIFECYCLE_METHODS = new Set([
  'render',
  'componentDidMount',
  'componentDidUpdate',
  'componentWillUnmount',
  'shouldComponentUpdate',
  'getSnapshotBeforeUpdate',
  'getDerivedStateFromProps',
  'getDerivedStateFromError',
  'componentDidCatch',
  'UNSAFE_componentWillMount',
  'UNSAFE_componentWillReceiveProps',
  'UNSAFE_componentWillUpdate',
  'getDefaultProps',
  'getInitialState',
  'componentWillMount',
  'componentWillReceiveProps',
  'componentWillUpdate',
]);

/**
 * React-aware autoBind. Skips React lifecycle methods.
 *
 * @param {object} self - The component instance
 * @param {object} [options] - Same options as autoBind (exclude is merged)
 * @returns {object} The instance
 */
function autoBindReact(self, options = {}) {
  const exclude = [
    ...(options.exclude || []),
    ...REACT_LIFECYCLE_METHODS,
  ];
  return autoBind(self, { ...options, exclude });
}

// ─── Decorator ──────────────────────────────────────────────────────────────

/**
 * Class decorator: @boundClass
 * Method decorator: @bound
 *
 * Usage:
 *   @boundClass
 *   class Foo { ... }
 *
 *   class Foo {
 *     @bound
 *     handleClick() { ... }
 *   }
 */
function boundClass(target) {
  const original = target;

  const wrapped = function (...args) {
    const instance = new original(...args);
    autoBind(instance);
    return instance;
  };

  wrapped.prototype = original.prototype;
  Object.defineProperty(wrapped, 'name', { value: original.name });
  Object.setPrototypeOf(wrapped, original);

  // Copy static properties
  for (const key of Object.getOwnPropertyNames(original)) {
    if (['length', 'name', 'prototype', 'arguments', 'caller'].includes(key)) continue;
    const desc = Object.getOwnPropertyDescriptor(original, key);
    if (desc) Object.defineProperty(wrapped, key, desc);
  }

  return wrapped;
}

/**
 * Method decorator
 */
function bound(target, key, descriptor) {
  if (!descriptor || typeof descriptor.value !== 'function') {
    throw new TypeError('@bound can only be applied to methods');
  }

  const fn = descriptor.value;

  return {
    configurable: true,
    enumerable: false,
    get() {
      // Only define on the instance, not the prototype
      if (this === target) {
        return fn;
      }

      const boundFn = fn.bind(this);
      Object.defineProperty(this, key, {
        value: boundFn,
        writable: true,
        configurable: true,
        enumerable: false,
      });
      return boundFn;
    },
  };
}

export default autoBind;
export { autoBind, autoBindReact, boundClass, bound };
