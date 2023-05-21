import { Token } from './types'
import { getTokenName } from './utils'

export class CIError extends Error {
    constructor(tokens: Token<any>[]) {
        super('Circular dependency injection: ' + tokens.map(getTokenName).join(' -> '))
    }
}

export class TokenOverwriteError extends Error {
    constructor(name: string) {
        super(`Token with name: ${name} is already registered`)
    }
}

export class TokenNameError extends Error {
    constructor() {
        super('Token name can not be empty')
    }
}

export class UnknownTokenError extends Error {
    constructor() {
        super('Unknown token')
    }
}