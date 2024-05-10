import { bindClass } from '../src/helpers.ts'
import { inject, Lifetime, Module, Scope } from '../src/index'

class SubService {
	common = inject(CommonService)
}

class Service {
	subService = inject(SubService)
	common = inject(CommonService)
}

class CommonService {}

class OutOfScopeService {
	common = inject(CommonService)
}

class Model {
	service1 = inject(Service)
	service2 = inject(Service)
	common = inject(CommonService)
}

describe('case di', () => {
	let module: Module
	let model1: Model
	let model2: Model

	beforeEach(() => {
		module = new Module([
			SubService,
			Model,
			bindClass(Service, Lifetime.TRANSIENT),
			bindClass(CommonService, Lifetime.SINGLETON),
			bindClass(OutOfScopeService, Lifetime.SINGLETON),
		])

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

	it('should fail in injecting not global service', () => {
		expect(() => {
			const scope = new Scope(module)
			scope.inject(OutOfScopeService)
		}).toThrowError('Unknown token in global module')
	})
})
