type Constructor<T> = new (...args: any[]) => T;
type Factory<T> = (...args: any[]) => T;
type Token<T> = Symbol | string | Constructor<T> | Factory<T>;
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
declare function token<T>(_: Token<T> | T, key?: string): Token<T>;

declare class Scope {
    module: Module;
    cache: Map<Token<any>, any>;
    disposables: Set<Disposable>;
    constructor(module: Module);
    private getValue;
    onDispose(cb: Disposable): void;
    run(runner?: () => void): this;
    inject<T>(token: Token<T>): T;
    dispose(): Promise<void>;
}

declare class Register {
    private records;
    constructor(registrations?: (Register | Provider<any>)[]);
    private getRegistration;
    get<T>(token: Token<T>): Registration<T>;
    set<T>(provider: Provider<T>, lifetime: Lifetime): this;
}

declare class Module {
    register: Register;
    singletonsContext: Scope;
    private locked;
    constructor(register?: Register);
    lock(): void;
    dispose(): Promise<void>;
    createScope(runInScope?: () => void): Scope;
    injectable(lifetime?: Lifetime): (constructor: Constructor<any>) => void;
    extend(provider: Provider<any>, lifetime?: Lifetime): this;
    create(registrations?: (Provider<any> | Module)[]): Module;
    static create(registrations?: (TokenProvider<any> | Module)[]): Module;
}
declare const disposeModule: () => Promise<void>;
declare const createScope: (runInScope?: () => void) => Scope;
declare const createModule: (registrations?: (Provider<any> | Module)[]) => Module;
declare const injectable: (lifetime?: Lifetime) => (constructor: Constructor<any>) => void;

declare class DiError extends Error {
}
declare class CircularInjectionError extends DiError {
    constructor(tokens: Token<any>[]);
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
    constructor(token: Token<any>);
}

export { CircularInjectionError, DiError, Disposable, FrozenScopeError, Lifetime, Module, Provider, Scope, Token, TokenNameError, TokenOverwriteError, TokenProvider, UnknownTokenError, createModule, createScope, disposeModule, inject, injectable, onDispose, token };
