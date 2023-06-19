import { Lifetime, Token, GenericProvider } from '../types'

export abstract class Registration<T = any, R extends GenericProvider<T> = GenericProvider> {
	private _value: T | undefined
	token: Token<T>
	lifetime: Lifetime

	constructor(
		public register: R,
		lifetime: Lifetime
	) {
		this.token = register.token
		this.lifetime = register.lifetime || lifetime
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