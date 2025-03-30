# @andreasnicolaou/safe — Say Goodbye to Try-Catch Blocks!

### **Tired of writing `try...catch` everywhere?**

Let `@andreasnicolaou/safe` handle it for you. This tiny, library automatically wraps your functions and promises in a safe execution environment.

## Features

- **Catch errors automatically** (No more `try...catch` spam!)
- **Works for both synchronous & asynchronous functions**
- **Customizable error logging**

## Installation

```sh
npm install @andreasnicolaou/safe
```

## Basic Usage

```typescript
import { safe, isSuccess, isFailure } from '@andreasnicolaou/safe';

const [error, result] = safe(() => {
  throw new Error('An error Occured!');
});

console.log(error); // An error Occured!
console.log(result); // undefined
console.log(isSuccess([error, result])); // false
console.log(isFailure([error, result])); // true
```

## Advanced Error Handling

```typescript
const { safe, safeWithRetries } = createSafeUtils({
  logger: (error) => sentry.captureException(error),
  logErrors: process.env.NODE_ENV === 'production',
});
```

## Architecture Benefits

- **Functional Programming Friendly**  
  Compose operations without error handling noise
- **TypeScript Optimized**  
  Full type inference and guards
- **Framework Agnostic**  
  Works with React, Node.js, Deno, etc.

## Related

- [Error Handling in TypeScript](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#unknown-on-catch-clause-bindings)
- [RxJS Error Handling](https://rxjs.dev/guide/operators#error-handling-operators)

## Contributing

Contributions are welcome! If you encounter issues or have ideas to enhance the library, feel free to submit an issue or pull request.
