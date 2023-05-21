import { inject, Lifetime, scope } from '../src/index'

export const { register, resolve } = scope()

class Service4 {
	service = inject(Service0)
}
register(Service4, Lifetime.SCOPED)

class Service3 {
	service = inject(Service4)
}
register(Service3, Lifetime.SCOPED)

class Service2 {
	service = inject(Service3)
}
register(Service2, Lifetime.SCOPED)

class Service1 {
	service = inject(Service2)
}
register(Service1, Lifetime.SCOPED)

class Service0 {
	service = inject(Service1)
}
register(Service0, Lifetime.SCOPED)

describe('case circular', () => {
	it('should fail in loop', () => {
		const service = resolve(Service0)
		expect(service.service).toBe(service)
	})
})