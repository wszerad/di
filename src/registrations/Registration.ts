import { Lifetime, Token, GenericProvider } from '../types'

export abstract class Registration<T = any, R extends GenericProvider<T> = GenericProvider> {
	private _value: T | undefined
	token: Token<T>
	lifetime: Lifetime
	provider: any

	constructor(
		register: R,
		lifetime: Lifetime
	) {
		this.token = register.token
		this.lifetime = register.lifetime || lifetime
		this.provider = this.extract(register) || register.provider
	}

	protected abstract get(): T

	protected abstract extract(register: R): any

	get value() {
		if (this.lifetime === Lifetime.SINGLETON) {
			if (this._value !== undefined) {
				return this._value
			}

			return this._value = this.get()
		}

		return this.get()
	}
}