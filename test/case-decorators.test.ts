import { scope } from '../src/index'

export const { resolve, injectable } = scope()

@injectable()
class Module {
	prop = true
}

describe('case decorators', () => {
	it('should resolve decorated class', () => {
		const module = resolve(Module)
		expect(module.prop).toBe(true)
	})

	it('should cast decorated class', () => {
		const module = resolve(Module)
		expect(module.prop).toBe(true)
	})
})