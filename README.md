# auto-bind-js

> Automatically bind class methods to their instance. Zero dependencies.

A modern, feature-rich alternative to [`auto-bind`](https://www.npmjs.com/package/auto-bind) with extra capabilities: **lazy binding**, **regex pattern matching**, **decorators**, **Symbol-keyed methods**, and full **TypeScript** support.

## Install

```bash
npm install auto-bind-js
```

## Usage

### Basic

```js
import autoBind from 'auto-bind-js';

class Unicorn {
  constructor(name) {
    this.name = name;
    autoBind(this);
  }

  message() {
    return `${this.name} is awesome!`;
  }
}

const unicorn = new Unicorn('Rainbow');
const { message } = unicorn;
message(); //=> 'Rainbow is awesome!'
```

### Bind specific methods (shorthand)

```js
autoBind(this, 'handleClick', 'handleSubmit');
```

### Options

```js
// Only bind these methods
autoBind(this, { include: ['handleClick', 'handleSubmit'] });

// Bind all except these
autoBind(this, { exclude: ['render', 'toString'] });

// Bind only methods matching a pattern
autoBind(this, { pattern: /^handle/ });

// Lazy binding — binds on first access (better perf for large classes)
autoBind(this, { lazy: true });
```

### React

Excludes all React lifecycle methods automatically:

```js
import autoBindReact from 'auto-bind-js/react';

class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    autoBindReact(this);
  }

  handleClick() {
    // `this` is always the component instance
  }

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}
```

### Decorators

```js
import { boundClass, bound } from 'auto-bind-js/decorator';

// Class decorator — binds ALL methods
@boundClass
class Foo {
  constructor() {
    this.name = 'foo';
  }

  handleClick() {
    return this.name; // always bound
  }
}

// Method decorator — bind individual methods
class Bar {
  constructor() {
    this.name = 'bar';
  }

  @bound
  handleClick() {
    return this.name; // always bound
  }
}
```

## API

### `autoBind(self, options?)`

Bind methods of `self` to the instance. Returns `self`.

#### Options

| Option    | Type              | Description                                  |
| --------- | ----------------- | -------------------------------------------- |
| `include` | `(string\|symbol)[]` | Only bind these methods                       |
| `exclude` | `(string\|symbol)[]` | Skip these methods                            |
| `pattern` | `RegExp`          | Only bind methods whose names match this regex |
| `lazy`    | `boolean`         | Bind on first access instead of immediately   |

### `autoBindReact(self, options?)`

Same as `autoBind` but automatically excludes React lifecycle methods (`render`, `componentDidMount`, `shouldComponentUpdate`, etc.)

### `boundClass(target)`

Class decorator. Auto-binds all methods when the class is instantiated.

### `bound(target, key, descriptor)`

Method decorator. Lazily binds the decorated method to the instance on first access.

## Features

- ✅ Zero dependencies
- ✅ Binds inherited methods
- ✅ Supports Symbol-keyed methods
- ✅ Include/exclude filters
- ✅ Regex pattern matching
- ✅ Lazy binding mode
- ✅ React lifecycle awareness
- ✅ Class & method decorators
- ✅ Full TypeScript declarations
- ✅ ESM + CommonJS dual package
- ✅ Lightweight (~2KB)

## License

MIT
