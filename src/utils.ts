import { ClassProvider, Constructor, Factory, FactoryProvider, Token, ValueProvider } from './types'

// @ts-ignore
export const isProduction = import.meta?.env?.MODE === 'production'

export function isFunction(input: any) {
	return typeof input === 'function'
}

export function isConstructor(input: any) {
	return isFunction(input)
		&& input.prototype
		&& !Object.getOwnPropertyDescriptor(input, 'prototype')?.writable
}

export function isRawFactory(input: any): input is Factory<any> {
	return isFunction(input) && !isConstructor(input)
}

export function isRawClass(input: any): input is Constructor<any> {
	return isFunction(input) && isConstructor(input)
}

export function isValueProvider(input: any): input is ValueProvider {
	return input.hasOwnProperty('useValue')
}

export function isClassProvider(input: any): input is ClassProvider {
	return input.hasOwnProperty('useClass')
}

export function isFactoryProvider(input: any): input is FactoryProvider {
	return input.hasOwnProperty('useFactory')
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
			return 'unnamed'
	}
}