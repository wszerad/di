export type Constructor<T> = new (...args: any[]) => T

export type Factory<T> = (...args: any[]) => T

export type Token<T> = Symbol | string | Constructor<T> | Factory<T>

export type RegisterBase<T = any> = {
	token: Token<T>
	lifetime?: Lifetime
}

export type RegisterClass<T = any> = RegisterBase<T> & {
	useClass: Constructor<T>
}

export type RegisterFactory<T = any> = RegisterBase<T> & {
	useFactory: Factory<T>
}

export type RegisterValue<T = any> = RegisterBase<T> & {
	useValue: T
}

export type RawRegister<T> = Factory<T> | Constructor<T>
export type TokenRegister<T> = RegisterClass<T> | RegisterFactory<T> | RegisterValue<T>
export type Register<T> = TokenRegister<T> | RawRegister<T>

export enum Lifetime {
	SCOPED = 'SCOPED',
	TRANSIENT = 'TRANSIENT',
	SINGLETON = 'SINGLETON'
}

export enum ProviderType {
	CLASS,
	FACTORY,
	VALUE,
	RAW_CLASS,
	RAW_FACTORY
}