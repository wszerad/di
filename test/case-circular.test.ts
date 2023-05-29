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
	let context: Scope

	beforeEach(() => {
		module = new Module()
		module.extend(Service4, Lifetime.SCOPED)
		module.extend(Service3, Lifetime.SCOPED)
		module.extend(Service2, Lifetime.SCOPED)
		module.extend(Service1, Lifetime.SCOPED)
		module.extend(Service0, Lifetime.SCOPED)
		context = module.createScope()
	})

	it('should fail in loop', () => {
		expect(() => {
			const service = context.inject(Service0)
			expect(service.service)
		}).toThrowError('Circular')
	})
})