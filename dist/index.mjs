let currentScope;
function getCurrScope() {
  return currentScope;
}
function setCurrScope(scope) {
  const prevScope = currentScope;
  currentScope = scope;
  return () => currentScope = prevScope;
}
class Scope {
  constructor(module) {
    this.module = module;
    this.cache = /* @__PURE__ */ new Map();
    this.disposables = /* @__PURE__ */ new Set();
  }
  runInScope(runner) {
    const reset = setCurrScope(this);
    runner?.();
    reset();
    return this;
  }
  getValue(registration) {
    const token = registration.token;
    let value;
    this.runInScope(() => {
      if (this.cache.has(token)) {
        value = this.cache.get(token);
        return;
      }
      value = registration.get();
      this.cache.set(token, value);
    });
    return value;
  }
  onDispose(cb) {
    this.disposables.add(cb);
  }
  inject(token) {
    return this.module.resolve(token, this);
  }
  async dispose() {
    this.cache.clear();
    const dispose = Promise.all(
      Array.from(this.disposables.values()).map((disposable) => disposable())
    );
    this.disposables.clear();
    await dispose;
  }
}

const isProduction = import.meta?.env?.MODE === "production";
function isFunction(input) {
  return typeof input === "function";
}
function isConstructor(input) {
  return isFunction(input) && input.prototype && !Object.getOwnPropertyDescriptor(input, "prototype")?.writable;
}
function isRawFactory(input) {
  return isFunction(input) && !isConstructor(input);
}
function isRawClass(input) {
  return isFunction(input) && isConstructor(input);
}
function isValueProvider(input) {
  return input.hasOwnProperty("useValue");
}
function isClassProvider(input) {
  return input.hasOwnProperty("useClass");
}
function isFactoryProvider(input) {
  return input.hasOwnProperty("useFactory");
}
function getTokenName(token) {
  switch (typeof token) {
    case "string":
      return token;
    case "symbol":
      return token.toString();
    case "function":
      return token.name;
    default:
      return "unnamed";
  }
}

class DiError extends Error {
}
class CircularInjectionError extends DiError {
  constructor(tokens) {
    super("Circular dependency injection: " + tokens.map(getTokenName).join(" -> "));
  }
}
class TokenOverwriteError extends DiError {
  constructor(name) {
    super(`Token with name: ${name} is already registered`);
  }
}
class FrozenScopeError extends DiError {
  constructor() {
    super("Module is frozen by child-scope or usage. No additional registration can be made");
  }
}
class TokenNameError extends DiError {
  constructor() {
    super("Token name cannot be empty");
  }
}
class UnknownTokenError extends DiError {
  constructor(token) {
    super(`Unknown token: ${getTokenName(token)}`);
  }
}

var Lifetime = /* @__PURE__ */ ((Lifetime2) => {
  Lifetime2["SCOPED"] = "SCOPED";
  Lifetime2["TRANSIENT"] = "TRANSIENT";
  Lifetime2["SINGLETON"] = "SINGLETON";
  return Lifetime2;
})(Lifetime || {});

class ClassRegistration {
  constructor(register, lifetime) {
    this.register = register;
    this.token = register.token;
    this.lifetime = register.lifetime || lifetime;
  }
  get() {
    return new this.register.useClass();
  }
}

class FactoryRegistration {
  constructor(register, lifetime) {
    this.register = register;
    this.token = register.token;
    this.lifetime = register.lifetime || lifetime;
  }
  get() {
    return this.register.useFactory();
  }
}

class ValueRegistration {
  constructor(register, lifetime) {
    this.register = register;
    this.token = register.token;
    this.lifetime = register.lifetime || lifetime;
  }
  get() {
    return this.register.useValue;
  }
}

