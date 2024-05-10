# @wssz/di
DI (dependency injection) lib. No external dependencies, cross-env with optional decorator API.

## Examples

### Service testing/mocking

```typescript
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

const module = extendModule([
  {
    token: Db,
    useFactory: () => ({
      get() {
        return {
          id: '123',
          name: 'John'
        }
      }
    })
  }
])

const mockedServiceInstance = module.resolve(Service)
mockedServiceInstance.userById('any key') // -> { id: '123', name: 'John' }
```

### Multiple singleton scopes

```typescript
@injectable(Lifetime.SINGLETON)
class SomeSingleton {
}

const module1 = extendModule()
const module2 = extendModule()
// module1.resolve(SomeSingleton) === module2.resolve(SomeSingleton)

// copy all globaly registered providers to new parent module (different than globalModule)
const module3 = new Module([ globalModule ], true)
// module1.resolve(SomeSingleton) !== module3.resolve(SomeSingleton)
```

### Express per-request module

```typescript
const RequestToken = token<Request>()
const ResponseToken = token<Response>()

@injectable()
class User {
  // inject request object, response request or any other provider in request scope
  req = inject(RequestToken)

  constructor() {
    // handle request finish
    onDispose(() => {})
  }
}

const app = express()
app.use((req, res, next) => {
  // clone and extend module with request and response object
  const module = extendModule([
    {
      token: RequestToken,
      useValue: req
    },
    {
      token: ResponseToken,
      useValue: res
    }
  ])

  const scope = new Scope(module)
  req.user = scope.inject(User)

  res.once('finish', () => {
    scope.dispose()
  })

  next()
})
```

## Functions

### inject(`token: Token<T>`)
Inject provider in current scope, need to be used on provider initialization.

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
    // WRONG! Injection outside of scope (after initialization)
    const c = inject(Class3)
  }
}
```

### token(`value?: T, key?: string`): `Token<T>`
To provide type checking `token` function is available.

```typescript
interface Config {
  var: string
}

const config: Config = {
  var: '123'
}

const token1 = token<Config>()
const token2 = token(config)
const token3 = token(config, 'config')

extendModule([
  {
    token: token1,
    useValue: config
  },
  {
    token: token2,
    // factory result need to match Config interface
    useFactory: () => ({ var: '321' })
  },
  {
    token: token3,
    useValue: config
  }
])

// all three injections has same types
class Service {
  c1 = inject(token1)
  c2 = inject(token2)
  c3 = inject(token3)
}
```

### onDispose(`() => void`)
Lifecycle dispose hook in current scope. Triggered on scope dispose or module reset is singleton.

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

## Decorators

### @injectable()
Register class for globalModule
```ts
@injectable()
class Service {}

const serviceInstance = resolve(Service)
```

### @dispose
Mark method as onDispose

```ts
@injectable()
class Service {

  constructor() {
    // one way
    onDispose(() => this.onDispose())
  }

  // secound way
  @dispose
  onDispose() {
    console.log('disposed')
  }
}

const serviceInstance = resolve(Service)
```

## Module
Module contains available provider to resolve and new entries can be added by:
```typescript
// by "provide" method:
class Service {}
module.provide(Service)

// or by class decorator:
@module.injectable()
class Service {}
```

For factories:
```typescript
function factory() {}

// factory and class self-describes type so shot version is available:
module.provide(factory, Lifetime.SINGLETON)

// or in this way: 
module.provide({
  token: factory,
  useFactory: factory,
  lifetime: Lifetime.SINGLETON
})
```

And values:
```typescript
const value = {
  name: 's'
}

// to provide proper injection type "token" function is available.
const valueToken = token(value)

module.provide({
  token: valueToken,
  useValue: value
})
```

### new Module(`registrations: (Provider<any> | Module)[] = []`)
```typescript
const module = new Module([
  // clone entries from other module
  otherModule,
  // declare new entries or overite if exists in otherModule
  {
    token: Service,
    useClass: Service
  },
  // or overite if already exists
  {
    token: Service,
    useClass: ServiceMock
  }
])
``` 

## Scope
Scope contain cached providers registered () in module. Gives possibility to dispose services created in scope.

### new Scope(module: Module): `Scope`

```typescript
const module = new Mdoule()
const scope = new Scope(module)

// scope is created in background
module.resolve(Service)

// but can be used existing one:
module.resolve(Service, scope)
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

const module = new Module([ Service ])
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
Cache in module, each scope created from module will share state. To dispose singletons use `module.reset()`

### Lifetime.SCOPED
Default lifetime, cached per each scope. Disposed on `scope.dispose()`

### Lifetime.TRANSIENT
Created each time when added by `inject` 