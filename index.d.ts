export interface AutoBindOptions {
  /** Only bind these methods */
  include?: (string | symbol)[];
  /** Don't bind these methods */
  exclude?: (string | symbol)[];
  /** Only bind methods matching this regex */
  pattern?: RegExp;
  /** Use lazy binding (bind on first access via getter) */
  lazy?: boolean;
}

/**
 * Automatically bind all methods of an object to itself.
 *
 * @param self - The class instance (usually `this`)
 * @param options - Configuration options
 * @returns The instance (for chaining)
 *
 * @example
 * ```ts
 * class MyClass {
 *   constructor() {
 *     autoBind(this);
 *   }
 *   myMethod() {
 *     return this;
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Shorthand: bind specific methods
 * autoBind(this, 'method1', 'method2');
 * ```
 */
declare function autoBind<T extends object>(self: T, options?: AutoBindOptions): T;
declare function autoBind<T extends object>(self: T, ...methods: string[]): T;

/**
 * React-aware autoBind. Automatically excludes React lifecycle methods.
 *
 * @param self - The React component instance
 * @param options - Same options as autoBind
 * @returns The instance
 */
export declare function autoBindReact<T extends object>(self: T, options?: AutoBindOptions): T;

/**
 * Class decorator that auto-binds all methods on instantiation.
 *
 * @example
 * ```ts
 * @boundClass
 * class MyClass {
 *   handleClick() { ... }
 * }
 * ```
 */
export declare function boundClass<T extends new (...args: any[]) => any>(target: T): T;

/**
 * Method decorator that lazily binds the method to the instance.
 *
 * @example
 * ```ts
 * class MyClass {
 *   @bound
 *   handleClick() { ... }
 * }
 * ```
 */
export declare function bound(
  target: object,
  key: string | symbol,
  descriptor: PropertyDescriptor
): PropertyDescriptor;

export default autoBind;
export { autoBind };
