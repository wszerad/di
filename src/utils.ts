import {
	Constructor,
	Factory,
	Lifetime,
	ProviderType,
	Register,
	RegisterClass, RegisterFactory, RegisterValue,
	Token,
	TokenRegister
} from './types'
import { UnknownTokenError } from './errors'

export function isFunction(input: any) {
	return typeof input === 'function'
}

export function isConstructor(input: any) {
	return isFunction(input)
		&& input.prototype
		&& !Object.getOwnPropertyDescriptor(input, 'prototype')?.writable
}

export function getTokenRegisterType(register: Register<any>) {
	if (register.hasOwnProperty('useValue')) {
		return ProviderType.VALUE
	}
	if (register.hasOwnProperty('useFactory')) {
		return ProviderType.FACTORY
	}
	return ProviderType.CLASS
}

export function getRegisterType(register: Register<any>) {
	if (isFunction(register)) {
		return isConstructor(register)
			? ProviderType.RAW_CLASS
			: ProviderType.RAW_FACTORY
	}

	return getTokenRegisterType(register)
}

export function getRegisterLifetime(register: Register<any>, type: ProviderType, def: Lifetime) {
	switch (type) {
		case ProviderType.CLASS:
		case ProviderType.FACTORY:
		case ProviderType.VALUE:
			return (register as TokenRegister<any>).lifetime || def
		default:
			return def
	}
}

export function getToken<T>(register: Register<T>, type: ProviderType): Token<T> {
	switch (type) {
	case ProviderType.RAW_FACTORY:
		return register as Factory<T>
	case ProviderType.RAW_CLASS:
		return register as Constructor<T>
	default:
		return (register as TokenRegister<T>).token
	}
}

const typeToFactoryMap: Record<ProviderType, <T>(register: any) => T> = {
	[ProviderType.CLASS]: (register: RegisterClass) => new register.useClass(),
	[ProviderType.FACTORY]: (register: RegisterFactory) => register.useFactory(),
	[ProviderType.RAW_CLASS]: (register: Constructor<any>) => new register(),
	[ProviderType.RAW_FACTORY]: (register: Factory<any>) => register(),
	[ProviderType.VALUE]: (register: RegisterValue) => register.useValue
}

export function getFactory<T>(register: Register<T>, type: ProviderType): () => T {
	return () => typeToFactoryMap[type](register)
}

export function getTokenName(token: Token<any>) {
	switch (typeof token) {
		case 'string':
			return token
		case 'symbol':
			return token.toString()
		case 'function':
			return token.name
		default:
			throw new UnknownTokenError()
	}
}