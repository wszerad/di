import { Constructor, Lifetime, Provider, Token } from '../types'
import { Register } from './Register'

export class Module {
	private readonly register: Register

	constructor(
		registrations: (Provider<any> | Module)[] = []
	) {
		this.register = new Register(
			registrations.map(item => {
				if (item instanceof Module) {
					return item.register
				}
				return item
			})
		)
	}

	getProvider<T>(token: Token<T>) {
		return this.register.get(token)
	}

	injectable(lifetime: Lifetime = Lifetime.SCOPED) {
		return (constructor: Constructor<any>, _: any) => {
			this.register.set(constructor, lifetime)
		}
	}
}

export const globalModule = new Module()
export const injectable = globalModule.injectable.bind(globalModule)
