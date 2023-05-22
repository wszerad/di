import { inject, Lifetime, scope, onDispose } from '../src/index'
import { afterEach } from 'vitest'

export const { register, resolve, dispose } = scope()

const sleep = (time: number) => new Promise((res) => {
	setTimeout(res, time)
})

class CommonService {
	constructor() {
		onDispose(() => sleep(100))
	}
}
register(CommonService, Lifetime.SINGLETON)

class Module {
	common = inject(CommonService)

	constructor() {
		onDispose(() => sleep(100))
	}
}
register(Module, Lifetime.SCOPED)

describe('case dispose', () => {
	afterEach(() => {
		dispose()
	})

	it('should recreate SCOPED instance', () => {
		const module1 = resolve(Module)
		const module2 = resolve(Module)
		expect(module1.common).toBe(module2.common)
		dispose()

		const module3 = resolve(Module)
		expect(module1.common).not.toBe(module3.common)
	})

	it('should ', () => {

	})
})