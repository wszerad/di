var Lifetime = /* @__PURE__ */ ((Lifetime2) => {
  Lifetime2["SCOPED"] = "SCOPED";
  Lifetime2["TRANSIENT"] = "TRANSIENT";
  Lifetime2["SINGLETON"] = "SINGLETON";
  return Lifetime2;
})(Lifetime || {});

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

class Registration {
  constructor(register, lifetime) {
    this.token = register.token;
    this.lifetime = register.lifetime || lifetime;
    this.provider = this.extract(register) || register.provider;
  }
  get value() {
    if (this.lifetime === Lifetime.SINGLETON) {
      if (this._value !== void 0) {
        return this._value;
      }
      return this._value = this.get();
    }
    return this.get();
  }
}

class ClassRegistration extends Registration {
  extract(register) {
    return register.useClass;
  }
  get() {
    return new this.provider();
  }
}

class FactoryRegistration extends Registration {
  extract(register) {
    return register.useFactory;
  }
  get() {
    return this.provider();
  }
}

class ValueRegistration extends Registration {
  extract(register) {
    return register.useValue;
  }
  get() {
    return this.provider;
  }
}

class Register {
  constructor(registrations = [], isolated = false) {
    const records = [];
    const entries = registrations.reduce((acc, item) => {
      if (item instanceof Register) {
        acc.push(...item.records.entries());
        return acc;
      }
      const t = this.getRegistration(item);
      acc.push([t.token, t]);
      return acc;
    }, records).map((record) => {
      if (isolated && record[1].lifetime === Lifetime.SINGLETON) {
        const Constructor = record[1].constructor;
        return [record[0], new Constructor(record[1])];
      }
      return record;
    });
    this.records = new Map(entries);
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
  constructor(registrations = [], isolated = false) {
    this.locked = false;
    this.register = new Register(
      registrations.map((item) => {
        if (item instanceof Module) {
          return item.providers;
        }
        return item;
      }),
      isolated
    );
    this.scope = isolated ? new Scope(this) : null;
  }
  lock() {
    this.locked = true;
  }
  get providers() {
    this.lock();
    return this.register;
  }
  resolve(token, scope = new Scope(this)) {
    this.lock();
    return scope.inject(token);
  }
  injectable(lifetime = Lifetime.SCOPED) {
    return (constructor, _) => {
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
    ]);
  }
  async dispose() {
    await this.scope?.dispose();
  }
}
const globalModule = new Module();
const extendModule = globalModule.extend.bind(globalModule);
const injectable = globalModule.injectable.bind(globalModule);
const provide = globalModule.provide.bind(globalModule);
const resolve = globalModule.resolve.bind(globalModule);

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
    const value = runner();
    reset();
    return value;
  }
  onDispose(cb) {
    this.disposables.add(cb);
  }
  inject(token) {
    const registration = this.module.providers.get(token);
    if (registration.lifetime === Lifetime.TRANSIENT) {
      return this.runInScope(() => registration.value);
    }
    if (registration.lifetime === Lifetime.SCOPED) {
      if (this.cache.has(token)) {
        return this.cache.get(token);
      }
      const value = this.runInScope(() => registration.value);
      this.cache.set(token, value);
      return value;
    }
    const scope = this.module.scope || globalScope;
    return scope.runInScope(() => registration.value);
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
const globalScope = new Scope(globalModule);

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

export { CircularInjectionError, DiError, FrozenScopeError, Lifetime, Module, Scope, TokenNameError, TokenOverwriteError, UnknownTokenError, dispose, extendModule, globalModule, globalScope, inject, injectable, onDispose, provide, resolve, token };
