import { inject, Lifetime, injectable, onDispose, token } from '../../src'
import { Request, Response } from 'express'

export const RequestToken = token<Request>()
export const ResponseToken = token<Response>()

@injectable(Lifetime.SINGLETON)
class Db {
	values = new Map<string | number, any>()

	constructor() {
		onDispose(() => {
			console.log('shutdown DB')
		})
	}

	get(key: string | number) {
		return this.values.get(key)
	}

	set(key: string | number, value: any) {
		this.values.set(key, value)
	}
}

@injectable(Lifetime.SCOPED)
export class User {
	db = inject(Db)
	uuid
	session: Record<any, any>

	constructor() {
		const req = inject(RequestToken)
		const res = inject(ResponseToken)
		const sessionId = req.cookies.session

		if (sessionId) {
			this.uuid = sessionId
			this.session = this.db.get(sessionId) || {}
		} else {
			this.uuid = Math.random()
			this.session = {}
			res.cookie('session', this.uuid)
		}

		onDispose(() => this.saveSession())
	}

	saveSession() {
		console.log('session save')
		this.db.set(this.uuid, this.session)
	}
}
