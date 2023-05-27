import { Lifetime, ValueProvider } from '../types'
import { TokenRegistration } from './TokenRegistration.ts'

export class ValueRegistration<T> extends TokenRegistration<T> {
	constructor(
		public register: ValueProvider<T>,
		lifetime: Lifetime
	) {
		super(register, lifetime)
	}

	get(): T {
		return this.register.useValue
	}
}