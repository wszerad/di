import { Constructor, Lifetime, Provider, Registration, Token } from '../types'
import { Scope } from '../models/Scope'
import { Register } from './Register'
import { FrozenScopeError } from '../errors'

export class Module {
	private rootScope: Scope
	private readonly register: Register
	private locked = false

	constructor(registrations: (Provider<any> | Module)[] = [], rootScope?: Scope) {
		this.rootScope = rootScope || new Scope(this)
		this.register = new Register(
			registrations.map(item => {
				if (item instanceof Module) {
					return item.providers()
				}
				return item
			})
		)
	}

	private lock() {
		this.locked = true
	}

	providers() {
		this.lock()
		return this.register
	}

	resolve<T>(token: Token<T>, scope = new Scope(this)): T {
		const registration: Registration<T> = this.register.get(token)

		this.lock()

		if (registration.lifetime === Lifetime.TRANSIENT) {
			return registration.get()
		}

		if (registration.lifetime === Lifetime.SCOPED) {
			return scope.getValue(registration)
		}

		return this.rootScope.getValue(registration)
	}

	async reset() {
		const disposedScope = this.rootScope
		this.rootScope = new Scope(this)
		await disposedScope.dispose()
	}

	createScope() {
		return new Scope(this)
	}

	injectable(lifetime: Lifetime = Lifetime.SCOPED) {
		return (constructor: Constructor<any>) => {
			if (this.locked) {
				throw new FrozenScopeError()
			}

			this.register.set(constructor, lifetime)
		}
	}

	provide(provider: Provider<any>, lifetime = Lifetime.SCOPED) {
		if (this.locked) {
			throw new FrozenScopeError()
		}

		this.register.set(provider, lifetime)
		return this
	}

	extend(registrations: (Provider<any> | Module)[] = []) {
		return new Module([
			this,
			...registrations
		], this.rootScope)
	}
}

export const globalModule = new Module()
export const resetModule = globalModule.reset.bind(globalModule)
export const extendModule = globalModule.extend.bind(globalModule)
export const injectable = globalModule.injectable.bind(globalModule)
export const provide = globalModule.provide.bind(globalModule)
export const resolve = globalModule.resolve.bind(globalModule)