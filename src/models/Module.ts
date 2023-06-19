import { Constructor, Lifetime, Provider, Token } from '../types'
import { Scope } from '../models/Scope'
import { Register } from './Register'
import { FrozenScopeError } from '../errors'

export class Module {
	private readonly register: Register
	private locked = false
	scope: Scope | null

	constructor(
		registrations: (Provider<any> | Module)[] = [],
		isolated = false
	) {
		this.register = new Register(
			registrations.map(item => {
				if (item instanceof Module) {
					return item.providers
				}
				return item
			}),
			isolated
		)
		this.scope = isolated ? new Scope(this) : null
	}

	private lock() {
		this.locked = true
	}

	get providers() {
		this.lock()
		return this.register
	}

	resolve<T>(token: Token<T>, scope = new Scope(this)): T {
		this.lock()
		return scope.inject(token)
	}

	injectable(lifetime: Lifetime = Lifetime.SCOPED) {
		return (constructor: Constructor<any>, _: any) => {
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
		])
	}

	async dispose() {
		await this.scope?.dispose()
	}
}

export const globalModule = new Module()
export const extendModule = globalModule.extend.bind(globalModule)
export const injectable = globalModule.injectable.bind(globalModule)
export const provide = globalModule.provide.bind(globalModule)
export const resolve = globalModule.resolve.bind(globalModule)
