import { Lifetime, Token, GenericProvider } from '../types'

export abstract class Registration<T = any> {
	private _value: T | undefined
	token: Token<T>
	lifetime: Lifetime
	provider: any

	constructor(
		register: GenericProvider<T>
	) {
		this.token = register.token
		this.lifetime = register.lifetime || Lifetime.SCOPED
		this.provider = register.provider
	}

	protected abstract get(): T

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