# @andreasnicolaou/safe — Say Goodbye to Try-Catch Blocks!

![TypeScript](https://img.shields.io/badge/TS-TypeScript-3178c6?logo=typescript&logoColor=white)
![GitHub contributors](https://img.shields.io/github/contributors/andreasnicolaou/safe)
![GitHub License](https://img.shields.io/github/license/andreasnicolaou/safe)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/andreasnicolaou/safe/build.yaml)
![GitHub package.json version](https://img.shields.io/github/package-json/v/andreasnicolaou/safe)
[![Known Vulnerabilities](https://snyk.io/test/github/andreasnicolaou/safe/badge.svg)](https://snyk.io/test/github/andreasnicolaou/safe)
![Bundle Size](https://deno.bundlejs.com/badge?q=@andreasnicolaou/safe&treeshake=[*])

![ESLint](https://img.shields.io/badge/linter-eslint-4B32C3.svg?logo=eslint)
![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?logo=prettier)
![Jest](https://img.shields.io/badge/tested_with-jest-99424f.svg?logo=jest)
![Maintenance](https://img.shields.io/maintenance/yes/2025)
[![codecov](https://codecov.io/gh/andreasnicolaou/safe/graph/badge.svg?token=9CPNF2XE59)](https://codecov.io/gh/andreasnicolaou/safe)

![NPM Downloads](https://img.shields.io/npm/dm/%40andreasnicolaou%2Fsafe)

### **Tired of writing `try...catch` everywhere?**

Let `@andreasnicolaou/safe` handle it for you. This tiny, library automatically wraps your functions and promises in a safe execution environment.

## Features

- **No more try-catch everywhere:** Clean up your code by handling errors in one place.
- **Works with sync and async:** One API for both synchronous and asynchronous code.
- **TypeScript-first:** Full type inference and guards for safer code.
- **Customizable logging:** Plug in your own logger or error reporting.
- **Framework-agnostic:** Use in Node.js, browsers, React and more.

### Package Managers

```bash
# npm
npm install @andreasnicolaou/safe

# yarn
yarn add @andreasnicolaou/safe

# pnpm
pnpm add @andreasnicolaou/safe
```

## CDN Usage

For direct browser usage without a build step:

```html
<!-- unpkg CDN (latest version, unminified) -->
<script src="https://unpkg.com/@andreasnicolaou/safe/dist/index.umd.js"></script>

<!-- unpkg CDN (latest version, minified) -->
<script src="https://unpkg.com/@andreasnicolaou/safe/dist/index.umd.min.js"></script>

<!-- jsDelivr CDN (unminified) -->
<script src="https://cdn.jsdelivr.net/npm/@andreasnicolaou/safe/dist/index.umd.js"></script>

<!-- jsDelivr CDN (minified) -->
<script src="https://cdn.jsdelivr.net/npm/@andreasnicolaou/safe/dist/index.umd.min.js"></script>
```

The library will be available as `safe` on the global scope:

```html
<script>
  // Example: use safe utilities from the global `safe` object
  const { safe: safeFn, isSuccess, isFailure } = safe;
  const [error, result] = safeFn(() => JSON.parse('{"foo": 123}'));
  if (isSuccess([error, result])) {
    console.log('Parsed:', result);
  }
</script>
```

## Usage

You can use this library in any modern JavaScript environment:

### ESM (ECMAScript Modules)

```js
import { safe, isSuccess, isFailure } from '@andreasnicolaou/safe';

const [error, result] = safe(() => JSON.parse('{"foo": 123}'));
if (isSuccess([error, result])) {
  console.log('Parsed:', result);
}
```

### CommonJS (Node.js require)

```js
const { safe, isSuccess, isFailure } = require('@andreasnicolaou/safe');

const [error, result] = safe(() => JSON.parse('{"foo": 123}'));
if (isSuccess([error, result])) {
  console.log('Parsed:', result);
}
```

### UMD (CDN/Browser)

```html
<script src="https://unpkg.com/@andreasnicolaou/safe/dist/index.umd.min.js"></script>
<script>
  const { safe: safeFn, isSuccess, isFailure } = safe;
  const [error, result] = safeFn(() => JSON.parse('{"foo": 123}'));
  if (isSuccess([error, result])) {
    console.log('Parsed:', result);
  }
</script>
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
