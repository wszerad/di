import { UnknownGlobalTokenError, UnknownTokenError } from '../errors'
import { Registration } from '../registrations/Registration'
import { RawProvider, Token } from '../types'
import { getRegistration } from '../utils'

export const globalRegister: Map<Token, Registration> = new Map()

export class Module {
	#records: Map<Token, Registration> = new Map()

	constructor(
		registrations: (RawProvider<any> | Registration | Module)[] = [],
		pure = false
	) {
		const entries: [Token, Registration][] = []

		if (!pure) {
			console.log('g', ...Object.entries(globalRegister))
			entries.push(...Object.entries(globalRegister))
		}

		registrations.reduce((acc, registration) => {
			if (registration instanceof Module) {
				acc.push(...registration.cloneRecords())
				return acc
			}

			if (registration instanceof Registration) {
				acc.push([registration.token, registration])
			}

			const record = getRegistration(registration)
			acc.push([record.token, record])

			return acc
		}, entries)

		this.#records = new Map(entries)
	}

	cloneRecords(): [Token, Registration][] {
		return Array.from(this.#records.entries())
	}

	get<T>(token: Token<T>): Registration<T> {
		const record = this.#records.get(token)
		if(!record) {
			throw new UnknownTokenError(token)
		}
		return record
	}
}

export class GlobalModule extends Module {
	get<T>(token: Token<T>): Registration<T> {
		const record = globalRegister.get(token)
		if(!record) {
			throw new UnknownGlobalTokenError(token)
		}
		return record
	}

	cloneRecords(): [Token, Registration][] {
		return Object.entries(globalRegister)
	}
}

export const globalModule = new GlobalModule([])