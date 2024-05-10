import { UnknownTokenError } from './errors'
import { ClassRegistration } from './registrations/ClassRegistration'
import { FactoryRegistration } from './registrations/FactoryRegistration'
import { Registration } from './registrations/Registration'
import { Constructor, Factory, Lifetime, Provider, Token } from './types'

export function isLifetime(value: any): value is Lifetime {
	return Object.values(Lifetime).includes(value)
}

export function getTokenName(token: Token) {
	switch (typeof token) {
		case 'string':
			return token
		case 'symbol':
			return token.toString()
		case 'function':
			return token.name
		default:
			return 'unnamed'
	}
}

export function getRegistration(provider: Provider<any>, lifetime: Lifetime = Lifetime.SCOPED): Registration {
	if (isRawFactory(provider)) {
		return new FactoryRegistration({
			token: provider,
			provider,
			lifetime
		})
	}

	if (isRawClass(provider)) {
		return new ClassRegistration({
			token: provider,
			provider,
			lifetime
		})
	}

	if (provider instanceof Registration) {
		return provider
	}

	throw new UnknownTokenError(provider)
}

function isFunction(input: any) {
	return typeof input === 'function'
}

function isConstructor(input: any) {
	return isFunction(input)
		&& input.prototype
		&& !Object.getOwnPropertyDescriptor(input, 'prototype')?.writable
}

function isRawFactory(input: any): input is Factory<any> {
	return isFunction(input) && !isConstructor(input)
}

function isRawClass(input: any): input is Constructor<any> {
	return isFunction(input) && isConstructor(input)
}
