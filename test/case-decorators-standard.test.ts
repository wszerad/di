import {
	bindClass,
	DecoratorUsageError,
	disposable,
	inject,
	injectable,
	Lifetime,
	Module,
	Scope,
} from '../src/index'

type Initializer = (this: any) => void

/**
 * The oxc transform in this toolchain only emits legacy decorators, so the ECMAScript
 * (TC39) protocol is driven explicitly here instead of through `@` syntax. Only the three
 * pieces of the context our decorators actually read are modelled: `kind`, `name` and
 * `addInitializer`.
 */
function methodContext(name: string, initializers: Initializer[], kind = 'method') {
	return {
		kind,
		name,
		static: false,
		private: false,
		addInitializer(fn: Initializer) {
			initializers.push(fn)
		},
		metadata: {},
	} as any
}

function classContext(name: string, kind = 'class') {
	return {
		kind,
		name,
		addInitializer() {},
		metadata: {},
	} as any
}

/**
 * Decorates `name` on the prototype, then returns a subclass that runs the collected
 * initializers against every new instance, the way a compliant runtime does.
 */
function decorateMethod<T extends new (...args: any[]) => any>(target: T, name: string): T {
	const initializers: Initializer[] = []
	const original = target.prototype[name]

	target.prototype[name] = disposable(original, methodContext(name, initializers)) ?? original

	return class extends target {
		constructor(...args: any[]) {
			super(...args)
			for (const init of initializers) {
				init.call(this)
			}
		}
	} as T
}

describe('case decorators (ECMAScript protocol)', () => {
	it('should register a decorated method on the creating scope', async () => {
		class Service {
			disposed = 0

			tearDown() {
				this.disposed++
			}
		}

		const Decorated = decorateMethod(Service, 'tearDown')
		const scope = new Scope(new Module([Decorated]))
		const service = scope.inject(Decorated)

		expect(service.disposed).toBe(0)
		await scope.dispose()
		expect(service.disposed).toBe(1)
	})

	it('should register the hook per instance, not per class', async () => {
		class Service {
			disposed = 0

			tearDown() {
				this.disposed++
			}
		}

		const Decorated = decorateMethod(Service, 'tearDown')
		const scope = new Scope(new Module([bindClass(Decorated, Lifetime.TRANSIENT)]))
		const first = scope.inject(Decorated)
		const second = scope.inject(Decorated)

		await scope.dispose()
		expect(first.disposed).toBe(1)
		expect(second.disposed).toBe(1)
	})

	it('should reject @disposable on anything but a method', () => {
		expect(() => {
			disposable(() => {}, methodContext('field', [], 'field'))
		}).toThrow(DecoratorUsageError)
	})

	it('should register a decorated class in the global module', () => {
		class Config {
			value = 'global'
		}

		injectable()(Config, classContext('Config'))

		class Service {
			config = inject(Config)
		}

		// a SINGLETON is built in the global scope, so Config has to resolve from globalRegister
		const scope = new Scope(new Module([bindClass(Service, Lifetime.SINGLETON)]))

		expect(scope.inject(Service).config.value).toBe('global')
	})

	it('should reject @injectable on anything but a class', () => {
		class Service {}

		expect(() => {
			injectable()(Service, classContext('Service', 'method'))
		}).toThrow(DecoratorUsageError)
	})
})
