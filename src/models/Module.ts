import { Constructor, Lifetime, Provider, TokenProvider } from '../types'
import { Scope } from '../models/Scope'
import { Register } from './Register'
import { FrozenScopeError } from '../errors'

export class Module {
	singletonsContext: Scope = new Scope(this)
	private locked = false

	constructor(
		public register: Register = new Register(),
	) {}

	lock() {
		this.locked = true
	}

	async dispose() {
		const disposedContext = this.singletonsContext
		this.singletonsContext = new Scope(this)
		await disposedContext.dispose()
	}

	createScope(runInScope?: () => void) {
		return new Scope(this).run(runInScope)
	}

	injectable(lifetime: Lifetime = Lifetime.SCOPED) {
		return (constructor: Constructor<any>) => {
			if (this.locked) {
				throw new FrozenScopeError()
			}

			this.register.set(constructor, lifetime)
		}
	}

	extend(provider: Provider<any>, lifetime = Lifetime.SCOPED) {
		if (this.locked) {
			throw new FrozenScopeError()
		}

		this.register.set(provider, lifetime)
		return this
	}

	create(registrations: (Provider<any> | Module)[] = []) {
		const payload: (Register | Provider<any>)[] = [this.register]

		registrations.forEach(item => {
			if (item instanceof Module) {
				item.lock()
				payload.push(item.register)
				return
			}
			payload.push(item)
		})

		const register = new Register(payload)
		return new Module(register)
	}

	static create(registrations: (TokenProvider<any> | Module)[] = []) {
		return globalModule.create(registrations)
	}
}

export const globalModule = new Module()
export const disposeModule = globalModule.dispose.bind(globalModule)
export const createScope = globalModule.createScope.bind(globalModule)
export const createModule = globalModule.create.bind(globalModule)
export const injectable = globalModule.injectable.bind(globalModule)