import { Token } from './types'

// @ts-ignore
export const isDevelop = import.meta?.env?.MODE === 'development'

export function isFunction(input: any) {
	return typeof input === 'function'
}

export function isConstructor(input: any) {
	return isFunction(input)
		&& input.prototype
		&& !Object.getOwnPropertyDescriptor(input, 'prototype')?.writable
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