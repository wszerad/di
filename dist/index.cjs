'use strict';

var Lifetime = /* @__PURE__ */ ((Lifetime2) => {
  Lifetime2["SCOPED"] = "SCOPED";
  Lifetime2["TRANSIENT"] = "TRANSIENT";
  Lifetime2["SINGLETON"] = "SINGLETON";
  return Lifetime2;
})(Lifetime || {});

let currentScope;
function getCurrScope() {
  return currentScope;
}
function setCurrScope(scope) {
  const prevContext = currentScope;
  currentScope = scope;
  return () => currentScope = prevContext;
}
class Scope {
  constructor(module) {
    this.module = module;
    this.cache = /* @__PURE__ */ new Map();
    this.disposables = /* @__PURE__ */ new Set();
  }
  getValue(registration) {
    const token = registration.token;
    const reset = setCurrScope(this);
    if (this.cache.has(token)) {
      reset();
      return this.cache.get(token);
    }
    const value = registration.get();
    this.cache.set(token, value);
    reset();
    return value;
  }
  onDispose(cb) {
    this.disposables.add(cb);
  }
  run(runner) {
    const reset = setCurrScope(this);
    runner?.();
    reset();
    return this;
  }
  inject(token) {
    const registration = this.module.register.get(token);
    this.module.lock();
    if (registration.lifetime === Lifetime.TRANSIENT) {
      return registration.get();
    }
    if (registration.lifetime === Lifetime.SCOPED) {
      return this.getValue(registration);
    }
    return this.module.singletonsContext.getValue(registration);
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

const isProduction = undefined?.MODE === "production";
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
  constructor(register = new Register()) {
    this.register = register;
    this.singletonsContext = new Scope(this);
    this.locked = false;
  }
  lock() {
    this.locked = true;
  }
  async dispose() {
    const disposedContext = this.singletonsContext;
    this.singletonsContext = new Scope(this);
    await disposedContext.dispose();
  }
  createScope(runInScope) {
    return new Scope(this).run(runInScope);
  }
  injectable(lifetime = Lifetime.SCOPED) {
    return (constructor) => {
      if (this.locked) {
        throw new FrozenScopeError();
      }
      this.register.set(constructor, lifetime);
    };
  }
  extend(provider, lifetime = Lifetime.SCOPED) {
    if (this.locked) {
      throw new FrozenScopeError();
    }
    this.register.set(provider, lifetime);
    return this;
  }
  create(registrations = []) {
    const payload = [this.register];
    registrations.forEach((item) => {
      if (item instanceof Module) {
        item.lock();
        payload.push(item.register);
        return;
      }
      payload.push(item);
    });
    const register = new Register(payload);
    return new Module(register);
  }
  static create(registrations = []) {
    return globalModule.create(registrations);
  }
}
const globalModule = new Module();
const disposeModule = globalModule.dispose.bind(globalModule);
const createScope = globalModule.createScope.bind(globalModule);
const createModule = globalModule.create.bind(globalModule);
const injectable = globalModule.injectable.bind(globalModule);

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
    const scope = globalModule.createScope();
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
function token(_, key) {
  if (key) {
    return Symbol.for(key);
  }
  return Symbol();
}

exports.CircularInjectionError = CircularInjectionError;
exports.DiError = DiError;
exports.FrozenScopeError = FrozenScopeError;
exports.Lifetime = Lifetime;
exports.Module = Module;
exports.Scope = Scope;
exports.TokenNameError = TokenNameError;
exports.TokenOverwriteError = TokenOverwriteError;
exports.UnknownTokenError = UnknownTokenError;
exports.createModule = createModule;
exports.createScope = createScope;
exports.disposeModule = disposeModule;
exports.inject = inject;
exports.injectable = injectable;
exports.onDispose = onDispose;
exports.token = token;
