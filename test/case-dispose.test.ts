import { inject, Lifetime, scope } from '../src/index'

export const { register, resolve, dispose } = scope()

class CommonService {}
register(CommonService, Lifetime.SINGLETON)

class Module {
	common = inject(CommonService)
}
register(Module, Lifetime.SCOPED)

describe('case dispose', () => {
	it('should recreate SCOPED instance', () => {
		const module1 = resolve(Module)
		const module2 = resolve(Module)
		expect(module1.common).toBe(module2.common)
		dispose()

		const module3 = resolve(Module)
		expect(module1.common).not.toBe(module3.common)
	})
})