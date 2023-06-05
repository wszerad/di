type Constructor<T> = new (...args: any[]) => T;
type Factory<T> = (...args: any[]) => T;
type Token<T = any> = Symbol | string | Constructor<T> | Factory<T>;
type GenericProvider<T = any> = {
    token: Token<T>;
    lifetime?: Lifetime;
};
type ClassProvider<T = any> = GenericProvider<T> & {
    useClass: Constructor<T>;
};
type FactoryProvider<T = any> = GenericProvider<T> & {
    useFactory: Factory<T>;
};
type ValueProvider<T = any> = GenericProvider<T> & {
    useValue: T;
};
type RawProvider<T> = Factory<T> | Constructor<T>;
type TokenProvider<T> = ClassProvider<T> | FactoryProvider<T> | ValueProvider<T>;
type Provider<T> = TokenProvider<T> | RawProvider<T>;
type Disposable = () => Awaited<any>;
declare enum Lifetime {
    SCOPED = "SCOPED",
    TRANSIENT = "TRANSIENT",
    SINGLETON = "SINGLETON"
}
interface Registration<T = any> {
    token: Token<T>;
    lifetime: Lifetime;
    get(): T;
}

declare function inject<T>(token: Token<T>): T;
declare function onDispose(cb: Disposable): void;
declare function dispose(this: any, target: (...args: any[]) => any, _: any): (...args: any[]) => any;
declare function token<T>(_?: Token<T> | T, key?: string): Token<T>;

declare class Scope {
    private readonly module;
    private readonly cache;
    private readonly disposables;
    constructor(module: Module);
    private runInScope;
    getValue<T>(registration: Registration<T>): T;
    onDispose(cb: Disposable): void;
    inject<T>(token: Token<T>): T;
    dispose(): Promise<void>;
}

declare class Register {
    private readonly records;
    constructor(registrations?: (Register | Provider<any>)[]);
    private getRegistration;
    get<T>(token: Token<T>): Registration<T>;
    set<T>(provider: Provider<T>, lifetime: Lifetime): this;
}

declare class Module {
    private rootScope;
    private readonly register;
    private locked;
    constructor(registrations?: (Provider<any> | Module)[], rootScope?: Scope);
    private lock;
    providers(): Register;
    resolve<T>(token: Token<T>, scope?: Scope): T;
    reset(): Promise<void>;
    createScope(): Scope;
    injectable(lifetime?: Lifetime): (constructor: Constructor<any>) => void;
    provide(provider: Provider<any>, lifetime?: Lifetime): this;
    extend(registrations?: (Provider<any> | Module)[]): Module;
}
declare const globalModule: Module;
declare const resetModule: () => Promise<void>;
declare const extendModule: (registrations?: (Provider<any> | Module)[]) => Module;
declare const injectable: (lifetime?: Lifetime) => (constructor: Constructor<any>) => void;
declare const provide: (provider: Provider<any>, lifetime?: Lifetime) => Module;
declare const resolve: <T>(token: Token<T>, scope?: Scope) => T;

declare class DiError extends Error {
}
declare class CircularInjectionError extends DiError {
    constructor(tokens: Token[]);
}
declare class TokenOverwriteError extends DiError {
    constructor(name: string);
}
declare class FrozenScopeError extends DiError {
    constructor();
}
declare class TokenNameError extends DiError {
    constructor();
}
declare class UnknownTokenError extends DiError {
    constructor(token: Token);
}

export { CircularInjectionError, DiError, Disposable, FrozenScopeError, Lifetime, Module, Provider, Scope, Token, TokenNameError, TokenOverwriteError, TokenProvider, UnknownTokenError, dispose, extendModule, globalModule, inject, injectable, onDispose, provide, resetModule, resolve, token };
