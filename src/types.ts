export type Constructor<T> = new (...args: any[]) => T

export type Factory<T> = (...args: any[]) => T

export type Token<T = any> = Symbol | string | Constructor<T> | Factory<T>

export type GenericProvider<T = any> = {
	token: Token<T>
	lifetime?: Lifetime
	provider: Provider<T>
}

export type RawValue<T> = T
export type RawProvider<T> = Factory<T> | Constructor<T>
export type Provider<T> = RawProvider<T> | RawValue<T>

export type Disposable = () => Awaited<any>

export enum Lifetime {
	SCOPED = 'SCOPED',
	TRANSIENT = 'TRANSIENT',
	SINGLETON = 'SINGLETON'
}

