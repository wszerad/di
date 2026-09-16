# @wssz/di

Small, cross-env dependency injection container for TypeScript.

- **No `reflect-metadata`, no constructor reflection.** Dependencies are pulled with `inject()` wherever the value is built, so it works the same in Node, the browser and edge runtimes.
- **Decorators are optional.** The whole API is available as plain functions; `@injectable()` and `@disposable` are sugar on top.
- **Scopes with a real lifecycle.** Every scope caches its own instances and can be disposed, awaiting async teardown hooks.

```bash
npm install @wssz/di
```

## Quick start

```typescript
import { bindClass, inject, Lifetime, Module, Scope } from '@wssz/di'

class Db {
	query(id: string) {
		return { id, name: 'John' }
	}
}

class UserService {
	// resolved against the scope that is building this instance
	db = inject(Db)

	userById(id: string) {
		return this.db.query(id)
	}
}

// a Module declares *what* can be resolved
const module = new Module([bindClass(Db, Lifetime.SINGLETON), UserService])

// a Scope holds the instances and their lifecycle
const scope = new Scope(module)

scope.inject(UserService).userById('123') // -> { id: '123', name: 'John' }
```

`inject()` is not magic glue: it reads the _currently active_ scope. That scope is set while a
provider is being constructed, which is why field initialisers and constructors can call it
directly. Outside of any construction, `inject()` falls back to the global scope.

## Core concepts

### Module — what can be resolved

A `Module` is an immutable map of token to provider. Pass classes and factories directly, or wrap
them with `bindClass` / `bindFactory` / `bindValue` to control the token and the lifetime.

```typescript
const base = new Module([UserService, Db])

// Modules compose: later entries win, which makes overriding trivial
const testing = new Module([base, bindClass(DbMock, Db)])
```

### Scope — where instances live

A `Scope` resolves tokens from its module and caches the result per lifetime. Create one per
request, per worker, per test — whatever unit of work you want to be able to throw away.

```typescript
const scope = new Scope(module)
const service = scope.inject(UserService)

await scope.dispose() // runs every registered teardown hook and clears the cache
```

### Lifetime — how long an instance lives

| Lifetime             | Cached in                  | Disposed by                     |
| -------------------- | -------------------------- | ------------------------------- |
| `Lifetime.SCOPED`    | the resolving scope        | `scope.dispose()`               |
| `Lifetime.TRANSIENT` | nothing — new every inject | `scope.dispose()`               |
| `Lifetime.SINGLETON` | the registration itself    | `dispose()` on the global scope |

`SCOPED` is the default.

> **Singletons are built in the global scope.** Because a singleton outlives any individual scope,
> it is constructed with the global scope active. Everything it injects therefore has to be
> registered globally — that is what `@injectable()` does. Injecting a scope-only provider from a
> singleton throws `UnknownGlobalTokenError`.

## Testing and mocking

Overriding a dependency is module composition, not a framework feature:

```typescript
import { bindFactory, Module, Scope } from '@wssz/di'

const testModule = new Module([
	appModule,
	bindFactory(() => ({ query: () => ({ id: '123', name: 'John' }) }), Db),
])

const service = new Scope(testModule).inject(UserService)
service.userById('any key') // -> { id: '123', name: 'John' }
```

## API

### `inject(token)`

Resolves `token` in the currently active scope. Use it while a provider is being built — in a class
field, a constructor, or the body of a factory. Called outside of construction, it resolves against
the global scope.

```typescript
class Example {
	a = inject(Class1)

	constructor() {
		this.b = inject(Class2)
	}

	method() {
		// no scope is active here -> resolved from the global scope
		const c = inject(Class3)
	}
}

function factory() {
	return { a: inject(Class1) }
}
```

Outside of production builds (`process.env.NODE_ENV !== 'production'`), `inject` tracks the
resolution stack and throws `CircularInjectionError` with the full cycle when one is detected.

### `token(value?, key?)`

Creates a typed token. With a `key` it returns `Symbol.for(key)`, so the same key resolves to the
same token across modules and bundles; otherwise a fresh unique `Symbol()`.

```typescript
interface Config {
	var: string
}

const config: Config = { var: '123' }

const token1 = token<Config>() // typed, anonymous
const token2 = token(config) // type inferred from the value
const token3 = token(config, 'config') // shared via Symbol.for('config')

new Module([
	bindValue(config, token1),
	bindFactory(() => ({ var: '321' }), token2),
	bindValue(config, token3),
])

class Service {
	// all three are typed as Config
	c1 = inject(token1)
	c2 = inject(token2)
	c3 = inject(token3)
}
```

### `bindClass(constructor, token?, lifetime?)`

Registers a class. The token defaults to the constructor itself. The second argument accepts either
a token or a lifetime, so both short forms work:

