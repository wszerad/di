# @wssz/di
DI (dependency injection) lib. Cross-env with optional decorator API.

## Examples

### Service testing/mocking

```typescript
import { bindFactory } from './helpers'
import { Scope } from './Scope'

@injectable(Lifetime.SINGLETON)
class Db {
	get(key: string) {
		// some db adapter
	}
}

@injectable()
class Service {
	db = inject(DB)

	userById(id: string) {
		return this.db.get(id)
	}
}

const module = new Module([
	bindFactory(
		() => ({
			get() {
				return {
					id: '123',
					name: 'John'
				}
			}
		}),
		DB
	)
])

const scope = new Scope(module)
const mockedServiceInstance = scope.inject(Service)
mockedServiceInstance.userById('any key') // -> { id: '123', name: 'John' }
```

## Functions

### inject(`token: Token<T>`)
Inject provider in current scope, need to be used on provider initialization. Used outside scope will refer to globalScope.

```typescript
function factory() {
  return {
    a: inject(Class1)
  }
}

class Example {
  a = inject(Class1)

  constructor() {
    this.b = inject(Class2)
  }
	
  method() {
    // Injection outside of scope (running in globalScope)
    const c = inject(Class3)
  }
}
```

### token(`value?: T, key?: string`): `Token<T>`
To provide type checking `token` function is available.

```typescript
import { bindFactory } from './helpers'

interface Config {
	var: string
}

const config: Config = {
	var: '123'
}

const token1 = token<Config>()
const token2 = token(config)
const token3 = token(config, 'config')

new Module([
	bindValue(config, token1),
	bindFactory(() => ({ var: '321' }), token2),
	bindValue(config, token3),
])

// all three injections has same types
class Service {
	c1 = inject(token1)
	c2 = inject(token2)
	c3 = inject(token3)
}
```

### onDispose(`() => void`)
Lifecycle dispose hook in current scope.

```typescript
class Service {
  constructor() {
    onDispose(() => {
      return new Promise(res => {
        setTimeout(res, 1000)
      })
    })
  }
}
```

### dispose()
Trigger dispose in current scope.

```typescript
import { onDispose } from './helpers'

// global scope dispose hook
onDispose(() => {
	console.log('Say bye!')
})

// global scope dispose trigger
dispose()
```

## Decorators

### @injectable()
Register class for globalModule
```ts
@injectable()
class Service {}

const serviceInstance = resolve(Service)
```

### @disposable
Mark method as onDispose

```ts
@injectable()
class Service {

  constructor() {
    // one way
    onDispose(() => this.onDispose())
  }

  // secound way
  @disposable
  onDispose() {
    console.log('disposed')
  }
}

const serviceInstance = resolve(Service)
```

## Module
Module contains available providers to resolve

### new Module(`registrations: (Provider<any> | Module)[] = []`)

```typescript
const module = new Module([
	// clone entries from other module
	otherModule,
	// declare new entries or overite if exists in otherModule
	bindClass(Service),
	// or overite if already exists
	bindClass(ServiceMock, Service)
])
``` 

## Scope
Scope contain cached providers registered () in module. Gives possibility to dispose services created in scope.

### new Scope(module: Module): `Scope`

```typescript
const module = new Mdoule()
const scope = new Scope(module)

scope.inject(Service)
```

### scope.onDispose(`cb: () => void`)
Hook triggered when scope is disposed.

```typescript
@injectable()
class Service {
  constructor() {
    // scope.onDispose but for current scope
    onDispose(() => {
      console.log('disposed')
    })
  }
}

const scope = new Scope(globalModule)
scope.onDispose(() => {
  console.log('disposed')
})
scope.dispose() // -> 'disposed'

```
### scope.inject(`token: Token<T>`): `T`
Resolve value registered in module or cached in scope if exists.

```typescript
class Service {
	// inject of current scope
	user = inject(User)
}

const module = new Module([Service])
const scope = new Scope(module)

const service = scope.inject(Service) // or module.resolve(Service, scope)
```

### scope.dispose(): `Promise<void>`
Dispose current scope, all registered onDispose hook will be triggered.

```typescript
class Service {
  constructor() {
    onDispose(() => {
      return new Promise(res => {
        setTimeout(res, 1000)
      })
    })
  }
}

const module = new Module([Service])
const scope = new Scope(module)
const service = scope.inject(Service) // create instance in cache

await scope.dispose() // wait for all onDispose hooks end
```

## Lifetime

### Lifetime.SINGLETON
Services are created outside Scopes and require globally defined dependencies (by injectable).
After resolution, instance is stored in declaration so if modules share same dependencies then will share also instance.

### Lifetime.SCOPED
Default lifetime, cached per each scope. Disposed on `scope.dispose()`

### Lifetime.TRANSIENT
Created each time when added by `inject` 