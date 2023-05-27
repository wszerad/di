import { scope, token } from '../src/index'

const { register, resolve, crateChildScope } = scope()

class Class {
	class = true
}

class ClassOverwrite {
	class = false
}

register(Class)

describe('case subscope', () => {
	it('should resolve overwritten class', () => {
		const value1 = resolve(Class)

		const subscope = crateChildScope([
			{
				token: Class,
				useClass: ClassOverwrite
			}
		])

		const value2 = subscope.resolve(Class)
		expect(value1.class).toBe(true)
		expect(value2.class).toBe(false)
	})

	it('should fail to register if child scope created', () => {
		const scope1 = scope()

		scope1.crateChildScope([
			{
				token: token(Class),
				useClass: ClassOverwrite
			}
		])

		expect(() => {
			scope1.register(ClassOverwrite)
		}).toThrowError('frozen')
	})

	it('should fail to register if already resolved', () => {
		const subscope = crateChildScope()

		subscope.resolve(Class)

		expect(() => {
			subscope.register(ClassOverwrite)
		}).toThrowError('frozen')
	})
})