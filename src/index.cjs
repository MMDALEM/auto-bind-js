/**
 * auto-bind-js (CommonJS)
 */

'use strict';

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

function filterMethods(methods, options = {}) {
  let filtered = [...methods];

  filtered = filtered.filter((m) => typeof m === 'symbol' || !BUILTIN_OBJECT_METHODS.has(m));

  if (options.include) {
    const includeSet = new Set(options.include);
    filtered = filtered.filter((m) => includeSet.has(m));
  }

  if (options.exclude) {
    const excludeSet = new Set(options.exclude);
    filtered = filtered.filter((m) => !excludeSet.has(m));
  }

  if (options.pattern) {
    filtered = filtered.filter(
      (m) => typeof m === 'string' && options.pattern.test(m)
    );
  }

  return filtered;
}

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

function findDescriptorInChain(obj, key) {
  let proto = Object.getPrototypeOf(obj);
  while (proto && proto !== Object.prototype) {
    const desc = Object.getOwnPropertyDescriptor(proto, key);
    if (desc) return desc;
    proto = Object.getPrototypeOf(proto);
  }
  return undefined;
}

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

function autoBind(self, options) {
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

// React
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

function autoBindReact(self, options = {}) {
  const exclude = [
    ...(options.exclude || []),
    ...REACT_LIFECYCLE_METHODS,
  ];
  return autoBind(self, { ...options, exclude });
}

// Decorators
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

  for (const key of Object.getOwnPropertyNames(original)) {
    if (['length', 'name', 'prototype', 'arguments', 'caller'].includes(key)) continue;
    const desc = Object.getOwnPropertyDescriptor(original, key);
    if (desc) Object.defineProperty(wrapped, key, desc);
  }

  return wrapped;
}

function bound(target, key, descriptor) {
  if (!descriptor || typeof descriptor.value !== 'function') {
    throw new TypeError('@bound can only be applied to methods');
  }

  const fn = descriptor.value;

  return {
    configurable: true,
    enumerable: false,
    get() {
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

module.exports = autoBind;
module.exports.default = autoBind;
module.exports.autoBind = autoBind;
module.exports.autoBindReact = autoBindReact;
module.exports.boundClass = boundClass;
module.exports.bound = bound;
