import { inject, Lifetime, Module, Scope } from '../src/index'

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
	let module: Module
	let model1: Model
	let model2: Model

	beforeEach(() => {
		module = new Module([])
		module.provide(NestedService, Lifetime.SCOPED)
		module.provide(SubService, Lifetime.SCOPED)
		module.provide(Service, Lifetime.TRANSIENT)
		module.provide(CommonService, Lifetime.SINGLETON)
		module.provide(Model, Lifetime.SCOPED)

		const scope1 = new Scope(module)
		const scope2 = new Scope(module)
		model1 = scope1.inject(Model)
		model2 = scope2.inject(Model)
	})

	it('should recreate SCOPED instance', () => {
		expect(model1).not.toBe(model2)
	})

	it('should share SINGLETONS between scopes', () => {
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
		expect(model1.nested instanceof NestedService).toBe(true)
		expect(model1.nested).not.toBe(model1.common.nested)
	})

	it('should isolate SINGLETONS in isolated modules', () => {
		const moduleClone = new Module([module], true)
		const model3 = moduleClone.resolve(Model)
		expect(model1.common).not.toBe(model3.common)
	})
})
