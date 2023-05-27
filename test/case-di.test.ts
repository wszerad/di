import { inject, Lifetime, scope } from '../src/index'

const { register, resolve } = scope()

class NestedService {}
register(NestedService, Lifetime.SCOPED)

class SubService {
	common = inject(CommonService)
}
register(SubService, Lifetime.SCOPED)

class Service {
	subService = inject(SubService)
	common = inject(CommonService)
}
register(Service, Lifetime.TRANSIENT)

class CommonService {
	nested = inject(NestedService)
}
register(CommonService, Lifetime.SINGLETON)

class Module {
	service1 = inject(Service)
	service2 = inject(Service)
	nested = inject(NestedService)
	common = inject(CommonService)
}
register(Module, Lifetime.SCOPED)

describe('case 01', () => {
	let module1: Module
	let module2: Module

	beforeEach(() => {
		module1 = resolve(Module)
		module2 = resolve(Module)
	})

	it('should recreate SCOPED instance', () => {
		expect(module1).not.toBe(module2)
	})

	it('should share SINGLETONS between contexts', () => {
		expect(module1.common).toBe(module2.common)
	})

	it('should share SINGLETONS between levels', () => {
		expect(module1.common).toBe(module1.service1.common)
		expect(module1.common).toBe(module1.service1.subService.common)
	})

	it('should create new instance for each TRANSIENT dependency', () => {
		expect(module1.service1).not.toBe(module1.service2)
	})

	it('should share SCOPED', () => {
		expect(module1.service1.subService).toBe(module1.service2.subService)
	})

	it('should isolate SINGLETONS dependencies', () => {
		expect(module1.nested).not.toBe(module1.common.nested)
	})
})