import { bindClass, disposable, inject, Lifetime, Module, onDispose, Scope } from '../src/index'

const sleep = (time: number) =>
	new Promise((res) => {
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
		module = new Module([bindClass(CommonService, Lifetime.SINGLETON), Model])
		scope = new Scope(module)
	})

	it('should recreate SCOPED instance', async () => {
		const model1 = scope.inject(Model)
		const model2 = scope.inject(Model)
		expect(model1).toBe(model2)
		await scope.dispose()

		const model3 = scope.inject(Model)
		expect(model1).not.toBe(model3)
	})

	it('should wait until scope dispose', async () => {
		scope.inject(Model)
		const start = Date.now()
		await scope.dispose()
		expect(Date.now()).toBeGreaterThan(start + 90)
	})
})
class DecoratedService {
	disposed = 0

	@disposable
	tearDown() {
		this.disposed++
	}
}

describe('case disposable decorator', () => {
	it('should register decorated method on the creating scope', async () => {
		const scope = new Scope(new Module([DecoratedService]))
		const service = scope.inject(DecoratedService)

		expect(service.disposed).toBe(0)
		await scope.dispose()
		expect(service.disposed).toBe(1)
	})

	it('should register the hook per instance, not per class', async () => {
		const module = new Module([bindClass(DecoratedService, Lifetime.TRANSIENT)])
		const scope = new Scope(module)
		const first = scope.inject(DecoratedService)
		const second = scope.inject(DecoratedService)

		await scope.dispose()
		expect(first.disposed).toBe(1)
		expect(second.disposed).toBe(1)
	})
})