```typescript
bindClass(Service) // token: Service, SCOPED
bindClass(Service, Lifetime.SINGLETON) // token: Service, SINGLETON
bindClass(ServiceMock, Service) // token: Service, SCOPED (override)
bindClass(ServiceMock, Service, Lifetime.TRANSIENT)
```

### `bindFactory(factory, token?, lifetime?)`

Same shape, but the provider is a function whose return value is injected. `inject()` works inside
the factory body.

```typescript
bindFactory(() => ({ now: Date.now() }), Lifetime.TRANSIENT)
bindFactory(() => ({ db: inject(Db) }), repoToken)
```

### `bindValue(value, token, lifetime?)`

Registers an already existing value. The token is required, because a plain value cannot act as its
own key.

```typescript
bindValue({ apiUrl: 'https://example.com' }, configToken)
```

### `onDispose(cb)`

Registers a teardown hook on the active scope. The callback may return a promise; `scope.dispose()`
awaits all of them.

```typescript
class Service {
	constructor() {
		onDispose(async () => {
			await this.connection.close()
		})
	}
}
```

### `dispose()`

Disposes the currently active scope. Outside of construction that is the global scope.

```typescript
onDispose(() => console.log('Say bye!'))
dispose() // -> 'Say bye!'
```

### `new Scope(module)`

| Member                | Description                                                              |
| --------------------- | ------------------------------------------------------------------------ |
| `scope.inject(token)` | Resolve `token`, reusing the scope's cache where the lifetime allows it. |
| `scope.onDispose(cb)` | Register a teardown hook on this scope from the outside.                 |
| `scope.dispose()`     | Clear the cache and await every teardown hook. Returns `Promise<void>`.  |

A disposed scope stays usable — the next `inject` simply rebuilds its instances.

### `new Module(registrations?)`

`registrations` accepts classes, factories, `Registration`s returned by the `bind*` helpers, and
other `Module`s (whose entries are copied in). Unknown tokens throw `UnknownTokenError`.

### Errors

All of them extend `DiError`:

| Error                     | Thrown when                                                      |
| ------------------------- | ---------------------------------------------------------------- |
| `UnknownTokenError`       | the token is not registered in the module                        |
| `UnknownGlobalTokenError` | a singleton depends on something that is not registered globally |
| `CircularInjectionError`  | a dependency cycle is detected (development builds only)         |
| `DecoratorUsageError`     | a decorator is applied to the wrong kind of declaration          |
| `TokenNameError`          | a token key is empty                                             |

## Decorators

Decorators are optional sugar, written against the **ECMAScript (TC39) standard** protocol. They
also accept the legacy TypeScript protocol, detected at runtime from the arguments they receive, so
they work whether or not `experimentalDecorators` is set:

```jsonc
// tsconfig.json — standard decorators (recommended, the default since TypeScript 5)
{
	"compilerOptions": {
		"target": "ES2022",
		"experimentalDecorators": false,
	},
}
```

The two protocols differ in how a method hook is bound: the standard one registers per instance
through `context.addInitializer`, while the legacy one has no such hook, so the method is marked on
the prototype and `Scope` binds it once the instance exists. Both end up registering the same
teardown on the same scope.

### `@injectable(lifetime?)`

Registers the class in the global module, which is what makes it available to singletons and to
`inject()` calls made outside any scope.

```typescript
@injectable(Lifetime.SINGLETON)
class Db {}

@injectable()
class Service {
	db = inject(Db)
}
```

`@injectable()` registers a class _globally_; it does not add it to your `Module`. Keep listing it
in the module you resolve from.

### `@disposable`

Marks a method as a teardown hook. The hook is registered on the scope that creates the instance,
once per instance — equivalent to calling `onDispose(() => this.method())` in the constructor.

```typescript
class Service {
	@disposable
	close() {
		return this.connection.end()
	}
}

const scope = new Scope(new Module([Service]))
scope.inject(Service)
await scope.dispose() // -> close() is awaited
```

Instances built outside of any scope register their hook on the global scope, the same fallback
`inject()` uses.

## Development

This repository uses [Vite+](https://viteplus.dev), so the whole toolchain — package manager,
Vitest, Oxlint, Oxfmt and tsdown — is driven by a single `vp` CLI.

```bash
vp install    # install dependencies (pnpm, via the catalog in pnpm-workspace.yaml)
vp check      # oxfmt + oxlint + type check
vp test       # vitest
vp pack       # build dist/ with tsdown
```

Configuration for all of them lives in [`vite.config.ts`](vite.config.ts). A pre-commit hook runs
`vp check --fix` on staged files; `vp hooks disable` turns it off locally.

One constraint worth knowing: oxc implements only the legacy decorator transform, so this
repository compiles its own tests with `experimentalDecorators: true`. `src/` contains no decorator
syntax, so the published build is unaffected. `case-decorators.test.ts` covers the legacy protocol
through real `@` syntax, and `case-decorators-standard.test.ts` drives the standard protocol
directly.

## License

MIT
