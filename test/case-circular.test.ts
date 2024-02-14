import { inject, Lifetime, Module, Scope } from '../src/index'

class Service4 {
	service = inject(Service0)
}

class Service3 {
	service = inject(Service4)
}

class Service2 {
	service = inject(Service3)
}

class Service1 {
	service = inject(Service2)
}

class Service0 {
	service = inject(Service1)
}

describe('case circular', () => {
	let module: Module
	let scope: Scope

	beforeEach(() => {
		module = new Module([])
		module.provide(Service4, Lifetime.SCOPED)
		module.provide(Service3, Lifetime.SCOPED)
		module.provide(Service2, Lifetime.SCOPED)
		module.provide(Service1, Lifetime.SCOPED)
		module.provide(Service0, Lifetime.SCOPED)
		scope = new Scope(module)
	})

	it('should fail in loop', () => {
		expect(() => {
			const service = scope.inject(Service0)
			expect(service.service)
		}).toThrowError('Circular')
	})
})
