import { inject, Lifetime, onDispose, Module, Scope } from '../src/index'

const sleep = (time: number) => new Promise((res) => {
	setTimeout(res, time)
})

class CommonService {
	constructor() {
		onDispose(() => sleep(100))
	}
}

class Model {
	common = inject(CommonService)

	constructor() {
		onDispose(() => sleep(100))
	}
}

describe('case dispose', () => {
	let module: Module
	let scope: Scope

	beforeEach(() => {
		module = Module.create()
		module.extend(CommonService, Lifetime.SINGLETON)
		module.extend(Model, Lifetime.SCOPED)
		scope = module.createScope()
	})

	it('should recreate SCOPED instance', () => {
		const model1 = scope.inject(Model)
		const model2 = scope.inject(Model)
		expect(model1).toBe(model2)
		scope.dispose()

		const model3 = scope.inject(Model)
		expect(model1).not.toBe(model3)
	})

	it('should recreate SINGLETON instance', () => {
		const model1 = scope.inject(Model)
		const model2 = module.createScope().inject(Model)
		expect(model1.common).toBe(model2.common)
		module.dispose()

		const module3 = module.createScope().inject(Model)
		expect(model1.common).not.toBe(module3.common)
	})

	it('should wait until scope dispose', async () => {
		scope.inject(Model)
		const start = Date.now()
		await scope.dispose()
		expect(Date.now()).toBeGreaterThan(start + 100)
	})

	it('should wait until module dispose', async () => {
		scope.inject(Model)
		const start = Date.now()
		await module.dispose()
		expect(Date.now()).toBeGreaterThan(start + 100)
	})
})