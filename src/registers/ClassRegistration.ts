import { ClassProvider, Lifetime } from '../types'
import { TokenRegistration } from './TokenRegistration.ts'

export class ClassRegistration<T> extends TokenRegistration<T> {
	constructor(
		public register: ClassProvider<T>,
		lifetime: Lifetime
	) {
		super(register, lifetime)
	}

	get(): T {
		return new this.register.useClass()
	}
}