class Register {
  constructor(registrations = []) {
    const records = [];
    registrations.forEach((item) => {
      if (item instanceof Register) {
        records.push(...item.records.entries());
        return;
      }
      const t = this.getRegistration(item);
      records.push([t.token, t]);
    });
    this.records = new Map(records);
  }
  getRegistration(provider, lifetime = Lifetime.SCOPED) {
    if (isRawFactory(provider)) {
      return new FactoryRegistration({
        token: provider,
        useFactory: provider
      }, lifetime);
    }
    if (isRawClass(provider)) {
      return new ClassRegistration({
        token: provider,
        useClass: provider
      }, lifetime);
    }
    if (isValueProvider(provider)) {
      return new ValueRegistration(provider, lifetime);
    }
    if (isFactoryProvider(provider)) {
      return new FactoryRegistration(provider, lifetime);
    }
    if (isClassProvider(provider)) {
      return new ClassRegistration(provider, lifetime);
    }
    throw new UnknownTokenError(provider);
  }
  get(token) {
    const registration = this.records.get(token);
    if (!registration) {
      throw new UnknownTokenError(token);
    }
    return registration;
  }
  set(provider, lifetime) {
    const registration = this.getRegistration(provider, lifetime);
    if (!registration.token) {
      throw new TokenNameError();
    }
    if (this.records.has(registration.token)) {
      throw new TokenOverwriteError(getTokenName(registration.token));
    }
    this.records.set(registration.token, registration);
    return this;
  }
}

class Module {
  constructor(registrations = [], rootScope) {
    this.locked = false;
    this.rootScope = rootScope || new Scope(this);
    this.register = new Register(
      registrations.map((item) => {
        if (item instanceof Module) {
          return item.providers();
        }
        return item;
      })
    );
  }
  lock() {
    this.locked = true;
  }
  providers() {
    this.lock();
    return this.register;
  }
  resolve(token, scope = new Scope(this)) {
    const registration = this.register.get(token);
    this.lock();
    if (registration.lifetime === Lifetime.TRANSIENT) {
      return registration.get();
    }
    if (registration.lifetime === Lifetime.SCOPED) {
      return scope.getValue(registration);
    }
    return this.rootScope.getValue(registration);
  }
  async reset() {
    const disposedScope = this.rootScope;
    this.rootScope = new Scope(this);
    await disposedScope.dispose();
  }
  createScope() {
    return new Scope(this);
  }
  injectable(lifetime = Lifetime.SCOPED) {
    return (constructor) => {
      if (this.locked) {
        throw new FrozenScopeError();
      }
      this.register.set(constructor, lifetime);
    };
  }
  provide(provider, lifetime = Lifetime.SCOPED) {
    if (this.locked) {
      throw new FrozenScopeError();
    }
    this.register.set(provider, lifetime);
    return this;
  }
  extend(registrations = []) {
    return new Module([
      this,
      ...registrations
    ], this.rootScope);
  }
}
const globalModule = new Module();
const resetModule = globalModule.reset.bind(globalModule);
const extendModule = globalModule.extend.bind(globalModule);
const injectable = globalModule.injectable.bind(globalModule);
const provide = globalModule.provide.bind(globalModule);
const resolve = globalModule.resolve.bind(globalModule);

const levels = [];
let deep = 0;
function loopDetection(token2, action) {
  const localeDeep = deep++;
  if (levels.includes(token2)) {
    throw new CircularInjectionError([...levels, token2]);
  }
  levels[localeDeep] = token2;
  const result = action();
  levels.splice(localeDeep, levels.length - localeDeep);
  return result;
}
function currScopeResolve(token2) {
  const currScope = getCurrScope();
  if (!currScope) {
    const scope = new Scope(globalModule);
    const reset = setCurrScope(scope);
    const value = scope.inject(token2);
    reset();
    return value;
  }
  return currScope.inject(token2);
}
function inject(token2) {
  if (!isProduction) {
    return loopDetection(token2, () => currScopeResolve(token2));
  }
  return currScopeResolve(token2);
}
function onDispose(cb) {
  getCurrScope().onDispose(cb);
}
function dispose(target, _) {
  onDispose(() => target.call(this));
  return target;
}
function token(_, key) {
  if (key) {
    return Symbol.for(key);
  }
  return Symbol();
}

export { CircularInjectionError, DiError, FrozenScopeError, Lifetime, Module, Scope, TokenNameError, TokenOverwriteError, UnknownTokenError, dispose, extendModule, globalModule, inject, injectable, onDispose, provide, resetModule, resolve, token };
