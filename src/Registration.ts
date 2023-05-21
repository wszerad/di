import {
	Lifetime,
	Token,
	Register
} from './types'
import { getRegisterLifetime, getRegisterType, getToken, getFactory } from './utils'

export class Registration<T> {
	token: Token<T>
	lifetime: Lifetime
	factory: () => T

	constructor(register: Register<T>, lifetime = Lifetime.SCOPED) {
		const type = getRegisterType(register)
		this.token = getToken(register, type)
		this.lifetime = getRegisterLifetime(register, type, lifetime)
		this.factory = getFactory(register, type)
	}
}
