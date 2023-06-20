export type Constructor<T> = new (...args: any[]) => T

export type Factory<T> = (...args: any[]) => T

export type Token<T = any> = Symbol | string | Constructor<T> | Factory<T>

export type GenericProvider<T = any> = {
	token: Token<T>
	lifetime?: Lifetime
	provider?: () => T
}

export type ClassProvider<T = any> = GenericProvider<T> & {
	useClass: Constructor<T>
}

export type FactoryProvider<T = any> = GenericProvider<T> & {
	useFactory: Factory<T>
}

export type ValueProvider<T = any> = GenericProvider<T> & {
	useValue: T
}

export type RawProvider<T> = Factory<T> | Constructor<T>
export type TokenProvider<T> = ClassProvider<T> | FactoryProvider<T> | ValueProvider<T>
export type Provider<T> = TokenProvider<T> | RawProvider<T>

export type Disposable = () => Awaited<any>

export enum Lifetime {
	SCOPED = 'SCOPED',
	TRANSIENT = 'TRANSIENT',
	SINGLETON = 'SINGLETON'
}

