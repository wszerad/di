import { inject, Lifetime, Module } from '../src/index'

class NestedService {}

class SubService {
	common = inject(CommonService)
}

class Service {
	subService = inject(SubService)
	common = inject(CommonService)
}

class CommonService {
	nested = inject(NestedService)
}

class Model {
	service1 = inject(Service)
	service2 = inject(Service)
	nested = inject(NestedService)
	common = inject(CommonService)
}

describe('case di', () => {
	let model1: Model
	let model2: Model

	beforeEach(() => {
		const module = Module.create()
		module.extend(NestedService, Lifetime.SCOPED)
		module.extend(SubService, Lifetime.SCOPED)
		module.extend(Service, Lifetime.TRANSIENT)
		module.extend(CommonService, Lifetime.SINGLETON)
		module.extend(Model, Lifetime.SCOPED)

		const context1 = module.createScope()
		const context2 = module.createScope()
		model1 = context1.inject(Model)
		model2 = context2.inject(Model)
	})

	it('should recreate SCOPED instance', () => {
		expect(model1).not.toBe(model2)
	})

	it('should share SINGLETONS between contexts', () => {
		expect(model1.common).toBe(model2.common)
	})

	it('should share SINGLETONS between levels', () => {
		expect(model1.common).toBe(model1.service1.common)
		expect(model1.common).toBe(model1.service1.subService.common)
	})

	it('should create new instance for each TRANSIENT dependency', () => {
		expect(model1.service1).not.toBe(model1.service2)
	})

	it('should share SCOPED', () => {
		expect(model1.service1.subService).toBe(model1.service2.subService)
	})

	it('should isolate SINGLETONS dependencies', () => {
		expect(model1.nested).not.toBe(model1.common.nested)
	})
})