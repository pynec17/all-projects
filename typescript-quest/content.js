(function () {
  "use strict";

  function ok(name, pass, detail) {
    return { name: name, pass: !!pass, detail: detail || "" };
  }

  var CHAPTERS = [
    {
      id: "basics",
      title: "The Basics",
      blurb: "What TypeScript actually is, how it relates to JavaScript, and the core building-block types: primitives, arrays, tuples, any/unknown/never, and literal types.",
      theory: [
        {
          id: "basics-1",
          type: "mc",
          prompt: "What's the biggest practical benefit TypeScript adds over plain JavaScript?",
          options: [
            "It catches many bugs — like typos and wrong argument types — while you type, before the code ever runs.",
            "It makes your code run faster in the browser.",
            "It replaces JavaScript with a completely different runtime.",
            "It automatically writes your tests for you."
          ],
          correct: 0,
          explanation: "TypeScript adds a type system checked at compile time. It doesn't change runtime speed — your code still ends up as ordinary JavaScript."
        },
        {
          id: "basics-2",
          type: "mc",
          prompt: "Before TypeScript code runs in a browser or Node, what actually happens to it?",
          options: [
            "It's compiled to plain JavaScript — the type annotations are stripped out.",
            "It's run directly by a special TypeScript engine.",
            "It's converted to WebAssembly.",
            "Nothing — the type annotations are valid JavaScript syntax too."
          ],
          correct: 0,
          explanation: "The TypeScript compiler (tsc) erases all type annotations and emits plain JS. Browsers and Node.js never see a type annotation."
        },
        {
          id: "basics-3",
          type: "mc",
          prompt: "You have a value that could be absolutely anything, and you want TypeScript to force you to check what it actually is before you use it (safer than disabling checks entirely). Which type do you give it?",
          options: ["any", "unknown", "never", "void"],
          correct: 1,
          explanation: "`any` turns off checking for that value completely. `unknown` is the safe counterpart — you must narrow it (e.g. with `typeof`) before TypeScript will let you use it as anything specific."
        },
        {
          id: "basics-4",
          type: "mc",
          prompt: "What does the `never` type represent?",
          options: [
            "A value that can never occur — e.g. the return type of a function that always throws or loops forever.",
            "A variable that has not been assigned yet.",
            "The absence of a return value, like a function with no return statement.",
            "An array that is always empty."
          ],
          correct: 0,
          explanation: "`never` is for things that literally cannot happen. Compare it to `void`, which means 'returns, but with no meaningful value' — the function still returns, it just gives you `undefined`."
        },
        {
          id: "basics-5",
          type: "mc",
          prompt: "What makes `const point: [number, number] = [3, 4];` a tuple rather than just a `number[]`?",
          options: [
            "TypeScript tracks that it has exactly two elements, and what type each specific position holds.",
            "Tuples can only ever hold numbers.",
            "It's identical to number[] — ‘tuple’ is just a naming convention.",
            "Tuples are read-only by default."
          ],
          correct: 0,
          explanation: "A `number[]` can be any length. The tuple `[number, number]` is locked to exactly two numbers, in that order — useful for fixed-shape pairs like coordinates."
        },
        {
          id: "basics-6",
          type: "mc",
          prompt: "What does TypeScript say about this code?\n```\nlet x = \"hello\";\nx = 42;\n```",
          options: [
            "Error: Type 'number' is not assignable to type 'string' — `x` was inferred as `string` from its first value.",
            "No error — `let` variables can be reassigned to anything.",
            "Error — `let` variables can't be reassigned.",
            "No error — `x` quietly becomes `string | number`."
          ],
          correct: 0,
          explanation: "Type inference locks in a variable's type from its initializer. `let` lets you reassign the value, but only to another value of the same type."
        },
        {
          id: "basics-7",
          type: "text",
          prompt: "`const status = \"active\";` — what type does TypeScript infer for `status`? Type it exactly as an editor would show it when you hover.",
          accept: ['"active"', "'active'", "active"],
          explanation: "A `const` can never change, so TypeScript infers the narrowest type possible: the literal type `\"active\"`. Write `let status = \"active\"` instead and you get the wider `string`."
        },
        {
          id: "basics-8",
          type: "mc",
          prompt: "What type does TypeScript infer for `const mixed = [1, \"two\", true];`?",
          options: [
            "`(string | number | boolean)[]`",
            "`[number, string, boolean]`",
            "`any[]`",
            "`unknown[]`"
          ],
          correct: 0,
          explanation: "Array literals are inferred as arrays of a union of their element types, not as tuples. If you want the tuple `[number, string, boolean]`, annotate it or add `as const`."
        }
      ],
      challenges: [
        {
          id: "basics-c1",
          title: "Fix the type errors",
          difficulty: "Easy",
          prompt: "This file has a few type mistakes. Fix each one so it compiles cleanly under TypeScript's strict mode, without changing what the code is trying to do.",
          starter:
'let age: number = "thirty";\n' +
'let isAdmin: boolean = 1;\n' +
'let tags: string[] = ["a", "b", 3];\n\n' +
'function shout(message: string) {\n' +
'  return message.toUpperCase();\n' +
'}\n\n' +
'const loud = shout(42);\n',
          solution:
'let age: number = 30;\n' +
'let isAdmin: boolean = true;\n' +
'let tags: string[] = ["a", "b", "c"];\n\n' +
'function shout(message: string) {\n' +
'  return message.toUpperCase();\n' +
'}\n\n' +
'const loud = shout("hello");\n',
          exposes: ["age", "isAdmin", "tags", "shout", "loud"],
          run: function (ctx) {
            var e = ctx.exports;
            return [
              ok("age is the number 30", e.age === 30, "got " + JSON.stringify(e.age)),
              ok("isAdmin is true", e.isAdmin === true, "got " + JSON.stringify(e.isAdmin)),
              ok("tags is all strings", Array.isArray(e.tags) && e.tags.every(function (t) { return typeof t === "string"; }), "got " + JSON.stringify(e.tags)),
              ok("loud is \"HELLO\"", e.loud === "HELLO", "got " + JSON.stringify(e.loud))
            ];
          }
        },
        {
          id: "basics-c2",
          title: "Narrow the unknown",
          difficulty: "Medium",
          prompt: "Write a function <code>describe(value: unknown): string</code> that returns:" +
            "<ul>" +
            '<li><code>a string: "hi"</code> for strings (with the actual value quoted)</li>' +
            "<li><code>a number: 42</code> for numbers</li>" +
            "<li><code>a boolean: true</code> for booleans</li>" +
            '<li><code>something else</code> for anything else</li>' +
            "</ul>" +
            "You'll need to narrow <code>value</code> with <code>typeof</code> checks before you can use it as a string, number, or boolean.",
          starter:
'function describe(value: unknown): string {\n' +
'  // TODO: narrow `value` with typeof checks, then build the message\n' +
'  return "something else";\n' +
'}\n',
          solution:
'function describe(value: unknown): string {\n' +
'  if (typeof value === "string") {\n' +
'    return `a string: "${value}"`;\n' +
'  }\n' +
'  if (typeof value === "number") {\n' +
'    return `a number: ${value}`;\n' +
'  }\n' +
'  if (typeof value === "boolean") {\n' +
'    return `a boolean: ${value}`;\n' +
'  }\n' +
'  return "something else";\n' +
'}\n',
          exposes: ["describe"],
          run: function (ctx) {
            var d = ctx.exports.describe;
            return [
              ok('describe("hi") is a string: "hi"', typeof d === "function" && d("hi") === 'a string: "hi"', "got " + (d && JSON.stringify(d("hi")))),
              ok("describe(42) is a number: 42", typeof d === "function" && d(42) === "a number: 42", "got " + (d && JSON.stringify(d(42)))),
              ok("describe(true) is a boolean: true", typeof d === "function" && d(true) === "a boolean: true", "got " + (d && JSON.stringify(d(true)))),
              ok("describe({}) is something else", typeof d === "function" && d({}) === "something else", "got " + (d && JSON.stringify(d({}))))
            ];
          }
        },
        {
          id: "basics-c3",
          title: "A literal union type",
          difficulty: "Easy",
          prompt: 'Define a type <code>Level</code> that only allows the strings <code>"low"</code>, <code>"medium"</code> or <code>"high"</code>. Then make <code>levelToNumber</code> return <code>1</code>, <code>2</code> or <code>3</code> for each level.',
          starter:
'// TODO: define a Level type that only allows "low", "medium" or "high"\n\n' +
'function levelToNumber(level: Level): number {\n' +
'  // TODO: return 1 for low, 2 for medium, 3 for high\n' +
'  return 0;\n' +
'}\n',
          solution:
'type Level = "low" | "medium" | "high";\n\n' +
'function levelToNumber(level: Level): number {\n' +
'  switch (level) {\n' +
'    case "low":\n' +
'      return 1;\n' +
'    case "medium":\n' +
'      return 2;\n' +
'    case "high":\n' +
'      return 3;\n' +
'  }\n' +
'}\n',
          exposes: ["levelToNumber"],
          typeTests:
'// test: Level rejects strings that are not one of the three levels\n' +
'// @ts-expect-error\n' +
'levelToNumber("extreme");\n' +
'// test: Level accepts "medium"\n' +
'levelToNumber("medium");\n',
          run: function (ctx) {
            var f = ctx.exports.levelToNumber;
            if (typeof f !== "function") return [ok("levelToNumber is defined", false)];
            return [
              ok('"low" is 1', f("low") === 1, "got " + JSON.stringify(f("low"))),
              ok('"medium" is 2', f("medium") === 2, "got " + JSON.stringify(f("medium"))),
              ok('"high" is 3', f("high") === 3, "got " + JSON.stringify(f("high")))
            ];
          }
        }
      ],
      examples: [
        {
          id: "basics-e1",
          title: "Why `any` lets bugs sneak past, and `unknown` doesn't",
          scenario: "Both of these compile. Only one of them is actually safe.",
          code:
'function totalAny(cart: any) {\n' +
'  return cart.items.length * cart.pricePerItem; // compiles, even though cart has no .items\n' +
'}\n' +
'totalAny({ total: 10 }); // runtime crash: Cannot read properties of undefined\n\n' +
'function totalUnknown(cart: unknown) {\n' +
'  if (typeof cart === "object" && cart !== null && "items" in cart) {\n' +
'    // TypeScript makes you check the shape before you can touch it\n' +
'  }\n' +
'}',
          takeaway: "`any` is a trapdoor out of the type system — TypeScript stops checking that value entirely, so mistakes only show up at runtime. `unknown` keeps the safety on: you're forced to narrow before you can use it. Prefer `unknown` for values you don't control yet (API responses, JSON.parse results, user input)."
        },
        {
          id: "basics-e2",
          title: "Literal unions vs. enums for a fixed set of options",
          scenario: "Real codebases need a type that's 'one of these specific values'. There are two common ways to write it.",
          code:
'// A plain union of string literals — common in modern code,\n' +
'// erases completely at compile time, no runtime footprint.\n' +
'type Direction = "up" | "down" | "left" | "right";\n' +
'function move(dir: Direction) { /* ... */ }\n' +
'move("up");   // ok\n' +
'move("diagonal"); // compile error\n\n' +
'// An enum — does generate a small real JS object at runtime,\n' +
'// still common in larger apps and generated API clients.\n' +
'enum Status { Active, Paused, Done }\n' +
'const s: Status = Status.Active;',
          takeaway: "Most new TypeScript code reaches for literal unions first — they're lighter weight (nothing emitted at runtime) and work great with plain strings you'd use anyway. Enums still show up a lot in existing codebases and in code generated from schemas (like OpenAPI clients), so it's worth recognizing both."
        }
      ]
    },
    {
      id: "functions",
      title: "Functions",
      blurb: "Typing parameters and return values, optional and default parameters, rest parameters, and why TypeScript insists you annotate what you take in.",
      theory: [
        {
          id: "fn-1",
          type: "mc",
          prompt: "What happens if a function parameter has no type annotation and `noImplicitAny` (part of `strict`) is turned on?",
          options: [
            "TypeScript reports an error, asking you to type it or allow it explicitly.",
            "TypeScript silently treats it as `any`.",
            "TypeScript infers it from the function's call sites automatically.",
            "It's a syntax error."
          ],
          correct: 0,
          explanation: "Without an annotation or an inferable default, TypeScript can't know the parameter's type, and `noImplicitAny` refuses to silently fall back to `any`."
        },
        {
          id: "fn-2",
          type: "mc",
          prompt: 'In `function greet(name: string, greeting: string = "Hello") {}`, what kind of parameter is `greeting`?',
          options: [
            "An optional parameter with a default value — callers can omit it.",
            "A required parameter.",
            "A rest parameter.",
            "A generic parameter."
          ],
          correct: 0,
          explanation: "Giving a parameter a default value automatically makes it optional at the call site; TypeScript infers its type from the default if you don't annotate it."
        },
        {
          id: "fn-3",
          type: "mc",
          prompt: "What's the difference between `name?: string` and `name: string | undefined` as a parameter type?",
          options: [
            "Similar for the value's type, but `name?` also makes the argument itself optional to omit at the call site.",
            "They are exactly identical in every way, including at the call site.",
            "`name?` means the parameter must be a string.",
            "`string | undefined` is not valid TypeScript syntax."
          ],
          correct: 0,
          explanation: "`name?: string` lets you leave the argument out entirely. `name: string | undefined` still requires you to pass something — even if that something is literally `undefined`."
        },
        {
          id: "fn-4",
          type: "mc",
          prompt: "Why annotate a function's return type explicitly, even though TypeScript can often infer it?",
          options: [
            "It catches mistakes if the function body accidentally returns the wrong type, especially in larger functions.",
            "It's required syntax for every function in TypeScript.",
            "It only matters for arrow functions.",
            "It changes the function's runtime behavior."
          ],
          correct: 0,
          explanation: "Return type inference is convenient, but an explicit annotation acts as a contract: if a later edit makes the body return something else by accident, you get an error right where it happened."
        },
        {
          id: "fn-5",
          type: "mc",
          prompt: "Which best describes a rest parameter, like `function sum(...nums: number[])`?",
          options: [
            "It collects any number of trailing arguments into a single array.",
            "It makes all other parameters optional.",
            "It can only be used with strings.",
            "It must be the first parameter."
          ],
          correct: 0,
          explanation: "`...nums` gathers every remaining argument into one array named `nums`, typed `number[]`. A rest parameter must come last in the parameter list."
        },
        {
          id: "fn-6",
          type: "mc",
          prompt: "What type does TypeScript infer for `const add = (a: number, b: number) => a + b;`?",
          options: [
            "`(a: number, b: number) => number`",
            "`number`",
            "`Function`",
            "`any`"
          ],
          correct: 0,
          explanation: "`add` holds a function, so its type is a function type. TypeScript infers the return type `number` from `a + b`, giving `(a: number, b: number) => number`."
        },
        {
          id: "fn-7",
          type: "mc",
          prompt: "A function that logs a message and doesn't return anything useful should normally have which return type?",
          options: ["`void`", "`never`", "`null`", "`any`"],
          correct: 0,
          explanation: "`void` means 'callers shouldn't use the return value'. Save `never` for functions that can't finish normally at all, like ones that always throw."
        },
        {
          id: "fn-8",
          type: "mc",
          prompt: "Why does this fail under strict mode?\n```\nfunction greet(name?: string) {\n  return \"Hi \" + name.toUpperCase();\n}\n```",
          options: [
            "`name` might be `undefined`, so calling `.toUpperCase()` on it isn't safe.",
            "Optional parameters can't be used in string concatenation.",
            "`toUpperCase` doesn't exist on strings.",
            "The function is missing a return type annotation."
          ],
          correct: 0,
          explanation: "An optional parameter's type is really `string | undefined`. With `strictNullChecks` on, you have to deal with `undefined` first — a default value (`name = \"friend\"`), an `if` check, or optional chaining (`name?.toUpperCase()`)."
        }
      ],
      challenges: [
        {
          id: "fn-c1",
          title: "Type the function signature",
          difficulty: "Easy",
          prompt: "Add type annotations so TypeScript knows <code>price</code> and <code>quantity</code> are numbers, <code>discount</code> is an optional number defaulting to <code>0</code>, and the function returns a number.",
          starter:
'function total(price, quantity, discount) {\n' +
'  return price * quantity * (1 - discount);\n' +
'}\n\n' +
'const a = total(10, 2);\n',
          solution:
'function total(price: number, quantity: number, discount: number = 0): number {\n' +
'  return price * quantity * (1 - discount);\n' +
'}\n\n' +
'const a = total(10, 2);\n',
          exposes: ["total", "a"],
          run: function (ctx) {
            var e = ctx.exports;
            return [
              ok("a is 20 (no discount)", e.a === 20, "got " + JSON.stringify(e.a)),
              ok("total(10, 2, 0.5) is 10 (50% off)", typeof e.total === "function" && e.total(10, 2, 0.5) === 10, "got " + (e.total && JSON.stringify(e.total(10, 2, 0.5))))
            ];
          }
        },
        {
          id: "fn-c2",
          title: "Rest parameters",
          difficulty: "Medium",
          prompt: "Write a function <code>sumAll(...nums: number[]): number</code> that returns the sum of any number of arguments (zero arguments should return <code>0</code>).",
          starter:
'function sumAll(...nums: number[]): number {\n' +
'  // TODO: return the sum of nums\n' +
'  return 0;\n' +
'}\n',
          solution:
'function sumAll(...nums: number[]): number {\n' +
'  return nums.reduce((total, n) => total + n, 0);\n' +
'}\n',
          exposes: ["sumAll"],
          run: function (ctx) {
            var f = ctx.exports.sumAll;
            return [
              ok("sumAll() is 0", typeof f === "function" && f() === 0, "got " + (f && JSON.stringify(f()))),
              ok("sumAll(1, 2, 3) is 6", typeof f === "function" && f(1, 2, 3) === 6, "got " + (f && JSON.stringify(f(1, 2, 3))))
            ];
          }
        },
        {
          id: "fn-c3",
          title: "Functions as parameters",
          difficulty: "Medium",
          prompt: "Type <code>applyTwice</code> so that <code>fn</code> is a function that takes a number and returns a number, <code>value</code> is a number, and the result is a number. Then make it actually apply <code>fn</code> twice: <code>fn(fn(value))</code>.",
          starter:
'function applyTwice(fn, value) {\n' +
'  // TODO: type the parameters and return fn(fn(value))\n' +
'  return value;\n' +
'}\n',
          solution:
'function applyTwice(fn: (n: number) => number, value: number): number {\n' +
'  return fn(fn(value));\n' +
'}\n',
          exposes: ["applyTwice"],
          typeTests:
'// test: fn only accepts functions from number to number\n' +
'// @ts-expect-error\n' +
'applyTwice((s: string) => s, 1);\n' +
'// test: the result is a number\n' +
'const __twice: number = applyTwice((n) => n + 1, 1);\n',
          run: function (ctx) {
            var f = ctx.exports.applyTwice;
            if (typeof f !== "function") return [ok("applyTwice is defined", false)];
            var doubled = f(function (n) { return n * 2; }, 3);
            var incremented = f(function (n) { return n + 1; }, 0);
            return [
              ok("applyTwice(n => n * 2, 3) is 12", doubled === 12, "got " + JSON.stringify(doubled)),
              ok("applyTwice(n => n + 1, 0) is 2", incremented === 2, "got " + JSON.stringify(incremented))
            ];
          }
        }
      ],
      examples: [
        {
          id: "fn-e1",
          title: "A typed retry helper for flaky calls",
          scenario: "Real apps wrap unreliable operations (network calls, flaky APIs) in a retry helper. Typing the callback keeps the whole thing safe.",
          code:
'async function retry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {\n' +
'  for (let i = 0; i < attempts - 1; i++) {\n' +
'    try {\n' +
'      return await fn();\n' +
'    } catch {\n' +
'      // try again\n' +
'    }\n' +
'  }\n' +
'  return fn();\n' +
'}\n\n' +
'const user = await retry(() => fetchUser(id), 3);',
          takeaway: "`fn: () => Promise<T>` says 'give me a no-argument function that resolves to some type T', and `retry` hands that same T back out. The caller gets a fully typed `user`, not `any`, even though `retry` has no idea in advance what it's retrying."
        },
        {
          id: "fn-e2",
          title: "Overloads for one function, several call shapes",
          scenario: "Sometimes the same function genuinely needs to accept different argument combinations and return different, specific types for each — overload signatures describe that precisely.",
          code:
'function createElement(tag: "img"): HTMLImageElement;\n' +
'function createElement(tag: "a"): HTMLAnchorElement;\n' +
'function createElement(tag: string): HTMLElement {\n' +
'  return document.createElement(tag);\n' +
'}\n\n' +
'const link = createElement("a"); // typed as HTMLAnchorElement, with .href etc.',
          takeaway: "Libraries like the DOM typings (and React's `createElement`) use overloads exactly like this, so that calling with a specific known tag gives you back a precisely typed element — not just a generic catch-all type."
        }
      ]
    },
    {
      id: "objects",
      title: "Objects & Interfaces",
      blurb: "Describing the shape of objects with interfaces: optional and readonly properties, index signatures, and extending one interface from another.",
      theory: [
        {
          id: "obj-1",
          type: "mc",
          prompt: "What's the main purpose of an `interface` in TypeScript?",
          options: [
            "To describe the shape (properties and types) an object must have.",
            "To create a new JavaScript runtime object.",
            "To replace classes entirely.",
            "To define enums."
          ],
          correct: 0,
          explanation: "An interface is purely a compile-time description of shape — it has no runtime presence at all once compiled."
        },
        {
          id: "obj-2",
          type: "mc",
          prompt: "What does marking a property `readonly` in an interface do?",
          options: [
            "Prevents reassigning that property after the object is created, checked at compile time.",
            "Makes the property optional.",
            "Deletes the property at runtime.",
            "Has no effect — it's just documentation."
          ],
          correct: 0,
          explanation: "`readonly` is enforced by the type checker: `obj.prop = x` becomes a compile error. Nothing stops it at runtime (plain JS has no concept of this), but the compiler catches accidental mutation for you."
        },
        {
          id: "obj-3",
          type: "mc",
          prompt: "What does `age?: number` mean inside an interface?",
          options: [
            "The property is optional — an object can omit it entirely.",
            "The property must always be a number or undefined, but can never be omitted.",
            "It's invalid syntax inside interfaces.",
            "It makes `age` readonly."
          ],
          correct: 0,
          explanation: "The `?` makes the key itself optional. An object satisfying this interface simply doesn't need an `age` key at all."
        },
        {
          id: "obj-4",
          type: "mc",
          prompt: "What does an index signature like `[key: string]: number` on an interface mean?",
          options: [
            "The object can have any number of string-keyed properties, and each one's value must be a number.",
            "Only one property named 'key' is allowed.",
            "It makes every property optional.",
            "It's used to define array types."
          ],
          correct: 0,
          explanation: "Index signatures describe open-ended objects, like a dictionary/lookup table, where you don't know the exact key names ahead of time but you do know the value type."
        },
        {
          id: "obj-5",
          type: "mc",
          prompt: "Can two `interface` declarations with the same name coexist, with their members merged automatically?",
          options: [
            "Yes — this is called declaration merging.",
            "No, TypeScript always throws a duplicate identifier error.",
            "Only if they're in the same file.",
            "Only for interfaces extending a class."
          ],
          correct: 0,
          explanation: "Interfaces (unlike `type` aliases) merge when declared more than once with the same name — commonly used to add properties to types from external libraries."
        },
        {
          id: "obj-6",
          type: "mc",
          prompt: "What happens here?\n```\ninterface Point { x: number; y: number }\nconst p: Point = { x: 1, y: 2, z: 3 };\n```",
          options: [
            "Error: object literal may only specify known properties — `z` doesn't exist on `Point`.",
            "No error — extra properties are always allowed.",
            "No error, but `z` is silently removed at runtime.",
            "`p` becomes type `any`."
          ],
          correct: 0,
          explanation: "This is an 'excess property check'. It only applies to fresh object literals, where an extra key is almost always a typo. Assigning an existing variable that happens to have extra properties is allowed."
        },
        {
          id: "obj-7",
          type: "mc",
          prompt: "TypeScript's type system is 'structural'. What does that mean?",
          options: [
            "Two types are compatible if their shapes match, regardless of what they're named.",
            "Types must have the same name to be compatible.",
            "Every object has to be created from a class.",
            "Types are checked at runtime as well as compile time."
          ],
          correct: 0,
          explanation: "If an object has every property a type requires (with the right types), it satisfies that type — no `implements` or shared name needed. This is sometimes called 'duck typing, checked at compile time'."
        },
        {
          id: "obj-8",
          type: "text",
          prompt: "Which keyword makes one interface inherit all the properties of another, as in `interface Dog ___ Animal { breed: string }`?",
          accept: ["extends"],
          explanation: "`interface Dog extends Animal` gives Dog everything Animal has, plus its own extra properties. An interface can even extend several others at once: `extends A, B`."
        }
      ],
      challenges: [
        {
          id: "obj-c1",
          title: "Model a User",
          difficulty: "Easy",
          prompt: "Define an interface <code>User</code> with <code>id</code> (number), <code>name</code> (string), <code>email</code> (string), and an optional <code>age</code> (number). Then write <code>describeUser(user: User): string</code> that returns <code>\"Name (email)\"</code>, or <code>\"Name, age (email)\"</code> when age is provided.",
          starter:
'// TODO: define the User interface\n\n' +
'function describeUser(user: User): string {\n' +
'  // TODO\n' +
'  return "";\n' +
'}\n',
          solution:
'interface User {\n' +
'  id: number;\n' +
'  name: string;\n' +
'  email: string;\n' +
'  age?: number;\n' +
'}\n\n' +
'function describeUser(user: User): string {\n' +
'  if (user.age !== undefined) {\n' +
'    return `${user.name}, ${user.age} (${user.email})`;\n' +
'  }\n' +
'  return `${user.name} (${user.email})`;\n' +
'}\n',
          exposes: ["describeUser"],
          run: function (ctx) {
            var f = ctx.exports.describeUser;
            var r1 = typeof f === "function" ? f({ id: 1, name: "Ada", email: "a@x.com" }) : undefined;
            var r2 = typeof f === "function" ? f({ id: 2, name: "Bo", email: "b@x.com", age: 30 }) : undefined;
            return [
              ok("without age", r1 === "Ada (a@x.com)", "got " + JSON.stringify(r1)),
              ok("with age", r2 === "Bo, 30 (b@x.com)", "got " + JSON.stringify(r2))
            ];
          }
        },
        {
          id: "obj-c2",
          title: "Readonly config",
          difficulty: "Medium",
          prompt: "Define an interface <code>Config</code> with readonly properties <code>apiUrl</code> (string) and <code>timeoutMs</code> (number). Write <code>withTimeout(config: Config, timeoutMs: number): Config</code> that returns a <em>new</em> config with the given timeout, without mutating the original.",
          starter:
'// TODO: define the readonly Config interface\n\n' +
'function withTimeout(config: Config, timeoutMs: number): Config {\n' +
'  // TODO: return a new object, don\'t mutate config\n' +
'  return config;\n' +
'}\n',
          solution:
'interface Config {\n' +
'  readonly apiUrl: string;\n' +
'  readonly timeoutMs: number;\n' +
'}\n\n' +
'function withTimeout(config: Config, timeoutMs: number): Config {\n' +
'  return { ...config, timeoutMs };\n' +
'}\n',
          exposes: ["withTimeout"],
          run: function (ctx) {
            var f = ctx.exports.withTimeout;
            var c = { apiUrl: "x", timeoutMs: 1000 };
            var c2 = typeof f === "function" ? f(c, 5000) : null;
            return [
              ok("original is untouched", c.timeoutMs === 1000, "got " + JSON.stringify(c)),
              ok("new config has the new timeout", !!c2 && c2.timeoutMs === 5000, "got " + JSON.stringify(c2)),
              ok("new config kept apiUrl", !!c2 && c2.apiUrl === "x", "got " + JSON.stringify(c2)),
              ok("a genuinely new object was returned", c2 !== c)
            ];
          }
        },
        {
          id: "obj-c3",
          title: "A dictionary with an index signature",
          difficulty: "Medium",
          prompt: "Define an interface <code>Inventory</code> with an index signature: any string key, number values. Then write <code>addStock(inv, item, qty)</code> that returns a <em>new</em> inventory with <code>qty</code> added to that item (items that aren't there yet start at 0).",
          starter:
'// TODO: define Inventory with an index signature (string keys, number values)\n\n' +
'function addStock(inv: Inventory, item: string, qty: number): Inventory {\n' +
'  // TODO: return a NEW inventory with qty added to item\n' +
'  return inv;\n' +
'}\n',
          solution:
'interface Inventory {\n' +
'  [item: string]: number;\n' +
'}\n\n' +
'function addStock(inv: Inventory, item: string, qty: number): Inventory {\n' +
'  return { ...inv, [item]: (inv[item] ?? 0) + qty };\n' +
'}\n',
          exposes: ["addStock"],
          typeTests:
'// test: Inventory values must be numbers\n' +
'// @ts-expect-error\n' +
'const __badInventory: Inventory = { apples: "lots" };\n' +
'// test: Inventory accepts any string key\n' +
'const __goodInventory: Inventory = { apples: 3, pears: 0 };\n',
          run: function (ctx) {
            var f = ctx.exports.addStock;
            if (typeof f !== "function") return [ok("addStock is defined", false)];
            var original = { apples: 2 };
            var more = f(original, "apples", 3);
            var fresh = f({}, "pears", 1);
            return [
              ok("adds to an existing item", more.apples === 5, "got " + JSON.stringify(more)),
              ok("new items start at 0", fresh.pears === 1, "got " + JSON.stringify(fresh)),
              ok("the original inventory is untouched", original.apples === 2 && more !== original, "got " + JSON.stringify(original))
            ];
          }
        }
      ],
      examples: [
        {
          id: "obj-e1",
          title: "`interface` vs. `type` for an object shape",
          scenario: "Both of these describe the exact same object shape — the choice between them is mostly convention, with a couple of real differences.",
          code:
'interface Point { x: number; y: number; }\n' +
'type PointAlias = { x: number; y: number };\n\n' +
'interface Point { z?: number; } // merges in, Point now has an optional z\n' +
'// type PointAlias { z?: number } // — error, type aliases can\'t merge',
          takeaway: "Interfaces can be extended and merged, which makes them the common default for public object shapes (especially ones a library's users might augment). `type` aliases are required once you need a union, tuple, or mapped type — interfaces can't express those directly."
        },
        {
          id: "obj-e2",
          title: "Sharing a base shape with `extends`",
          scenario: "Real APIs often share common fields (an id, timestamps) across many resource types.",
          code:
'interface BaseEntity {\n' +
'  id: number;\n' +
'  createdAt: string;\n' +
'}\n\n' +
'interface Invoice extends BaseEntity {\n' +
'  amount: number;\n' +
'  paid: boolean;\n' +
'}\n\n' +
'const invoice: Invoice = { id: 1, createdAt: "2026-01-01", amount: 99, paid: false };',
          takeaway: "`extends` lets `Invoice` inherit every field from `BaseEntity` and add its own, so the shared shape (id, createdAt) is defined once and reused across every resource type in a real API client."
        }
      ]
    },
    {
      id: "classes",
      title: "Classes & OOP",
      blurb: "Access modifiers, constructor shorthand, implementing interfaces, and abstract classes — TypeScript's extra layer on top of JavaScript's classes.",
      theory: [
        {
          id: "cls-1",
          type: "mc",
          prompt: "What do the `public`, `private`, and `protected` keywords control on a class member?",
          options: [
            "Where the member can be accessed from: anywhere, only inside the class, or inside the class and its subclasses.",
            "The member's runtime value.",
            "Whether the member is static.",
            "Whether TypeScript emits the member to JavaScript at all."
          ],
          correct: 0,
          explanation: "`public` (the default) is accessible anywhere, `private` only inside the declaring class, `protected` inside the class and subclasses. These checks exist only at compile time."
        },
        {
          id: "cls-2",
          type: "mc",
          prompt: "What does `implements` do when a class says `class Dog implements Animal`?",
          options: [
            "It tells TypeScript to check that Dog has all the members Animal's interface requires — a compile-time contract, not inheritance.",
            "It copies Animal's method implementations into Dog.",
            "It makes Dog's instances also instances of Animal at runtime.",
            "It's identical to `extends`."
          ],
          correct: 0,
          explanation: "`implements` is purely a type-level promise: 'this class will have everything this interface requires.' Dog still has to write its own implementation of every member."
        },
        {
          id: "cls-3",
          type: "mc",
          prompt: "What's true about an `abstract class`?",
          options: [
            "It can't be instantiated directly, and can declare abstract methods that subclasses must implement.",
            "It can never have any implemented methods.",
            "It compiles to a JavaScript interface.",
            "It's the same as a regular class with no differences."
          ],
          correct: 0,
          explanation: "Abstract classes can mix concrete methods with abstract ones (signature only, no body) that every subclass must fill in. `new Shape()` on an abstract `Shape` is a compile error."
        },
        {
          id: "cls-4",
          type: "mc",
          prompt: "What does `constructor(private name: string) {}` do?",
          options: [
            "A shorthand that both declares a `private name` property and assigns the constructor argument to it, in one step.",
            "It makes `name` a static property.",
            "It's invalid — constructors can't have modifiers on parameters.",
            "It makes the constructor itself private."
          ],
          correct: 0,
          explanation: "This is TypeScript's 'parameter property' shorthand. Without it you'd write `name: string` in the constructor signature plus `this.name = name;` in the body yourself."
        },
        {
          id: "cls-5",
          type: "mc",
          prompt: "What's the key difference between an interface and a class for defining a shape?",
          options: [
            "An interface is purely a compile-time type with no runtime presence; a class also generates real runtime JavaScript (a constructor function).",
            "They're exactly the same thing with different keywords.",
            "Interfaces can have method implementations, classes can't.",
            "Classes are erased at compile time just like interfaces."
          ],
          correct: 0,
          explanation: "A class is both a type (you can write `x: MyClass`) and a value (you can write `new MyClass()`). An interface is only ever a type — it disappears entirely once compiled."
        },
        {
          id: "cls-6",
          type: "mc",
          prompt: "What does the `readonly` modifier on a class property do?",
          options: [
            "The property can be set where it's declared or in the constructor, but never after that.",
            "The property can never be assigned at all.",
            "It makes the property static.",
            "It makes the property private."
          ],
          correct: 0,
          explanation: "`readonly` properties get their value once — at the declaration or inside the constructor — and are locked after that. Great for IDs and other values that should never change."
        },
        {
          id: "cls-7",
          type: "mc",
          prompt: "What is a `static` class member?",
          options: [
            "A member that belongs to the class itself rather than each instance, accessed as `ClassName.member`.",
            "A member whose value can't change.",
            "A private member.",
            "A member that only subclasses can use."
          ],
          correct: 0,
          explanation: "Static members are shared: there's one copy on the class, not one per object. They're common for counters, caches, and factory methods like `User.fromJson(...)`."
        },
        {
          id: "cls-8",
          type: "mc",
          prompt: "Which line is a compile error?\n```\nclass Animal {\n  protected name: string;\n  constructor(name: string) { this.name = name; }\n}\nclass Dog extends Animal {\n  bark() { return this.name + \" says woof\"; }\n}\nconst d = new Dog(\"Rex\");\nd.name;\n```",
          options: [
            "`d.name;` — protected members can't be read from outside the class and its subclasses.",
            "`this.name` inside `Dog` — subclasses can't see protected members.",
            "`new Dog(\"Rex\")` — Dog doesn't define its own constructor.",
            "None of them — it all compiles."
          ],
          correct: 0,
          explanation: "`protected` sits between `public` and `private`: Dog can use `this.name` because it's a subclass, but code outside the class hierarchy can't touch it. Dog also inherits Animal's constructor automatically."
        }
      ],
      challenges: [
        {
          id: "cls-c1",
          title: "A class with access control",
          difficulty: "Easy",
          prompt: "Write a class <code>BankAccount</code> with a private <code>balance</code> set from the constructor, a public <code>deposit(amount: number): void</code>, a public <code>withdraw(amount: number): void</code> that never lets the balance go below 0 (ignore the withdrawal instead), and a public <code>getBalance(): number</code>.",
          starter:
'class BankAccount {\n' +
'  // TODO: private balance, constructor, deposit, withdraw, getBalance\n' +
'}\n',
          solution:
'class BankAccount {\n' +
'  private balance: number;\n\n' +
'  constructor(initialBalance: number) {\n' +
'    this.balance = initialBalance;\n' +
'  }\n\n' +
'  deposit(amount: number): void {\n' +
'    this.balance += amount;\n' +
'  }\n\n' +
'  withdraw(amount: number): void {\n' +
'    if (amount <= this.balance) {\n' +
'      this.balance -= amount;\n' +
'    }\n' +
'  }\n\n' +
'  getBalance(): number {\n' +
'    return this.balance;\n' +
'  }\n' +
'}\n',
          exposes: ["BankAccount"],
          run: function (ctx) {
            var BankAccount = ctx.exports.BankAccount;
            if (typeof BankAccount !== "function") {
              return [ok("BankAccount is defined", false)];
            }
            var acc = new BankAccount(100);
            acc.deposit(50);
            var afterDeposit = acc.getBalance();
            acc.withdraw(300);
            var afterBigWithdraw = acc.getBalance();
            acc.withdraw(100);
            var afterWithdraw = acc.getBalance();
            return [
              ok("deposit adds to the balance", afterDeposit === 150, "got " + afterDeposit),
              ok("an over-large withdrawal is ignored", afterBigWithdraw === 150, "got " + afterBigWithdraw),
              ok("a valid withdrawal subtracts", afterWithdraw === 50, "got " + afterWithdraw)
            ];
          }
        },
        {
          id: "cls-c2",
          title: "Abstract base class",
          difficulty: "Medium",
          prompt: "Define an abstract class <code>Shape</code> with an abstract method <code>area(): number</code>. Write <code>Rectangle extends Shape</code> with a constructor taking <code>width</code> and <code>height</code>, implementing <code>area()</code> as width &times; height.",
          starter:
'abstract class Shape {\n' +
'  // TODO: abstract area method\n' +
'}\n\n' +
'class Rectangle extends Shape {\n' +
'  // TODO\n' +
'}\n',
          solution:
'abstract class Shape {\n' +
'  abstract area(): number;\n' +
'}\n\n' +
'class Rectangle extends Shape {\n' +
'  constructor(private width: number, private height: number) {\n' +
'    super();\n' +
'  }\n\n' +
'  area(): number {\n' +
'    return this.width * this.height;\n' +
'  }\n' +
'}\n',
          exposes: ["Shape", "Rectangle"],
          run: function (ctx) {
            var Shape = ctx.exports.Shape;
            var Rectangle = ctx.exports.Rectangle;
            if (typeof Rectangle !== "function") {
              return [ok("Rectangle is defined", false)];
            }
            var r = new Rectangle(3, 4);
            return [
              ok("area() computes width * height", r.area() === 12, "got " + r.area()),
              ok("Rectangle is a Shape", typeof Shape === "function" && r instanceof Shape)
            ];
          }
        },
        {
          id: "cls-c3",
          title: "Static and readonly",
          difficulty: "Medium",
          prompt: "Write a class <code>Ticket</code> with a <code>static count</code> (a number starting at 0, shared by every ticket) and a <code>readonly id</code>. Each new ticket increments <code>Ticket.count</code> and uses it as its id, so the first ticket gets id <code>1</code>, the second <code>2</code>, and so on.",
          starter:
'class Ticket {\n' +
'  // TODO: a static count shared by every Ticket, starting at 0\n' +
'  // TODO: a readonly id, set in the constructor (first ticket gets 1)\n' +
'}\n',
          solution:
'class Ticket {\n' +
'  static count: number = 0;\n' +
'  readonly id: number;\n\n' +
'  constructor() {\n' +
'    Ticket.count += 1;\n' +
'    this.id = Ticket.count;\n' +
'  }\n' +
'}\n',
          exposes: ["Ticket"],
          typeTests:
'// test: id is readonly, so it cannot be reassigned\n' +
'const __ticket = new Ticket();\n' +
'// @ts-expect-error\n' +
'__ticket.id = 5;\n' +
'// test: id is a number\n' +
'const __ticketId: number = __ticket.id;\n',
          run: function (ctx) {
            var Ticket = ctx.exports.Ticket;
            if (typeof Ticket !== "function") return [ok("Ticket is defined", false)];
            var t1 = new Ticket();
            var t2 = new Ticket();
            return [
              ok("first ticket has id 1", t1.id === 1, "got " + JSON.stringify(t1.id)),
              ok("second ticket has id 2", t2.id === 2, "got " + JSON.stringify(t2.id)),
              ok("Ticket.count is 2", Ticket.count === 2, "got " + JSON.stringify(Ticket.count))
            ];
          }
        }
      ],
      examples: [
        {
          id: "cls-e1",
          title: "Constructor-injected services",
          scenario: "Backend TypeScript frameworks (NestJS and similar) lean heavily on the parameter-property shorthand to wire dependencies.",
          code:
'class OrderService {\n' +
'  constructor(private db: Database, private logger: Logger) {}\n\n' +
'  async placeOrder(id: string) {\n' +
'    this.logger.log(`placing order ${id}`);\n' +
'    return this.db.save(id);\n' +
'  }\n' +
'}',
          takeaway: "`private db: Database` in the constructor saves writing a separate property declaration and assignment — very common in real backend code where classes receive their dependencies (database, logger, config) up front."
        },
        {
          id: "cls-e2",
          title: "One interface, two swappable implementations",
          scenario: "Real apps often need to swap an implementation behind the same interface — a real logger in production, a silent one in tests.",
          code:
'interface Logger {\n' +
'  log(message: string): void;\n' +
'}\n\n' +
'class ConsoleLogger implements Logger {\n' +
'  log(message: string) { console.log(message); }\n' +
'}\n\n' +
'class SilentLogger implements Logger {\n' +
'  log(_message: string) { /* no-op, used in tests */ }\n' +
'}\n\n' +
'function run(logger: Logger) { logger.log("started"); }',
          takeaway: "`run` only cares that it got something satisfying `Logger` — it doesn't know or care which concrete class it received. This is the whole point of coding to an interface: the implementation can change without touching the code that uses it."
        }
      ]
    },
    {
      id: "generics",
      title: "Generics",
      blurb: "Writing functions, classes, and types that work with many types while keeping real type information, instead of flattening everything to `any`.",
      theory: [
        {
          id: "gen-1",
          type: "mc",
          prompt: "What problem do generics solve?",
          options: [
            "Writing a function or type once that works with many types, while still keeping the specific type information (not falling back to `any`).",
            "Making a function run faster.",
            "Allowing a function to accept any number of arguments.",
            "Hiding a value's type completely."
          ],
          correct: 0,
          explanation: "Generics let you parameterize a type the way a function parameterizes a value — you decide T when you use the function, not when you write it."
        },
        {
          id: "gen-2",
          type: "mc",
          prompt: "In `function identity<T>(value: T): T { return value; }`, what is `T`?",
          options: [
            "A type parameter — a placeholder filled in with the actual type each time the function is called.",
            "A regular variable.",
            "A built-in TypeScript type.",
            "An interface."
          ],
          correct: 0,
          explanation: "Calling `identity(5)` fills T in as `number`; calling `identity(\"x\")` fills it in as `string`. Each call can infer a different T."
        },
        {
          id: "gen-3",
          type: "mc",
          prompt: "What does `function first<T>(items: T[]): T | undefined` give you that `function first(items: any[]): any` doesn't?",
          options: [
            "Calling it on a string[] gives back `string | undefined`, not just `any` — you keep real type information through the call.",
            "Nothing, any and generics behave identically here.",
            "It only works with number arrays.",
            "It forces every array to have at least one element."
          ],
          correct: 0,
          explanation: "With `any`, the result's type is `any` no matter what you passed in — all the information is lost. The generic version carries the actual element type all the way through."
        },
        {
          id: "gen-4",
          type: "mc",
          prompt: "What does `<T extends { id: number }>` mean on a generic type parameter?",
          options: [
            "T can be any type, as long as it has at least an `id: number` property — a generic constraint.",
            "T must be exactly `{ id: number }` and nothing else.",
            "It's invalid syntax.",
            "It means T defaults to `number`."
          ],
          correct: 0,
          explanation: "`extends` on a type parameter constrains what T is allowed to be, without pinning it to one exact type. Any object with at least a numeric `id` qualifies."
        },
        {
          id: "gen-5",
          type: "mc",
          prompt: "What's a generic class or interface, like `Box<T>`?",
          options: [
            "A type that holds a value of some type T, decided when you use Box — e.g. `Box<string>` or `Box<number>`.",
            "A class that can only ever store boxes.",
            "Shorthand for `any`.",
            "A way to make a class abstract."
          ],
          correct: 0,
          explanation: "`Box<T>` is a template: `Box<string>` is a box of strings, `Box<User>` is a box of Users, all sharing the same implementation."
        },
        {
          id: "gen-6",
          type: "mc",
          prompt: "When you call `identity(\"hello\")` for `function identity<T>(value: T): T`, how does TypeScript decide what `T` is?",
          options: [
            "It infers `T` from the argument you passed, so you rarely need to write `identity<string>(...)` yourself.",
            "You must always write the type explicitly, like `identity<string>(...)`.",
            "`T` defaults to `any`.",
            "`T` is always `unknown`."
          ],
          correct: 0,
          explanation: "Generic type arguments are usually inferred from the values you pass in. Writing them explicitly is only needed when there's nothing to infer from, or you want to force a specific type."
        },
        {
          id: "gen-7",
          type: "mc",
          prompt: "What does `Array<string>` mean?",
          options: [
            "Exactly the same as `string[]` — it's the built-in generic `Array` type with `T = string`.",
            "An array of arrays of strings.",
            "A tuple containing one string.",
            "A string that behaves like an array."
          ],
          correct: 0,
          explanation: "`string[]` is just shorthand for `Array<string>`. Seeing it written the long way makes it clear that arrays are one of the generic types you use all the time."
        },
        {
          id: "gen-8",
          type: "mc",
          prompt: "An `async` function's return type is `Promise<number>`. What does that tell you?",
          options: [
            "When you `await` it, you get a `number`.",
            "It returns a `number` immediately, without waiting.",
            "The promise can resolve to any type.",
            "The function takes a `number` argument."
          ],
          correct: 0,
          explanation: "`Promise<T>` is generic over the value it eventually resolves to. `async` functions always return a promise, so `async function f(): Promise<number>` gives you a number once awaited."
        }
      ],
      challenges: [
        {
          id: "gen-c1",
          title: "A generic wrapping helper",
          difficulty: "Easy",
          prompt: "Write a generic function <code>wrapInArray&lt;T&gt;(value: T): T[]</code> that returns a one-element array containing the value, preserving its type.",
          starter:
'function wrapInArray(value) {\n' +
'  // TODO: make this generic and return [value]\n' +
'  return [value];\n' +
'}\n',
          solution:
'function wrapInArray<T>(value: T): T[] {\n' +
'  return [value];\n' +
'}\n',
          exposes: ["wrapInArray"],
          typeTests:
'// test: wrapInArray(5) is typed number[]\n' +
'const __wrapped: number[] = wrapInArray(5);\n' +
'// test: wrapInArray(5) is not loosely typed (e.g. any[])\n' +
'// @ts-expect-error\n' +
'const __wrongWrap: string[] = wrapInArray(5);\n',
          run: function (ctx) {
            var f = ctx.exports.wrapInArray;
            if (typeof f !== "function") return [ok("wrapInArray is defined", false)];
            return [
              ok("wrapInArray(5) is [5]", JSON.stringify(f(5)) === "[5]", "got " + JSON.stringify(f(5))),
              ok('wrapInArray("x") is ["x"]', JSON.stringify(f("x")) === '["x"]', "got " + JSON.stringify(f("x")))
            ];
          }
        },
        {
          id: "gen-c2",
          title: "Generic constraint with keyof",
          difficulty: "Medium",
          prompt: "Write a generic function <code>getProperty&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K]</code> that returns the value at <code>key</code> on <code>obj</code>, fully typed.",
          starter:
'function getProperty(obj, key) {\n' +
'  // TODO: make this generic, constrained so `key` must be a real key of `obj`\n' +
'  return obj[key];\n' +
'}\n',
          solution:
'function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {\n' +
'  return obj[key];\n' +
'}\n',
          exposes: ["getProperty"],
          typeTests:
'// test: key must be a real key of obj\n' +
'// @ts-expect-error\n' +
'getProperty({ a: 1 }, "b");\n' +
'// test: the return type matches the property type\n' +
'const __propValue: number = getProperty({ a: 1 }, "a");\n' +
'// @ts-expect-error\n' +
'const __wrongProp: string = getProperty({ a: 1 }, "a");\n',
          run: function (ctx) {
            var f = ctx.exports.getProperty;
            if (typeof f !== "function") return [ok("getProperty is defined", false)];
            var p = { name: "Ada", age: 30 };
            return [
              ok('getProperty(p, "name") is "Ada"', f(p, "name") === "Ada", "got " + JSON.stringify(f(p, "name"))),
              ok('getProperty(p, "age") is 30', f(p, "age") === 30, "got " + JSON.stringify(f(p, "age")))
            ];
          }
        },
        {
          id: "gen-c3",
          title: "A generic Stack class",
          difficulty: "Medium",
          prompt: "Write a generic class <code>Stack&lt;T&gt;</code> with:" +
            "<ul>" +
            "<li><code>push(item: T): void</code></li>" +
            "<li><code>pop(): T | undefined</code> &mdash; removes and returns the top item</li>" +
            "<li><code>peek(): T | undefined</code> &mdash; returns the top item without removing it</li>" +
            "<li><code>size(): number</code></li>" +
            "</ul>",
          starter:
'class Stack {\n' +
'  // TODO: make this generic (Stack<T>) with push, pop, peek and size\n' +
'}\n',
          solution:
'class Stack<T> {\n' +
'  private items: T[] = [];\n\n' +
'  push(item: T): void {\n' +
'    this.items.push(item);\n' +
'  }\n\n' +
'  pop(): T | undefined {\n' +
'    return this.items.pop();\n' +
'  }\n\n' +
'  peek(): T | undefined {\n' +
'    return this.items[this.items.length - 1];\n' +
'  }\n\n' +
'  size(): number {\n' +
'    return this.items.length;\n' +
'  }\n' +
'}\n',
          exposes: ["Stack"],
          typeTests:
'// test: Stack is generic, and a Stack<number> only accepts numbers\n' +
'const __stack = new Stack<number>();\n' +
'// @ts-expect-error\n' +
'__stack.push("nope");\n' +
'// test: pop() returns T | undefined\n' +
'const __popped: number | undefined = __stack.pop();\n' +
'// @ts-expect-error\n' +
'const __poppedWrong: string | undefined = __stack.pop();\n',
          run: function (ctx) {
            var Stack = ctx.exports.Stack;
            if (typeof Stack !== "function") return [ok("Stack is defined", false)];
            var s = new Stack();
            s.push(1);
            s.push(2);
            var peeked = s.peek();
            var sizeAfterPush = s.size();
            var first = s.pop();
            var second = s.pop();
            var third = s.pop();
            return [
              ok("peek() shows the last item pushed", peeked === 2, "got " + JSON.stringify(peeked)),
              ok("size() counts the items", sizeAfterPush === 2, "got " + JSON.stringify(sizeAfterPush)),
              ok("pop() returns items last-in, first-out", first === 2 && second === 1, "got " + JSON.stringify([first, second])),
              ok("pop() on an empty stack returns undefined", third === undefined, "got " + JSON.stringify(third))
            ];
          }
        }
      ],
      examples: [
        {
          id: "gen-e1",
          title: "A generic API response wrapper",
          scenario: "Real API clients wrap every response in the same envelope, but the payload type differs per endpoint.",
          code:
'interface ApiResponse<T> {\n' +
'  data: T;\n' +
'  error: string | null;\n' +
'}\n\n' +
'async function getUser(id: number): Promise<ApiResponse<User>> {\n' +
'  const res = await fetch(`/api/users/${id}`);\n' +
'  return res.json();\n' +
'}\n\n' +
'const result = await getUser(1);\n' +
'result.data.name; // typed as string, from User',
          takeaway: "`ApiResponse<T>` is written once and reused for every endpoint — `ApiResponse<User>`, `ApiResponse<Invoice[]>`, and so on — instead of duplicating the `{ data, error }` envelope shape for each one."
        },
        {
          id: "gen-e2",
          title: "A generic in-memory repository",
          scenario: "Many backend codebases have a small generic base class for 'a collection of things with an id', reused across every resource type.",
          code:
'class Repository<T extends { id: number }> {\n' +
'  private items: T[] = [];\n\n' +
'  add(item: T): void {\n' +
'    this.items.push(item);\n' +
'  }\n\n' +
'  findById(id: number): T | undefined {\n' +
'    return this.items.find((item) => item.id === id);\n' +
'  }\n' +
'}\n\n' +
'const users = new Repository<User>();',
          takeaway: "The constraint `T extends { id: number }` is what lets `findById` compare `item.id` safely — TypeScript knows every T has an id, no matter which concrete type `Repository` gets used with."
        }
      ]
    },
    {
      id: "unions",
      title: "Unions, Narrowing & Guards",
      blurb: "Values that can be one of several types, the checks that let you safely use them, and discriminated unions — one of TypeScript's most useful real-world patterns.",
      theory: [
        {
          id: "un-1",
          type: "mc",
          prompt: "What does `type Id = string | number;` mean?",
          options: [
            "A value of type Id can be EITHER a string or a number — a union type.",
            "Id must be both a string and a number at once.",
            "It's a tuple of a string and a number.",
            "It's invalid — unions can't mix types."
          ],
          correct: 0,
          explanation: "A union type (`|`) says 'one of these'. An intersection type (`&`) is the one that means 'all of these at once'."
        },
        {
          id: "un-2",
          type: "mc",
          prompt: 'Before calling `.toUpperCase()` on a value typed `string | number`, what must you do?',
          options: [
            'Narrow the type first, e.g. with a `typeof value === "string"` check, so TypeScript knows it\'s safely a string in that branch.',
            "Nothing, TypeScript allows calling any method on a union.",
            "Cast it to `any`.",
            "Convert the union to an intersection."
          ],
          correct: 0,
          explanation: "TypeScript only allows operations valid for every member of the union, unless you narrow first. `.toUpperCase()` doesn't exist on `number`, so it's blocked until you prove which branch you're in."
        },
        {
          id: "un-3",
          type: "mc",
          prompt: "What is a 'discriminated union'?",
          options: [
            "A union of object types that all share a common literal property (like `kind`) you can switch on to safely narrow which variant you have.",
            "Any union type that includes `undefined`.",
            "A union that can't be narrowed.",
            "Another name for an enum."
          ],
          correct: 0,
          explanation: 'Each member has a shared "tag" property with a distinct literal value. Checking that one property (e.g. `shape.kind === "circle"`) lets TypeScript narrow the rest of the object\'s shape automatically.'
        },
        {
          id: "un-4",
          type: "mc",
          prompt: "What does a user-defined type guard function like `function isString(x: unknown): x is string` do?",
          options: [
            "Tells TypeScript that, when this function returns true, it can narrow `x` to `string` in the calling code.",
            "Converts x into a string at runtime.",
            "Is purely a JSDoc comment with no effect.",
            "Only works on interfaces, not primitives."
          ],
          correct: 0,
          explanation: "The `x is string` return type is a type predicate — it teaches the type checker how to narrow based on this specific function's result, anywhere it's called."
        },
        {
          id: "un-5",
          type: "mc",
          prompt: "What does an intersection type `type Combined = A & B` mean, compared to a union?",
          options: [
            "A value of type Combined must satisfy BOTH A and B at once (have all their members), unlike a union which only needs one.",
            "It's identical to `A | B`.",
            "It picks whichever of A or B is smaller.",
            "Intersections only work with primitive types."
          ],
          correct: 0,
          explanation: "Intersections are most often used to combine several object shapes into one that has every property from each."
        },
        {
          id: "un-6",
          type: "mc",
          prompt: "What does `strictNullChecks` (part of `strict`) change?",
          options: [
            "`null` and `undefined` are no longer allowed everywhere — you have to include them explicitly, e.g. `string | null`.",
            "`null` becomes a syntax error.",
            "Every variable must be initialized to `null`.",
            "It removes `undefined` from JavaScript."
          ],
          correct: 0,
          explanation: "Without it, `null` and `undefined` sneak into every type, which is where most 'cannot read properties of undefined' crashes come from. With it, a `string` is really always a string."
        },
        {
          id: "un-7",
          type: "mc",
          prompt: "What is the type of `x` in each branch?\n```\nfunction len(x: string | string[]) {\n  if (Array.isArray(x)) {\n    return x.length; // here?\n  }\n  return x.length;   // and here?\n}\n```",
          options: [
            "`string[]` in the first branch, `string` in the second.",
            "`string | string[]` in both.",
            "`any` in both.",
            "`string[]` in both."
          ],
          correct: 0,
          explanation: "`Array.isArray` is a built-in type guard. Inside the `if`, TypeScript knows `x` is the array. After the `if` returns, the only possibility left is `string` — this is called control-flow narrowing."
        },
        {
          id: "un-8",
          type: "mc",
          prompt: "Why do people assign the value to a `never` variable in a `switch`'s `default` case (an 'exhaustiveness check')?",
          options: [
            "If someone later adds a new variant to the union and forgets to handle it, that assignment becomes a compile error.",
            "It makes the switch statement run faster.",
            "It catches errors at runtime.",
            "`switch` requires it in TypeScript."
          ],
          correct: 0,
          explanation: "When every case is handled, the value in `default` has been narrowed down to `never`, so the assignment is fine. Add a new, unhandled variant and it no longer narrows to `never` — the compiler points you straight at the switch you forgot to update."
        }
      ],
      challenges: [
        {
          id: "un-c1",
          title: "Narrow a union with typeof",
          difficulty: "Easy",
          prompt: 'Write <code>formatId(id: string | number): string</code> that returns <code>#id</code> if id is a number, or the uppercased string if it\'s a string.',
          starter:
'function formatId(id: string | number): string {\n' +
'  // TODO\n' +
'  return "";\n' +
'}\n',
          solution:
'function formatId(id: string | number): string {\n' +
'  if (typeof id === "number") {\n' +
'    return `#${id}`;\n' +
'  }\n' +
'  return id.toUpperCase();\n' +
'}\n',
          exposes: ["formatId"],
          run: function (ctx) {
            var f = ctx.exports.formatId;
            if (typeof f !== "function") return [ok("formatId is defined", false)];
            return [
              ok("formatId(7) is #7", f(7) === "#7", "got " + JSON.stringify(f(7))),
              ok('formatId("abc") is "ABC"', f("abc") === "ABC", "got " + JSON.stringify(f("abc")))
            ];
          }
        },
        {
          id: "un-c2",
          title: "Discriminated union + switch",
          difficulty: "Medium",
          prompt: 'Define a discriminated union <code>Shape</code> of <code>{ kind: "circle"; radius: number }</code> and <code>{ kind: "square"; side: number }</code>. Write <code>area(shape: Shape): number</code> using a switch on <code>shape.kind</code>.',
          starter:
'// TODO: define the Shape union\n\n' +
'function area(shape: Shape): number {\n' +
'  // TODO\n' +
'  return 0;\n' +
'}\n',
          solution:
'type Shape =\n' +
'  | { kind: "circle"; radius: number }\n' +
'  | { kind: "square"; side: number };\n\n' +
'function area(shape: Shape): number {\n' +
'  switch (shape.kind) {\n' +
'    case "circle":\n' +
'      return Math.PI * shape.radius * shape.radius;\n' +
'    case "square":\n' +
'      return shape.side * shape.side;\n' +
'  }\n' +
'}\n',
          exposes: ["area"],
          run: function (ctx) {
            var f = ctx.exports.area;
            if (typeof f !== "function") return [ok("area is defined", false)];
            var circle = f({ kind: "circle", radius: 2 });
            var square = f({ kind: "square", side: 3 });
            return [
              ok("circle area is πr²", Math.abs(circle - Math.PI * 4) < 0.0001, "got " + circle),
              ok("square area is side²", square === 9, "got " + square)
            ];
          }
        },
        {
          id: "un-c3",
          title: "Exhaustiveness checking",
          difficulty: "Medium",
          prompt: "The <code>default</code> branch assigns <code>e</code> to a <code>never</code> variable. Right now that's a compile error, because two event types aren't handled yet. Add the missing cases so the function returns <code>pressed {key}</code> for keypresses and <code>scrolled {delta}</code> for scrolls.",
          starter:
'type AppEvent =\n' +
'  | { type: "click"; x: number; y: number }\n' +
'  | { type: "keypress"; key: string }\n' +
'  | { type: "scroll"; delta: number };\n\n' +
'function describeEvent(e: AppEvent): string {\n' +
'  switch (e.type) {\n' +
'    case "click":\n' +
'      return `click at ${e.x},${e.y}`;\n' +
'    default: {\n' +
'      const unhandled: never = e;\n' +
'      return unhandled;\n' +
'    }\n' +
'  }\n' +
'}\n',
          solution:
'type AppEvent =\n' +
'  | { type: "click"; x: number; y: number }\n' +
'  | { type: "keypress"; key: string }\n' +
'  | { type: "scroll"; delta: number };\n\n' +
'function describeEvent(e: AppEvent): string {\n' +
'  switch (e.type) {\n' +
'    case "click":\n' +
'      return `click at ${e.x},${e.y}`;\n' +
'    case "keypress":\n' +
'      return `pressed ${e.key}`;\n' +
'    case "scroll":\n' +
'      return `scrolled ${e.delta}`;\n' +
'    default: {\n' +
'      const unhandled: never = e;\n' +
'      return unhandled;\n' +
'    }\n' +
'  }\n' +
'}\n',
          exposes: ["describeEvent"],
          run: function (ctx) {
            var f = ctx.exports.describeEvent;
            if (typeof f !== "function") return [ok("describeEvent is defined", false)];
            var click = f({ type: "click", x: 3, y: 4 });
            var key = f({ type: "keypress", key: "Enter" });
            var scroll = f({ type: "scroll", delta: 120 });
            return [
              ok("click events still work", click === "click at 3,4", "got " + JSON.stringify(click)),
              ok("keypress returns pressed Enter", key === "pressed Enter", "got " + JSON.stringify(key)),
              ok("scroll returns scrolled 120", scroll === "scrolled 120", "got " + JSON.stringify(scroll))
            ];
          }
        }
      ],
      examples: [
        {
          id: "un-e1",
          title: "Modeling impossible states away",
          scenario: "A single object with optional fields can represent nonsense states (loading AND has data AND has an error, all at once). A discriminated union can't.",
          code:
'type RequestState<T> =\n' +
'  | { status: "idle" }\n' +
'  | { status: "loading" }\n' +
'  | { status: "success"; data: T }\n' +
'  | { status: "error"; error: string };\n\n' +
'function render(state: RequestState<User>) {\n' +
'  if (state.status === "success") {\n' +
'    return state.data.name; // only reachable, and only valid, here\n' +
'  }\n' +
'}',
          takeaway: "This is one of the most common real-world TypeScript patterns (seen all over React and Redux-style state): instead of `{ loading: boolean; data?: T; error?: string }` — where all three could technically be true together — each state is its own variant, and TypeScript only lets you read `.data` where it's actually guaranteed to exist."
        },
        {
          id: "un-e2",
          title: "Type guards for safer error handling",
          scenario: "In strict TypeScript, a caught error's type is `unknown`, not `any` — for good reason.",
          code:
'try {\n' +
'  JSON.parse(input);\n' +
'} catch (err) {\n' +
'  if (err instanceof Error) {\n' +
'    console.log(err.message);\n' +
'  } else {\n' +
'    console.log("Something was thrown that wasn\'t an Error:", err);\n' +
'  }\n' +
'}',
          takeaway: "JavaScript lets you `throw` literally anything — a string, a number, nothing at all. Typing `catch` variables as `unknown` forces you to actually check before assuming `err.message` exists, which avoids a surprisingly common class of runtime crash in error-handling code."
        }
      ]
    },
    {
      id: "utility",
      title: "Utility Types & Type Manipulation",
      blurb: "Deriving new types from existing ones with `keyof`, `typeof`, and the built-in utility types — Partial, Pick, Omit, Record, and friends.",
      theory: [
        {
          id: "util-1",
          type: "mc",
          prompt: 'What does `keyof User` give you, if User is `{id: number; name: string}`?',
          options: [
            'The union of User’s property names as literal types: `"id" | "name"`.',
            "An array of the user's actual property values.",
            "The number of properties User has.",
            "A new interface identical to User."
          ],
          correct: 0,
          explanation: "`keyof` turns an object type's property names into a union of string literal types, which is exactly what powers `getProperty<T, K extends keyof T>` from the Generics chapter."
        },
        {
          id: "util-2",
          type: "mc",
          prompt: "What does `typeof someValue` do when used in a TYPE position (not the JS runtime operator)?",
          options: [
            "Produces the TypeScript type of that value or variable, so you can reuse it elsewhere without redeclaring it.",
            'Always returns the string "object".',
            "Converts the value to a string.",
            "Only works on classes."
          ],
          correct: 0,
          explanation: "`typeof` in a type position lets you derive a type from an existing value — e.g. `type Config = typeof defaultConfig;` — so the implementation stays the single source of truth."
        },
        {
          id: "util-3",
          type: "mc",
          prompt: "What does `Partial<User>` produce?",
          options: [
            "A version of User where every property is optional.",
            "A version of User where every property becomes required.",
            "An array of Users.",
            "Removes all properties from User."
          ],
          correct: 0,
          explanation: "`Partial<T>` maps every property of T to its optional form — handy for things like 'patch' update objects that only need to specify the fields that are changing."
        },
        {
          id: "util-4",
          type: "mc",
          prompt: 'What’s the difference between `Pick<User, "id"|"name">` and `Omit<User, "id"|"name">`?',
          options: [
            "Pick keeps only the listed properties; Omit keeps everything EXCEPT the listed properties.",
            "They do the same thing.",
            "Pick removes properties, Omit adds them.",
            "Omit only works on arrays."
          ],
          correct: 0,
          explanation: "They're complementary: `Pick` is an allow-list, `Omit` is a deny-list, both producing a narrower object type from User."
        },
        {
          id: "util-5",
          type: "mc",
          prompt: "What does `Record<string, number>` describe?",
          options: [
            "An object type where every key is a string and every value is a number.",
            "A tuple of a string and a number.",
            "A class with static members only.",
            "An array of records from a database."
          ],
          correct: 0,
          explanation: "`Record<K, V>` is a shorthand for an object/dictionary type — equivalent to writing an index signature `{ [key: K]: V }`."
        },
        {
          id: "util-6",
          type: "mc",
          prompt: "What does `Readonly<User>` produce?",
          options: [
            "A version of User where every property is `readonly`.",
            "A frozen copy of the object at runtime.",
            "User with all its methods removed.",
            "User with every property made optional."
          ],
          correct: 0,
          explanation: "`Readonly<T>` is a mapped type that adds `readonly` to every property — handy for function parameters you promise not to modify. Like all types, it has no runtime effect; `Object.freeze` is the runtime equivalent."
        },
        {
          id: "util-7",
          type: "mc",
          prompt: "What is `Exclude<\"a\" | \"b\" | \"c\", \"a\">`?",
          options: [
            "`\"b\" | \"c\"`",
            "`\"a\"`",
            "`\"a\" | \"b\" | \"c\"`",
            "`never`"
          ],
          correct: 0,
          explanation: "`Exclude<T, U>` removes from union T every member that's assignable to U. Its opposite is `Extract<T, U>`, which keeps only those members."
        },
        {
          id: "util-8",
          type: "mc",
          prompt: "Given this conditional type, what is `IsString<number>`?\n```\ntype IsString<T> = T extends string ? \"yes\" : \"no\";\n```",
          options: ["`\"no\"`", "`\"yes\"`", "`boolean`", "`never`"],
          correct: 0,
          explanation: "Conditional types read like a ternary at the type level: if T is assignable to `string`, the result is `\"yes\"`, otherwise `\"no\"`. `number` isn't a string, so you get `\"no\"`. Many built-in utilities, like `Exclude` and `ReturnType`, are built from conditional types."
        }
      ],
      challenges: [
        {
          id: "util-c1",
          title: "Use Partial and Pick",
          difficulty: "Easy",
          prompt: 'Given <code>interface Product { id: number; name: string; price: number; }</code>, write <code>updateProduct(product: Product, changes: Partial&lt;Product&gt;): Product</code> that merges the changes in, and <code>summary(product: Product): Pick&lt;Product, "id"|"name"&gt;</code> returning just id and name.',
          starter:
'interface Product {\n' +
'  id: number;\n' +
'  name: string;\n' +
'  price: number;\n' +
'}\n\n' +
'function updateProduct(product: Product, changes) {\n' +
'  // TODO: type `changes` with Partial<Product>, merge and return\n' +
'  return product;\n' +
'}\n\n' +
'function summary(product: Product) {\n' +
'  // TODO: return type should be Pick<Product, "id" | "name">\n' +
'  return product;\n' +
'}\n',
          solution:
'interface Product {\n' +
'  id: number;\n' +
'  name: string;\n' +
'  price: number;\n' +
'}\n\n' +
'function updateProduct(product: Product, changes: Partial<Product>): Product {\n' +
'  return { ...product, ...changes };\n' +
'}\n\n' +
'function summary(product: Product): Pick<Product, "id" | "name"> {\n' +
'  return { id: product.id, name: product.name };\n' +
'}\n',
          exposes: ["updateProduct", "summary"],
          run: function (ctx) {
            var e = ctx.exports;
            if (typeof e.updateProduct !== "function" || typeof e.summary !== "function") {
              return [ok("updateProduct and summary are defined", false)];
            }
            var p = { id: 1, name: "Mug", price: 9 };
            var p2 = e.updateProduct(p, { price: 12 });
            var s = e.summary(p);
            return [
              ok("updateProduct merges changes", p2.price === 12 && p2.name === "Mug", "got " + JSON.stringify(p2)),
              ok("summary keeps only id and name", s.id === 1 && s.name === "Mug" && !("price" in s), "got " + JSON.stringify(s))
            ];
          }
        },
        {
          id: "util-c2",
          title: "Build a lookup with Record",
          difficulty: "Medium",
          prompt: "Write <code>countByFirstLetter(words: string[]): Record&lt;string, number&gt;</code> mapping each distinct lowercased first letter to how many words start with it.",
          starter:
'function countByFirstLetter(words: string[]) {\n' +
'  // TODO: return type Record<string, number>\n' +
'  return {};\n' +
'}\n',
          solution:
'function countByFirstLetter(words: string[]): Record<string, number> {\n' +
'  const counts: Record<string, number> = {};\n' +
'  for (const word of words) {\n' +
'    const letter = (word[0] ?? "").toLowerCase();\n' +
'    counts[letter] = (counts[letter] || 0) + 1;\n' +
'  }\n' +
'  return counts;\n' +
'}\n',
          exposes: ["countByFirstLetter"],
          run: function (ctx) {
            var f = ctx.exports.countByFirstLetter;
            if (typeof f !== "function") return [ok("countByFirstLetter is defined", false)];
            var r = f(["Apple", "apricot", "Banana"]);
            return [
              ok('two words start with "a"', r.a === 2, "got " + JSON.stringify(r)),
              ok('one word starts with "b"', r.b === 1, "got " + JSON.stringify(r))
            ];
          }
        },
        {
          id: "util-c3",
          title: "Write your own mapped type",
          difficulty: "Hard",
          prompt: "Replace the placeholder with a real mapped type: <code>Nullable&lt;T&gt;</code> should keep every property of <code>T</code> with the same keys, but let each one also be <code>null</code>. When it's right, <code>draft</code> compiles. This one is checked purely by hidden type tests &mdash; there's nothing to run.",
          starter:
'interface User {\n' +
'  id: number;\n' +
'  name: string;\n' +
'}\n\n' +
'// TODO: every property of T should also accept null\n' +
'type Nullable<T> = T;\n\n' +
'const draft: Nullable<User> = { id: null, name: null };\n',
          solution:
'interface User {\n' +
'  id: number;\n' +
'  name: string;\n' +
'}\n\n' +
'type Nullable<T> = {\n' +
'  [K in keyof T]: T[K] | null;\n' +
'};\n\n' +
'const draft: Nullable<User> = { id: null, name: null };\n',
          exposes: [],
          typeTests:
'// test: Nullable<T> lets each property be null\n' +
'const __nullable1: Nullable<{ a: number; b: string }> = { a: null, b: "x" };\n' +
'// test: Nullable<T> still allows the original types\n' +
'const __nullable2: Nullable<{ a: number }> = { a: 5 };\n' +
'// test: Nullable<T> still rejects the wrong type (it is not just any)\n' +
'// @ts-expect-error\n' +
'const __nullable3: Nullable<{ a: number }> = { a: "nope" };\n' +
'// test: Nullable<T> keeps exactly the same keys\n' +
'// @ts-expect-error\n' +
'const __nullable4: Nullable<{ a: number }> = { a: 1, extra: true };\n',
          run: function () {
            return [ok("Nullable<T> passes every hidden type test", true)];
          }
        }
      ],
      examples: [
        {
          id: "util-e1",
          title: "`ReturnType<typeof fn>` to avoid re-typing output",
          scenario: "When a function's return shape is complex, writing a duplicate interface for it is extra work that drifts out of sync.",
          code:
'function createUser(name: string) {\n' +
'  return { id: crypto.randomUUID(), name, createdAt: new Date() };\n' +
'}\n\n' +
'type NewUser = ReturnType<typeof createUser>;\n' +
'// NewUser is derived automatically: { id: string; name: string; createdAt: Date }',
          takeaway: "If `createUser`'s implementation changes (a field is added or renamed), `NewUser` updates automatically — there's no second definition that can drift out of sync with the real one."
        },
        {
          id: "util-e2",
          title: "A mapped type for form validation errors",
          scenario: "Form libraries need an 'errors' object that mirrors a form's fields, but every field's error is optional.",
          code:
'interface SignupForm {\n' +
'  email: string;\n' +
'  password: string;\n' +
'}\n\n' +
'type FormErrors<T> = {\n' +
'  [K in keyof T]?: string;\n' +
'};\n\n' +
'const errors: FormErrors<SignupForm> = {\n' +
'  email: "Enter a valid email",\n' +
'};',
          takeaway: "`[K in keyof T]?: string` walks every key of T and produces the same key, now optional and typed as a string message. Change a field on `SignupForm` and `FormErrors<SignupForm>` follows automatically — no separate errors type to maintain by hand."
        }
      ]
    },
    {
      id: "real-world",
      title: "TypeScript in Real Projects",
      blurb: "Pulling it together: tsconfig basics, trusting (or not trusting) data from the outside world, typing request handlers, and declaring types for untyped JavaScript.",
      theory: [
        {
          id: "rw-1",
          type: "mc",
          prompt: 'What does enabling `"strict": true` in tsconfig.json do?',
          options: [
            "Turns on a bundle of stricter type-checking rules at once (like noImplicitAny and strictNullChecks) — the recommended default for real projects.",
            "Makes the compiler run faster.",
            "Disables type checking.",
            "Only affects .tsx files."
          ],
          correct: 0,
          explanation: "`strict` is a bundle flag. Turning it on is the standard recommendation for any new TypeScript project — it's much easier to start strict than to retrofit it onto a large, loosely-typed codebase later."
        },
        {
          id: "rw-2",
          type: "mc",
          prompt: "What's a `.d.ts` (declaration) file for?",
          options: [
            "It declares types for existing JavaScript code (yours or a library's) without containing any runtime implementation.",
            "It's where you write the actual implementation of your app.",
            "It's a config file like tsconfig.json.",
            "It's only used for testing."
          ],
          correct: 0,
          explanation: "Declaration files are pure type information, often shipped alongside a compiled JS library (or written by hand for one) so TypeScript knows its shape without needing its source."
        },
        {
          id: "rw-3",
          type: "mc",
          prompt: "Why is data from `fetch(...).then(r => r.json())` typed `any` by default, and why is that risky?",
          options: [
            "TypeScript can't know the shape of data coming from outside your program, so you should validate or narrow it (or at least assert a type) before trusting it.",
            "It's typed `any` because JSON can't be typed in TypeScript at all.",
            "It's actually fully type-safe automatically.",
            "fetch doesn't exist in TypeScript."
          ],
          correct: 0,
          explanation: "`.json()` has no way to know what's actually in the response body — that's determined by whatever the server sends back, which TypeScript can't see. Treating it as `unknown` and validating is safer than trusting an `any`."
        },
        {
          id: "rw-4",
          type: "mc",
          prompt: 'What’s the benefit of `import type { User } from "./user"`, compared to a normal import?',
          options: [
            "It signals the import is only used for types and is erased completely at compile time — it never affects the emitted JavaScript or causes an actual module load at runtime.",
            "It makes User a runtime value.",
            "It's required for every import in TypeScript.",
            "It only works with default exports."
          ],
          correct: 0,
          explanation: "`import type` documents intent and lets build tools safely strip the import entirely, since they can be sure nothing at runtime depends on it."
        },
        {
          id: "rw-5",
          type: "mc",
          prompt: "What does a type assertion like `const user = data as User` actually do?",
          options: [
            "Tells the compiler to treat the value as `User` without checking anything at runtime — if you're wrong, things break later.",
            "Converts the data into a `User` at runtime.",
            "Validates that the data has every `User` property.",
            "Works exactly like a type guard."
          ],
          correct: 0,
          explanation: "`as` is you overruling the compiler, and nothing checks it while the code runs. It's fine when you genuinely know more than TypeScript does, but for outside data (API responses, JSON), validate first with a type guard."
        },
        {
          id: "rw-6",
          type: "mc",
          prompt: "What does the `satisfies` operator do, as in `const config = { port: 3000 } satisfies Config;`?",
          options: [
            "Checks that the value matches `Config`, while keeping the value's own more specific inferred type.",
            "Changes `config`'s type to exactly `Config`.",
            "Casts the value without checking it, like `as`.",
            "Validates the object at runtime."
          ],
          correct: 0,
          explanation: "With `const config: Config = ...`, the variable's type becomes `Config` and you lose the specifics (e.g. that `port` is exactly `3000`). `satisfies` gives you the check without widening, so you get both safety and precise types."
        },
        {
          id: "rw-7",
          type: "mc",
          prompt: "You install a JavaScript package and TypeScript says \"Could not find a declaration file for module\". What's the usual first fix?",
          options: [
            "Install its community types, e.g. `npm install --save-dev @types/package-name`.",
            "Rewrite the package in TypeScript.",
            "Turn off `strict` mode.",
            "Delete `node_modules` and reinstall."
          ],
          correct: 0,
          explanation: "Most popular JavaScript packages have community-maintained types in the DefinitelyTyped project, published as `@types/...`. If none exist, you can write a small `declare module` file yourself."
        },
        {
          id: "rw-8",
          type: "mc",
          prompt: "Your project builds with a fast bundler like Vite or esbuild. Where do you actually catch type errors?",
          options: [
            "Those tools usually only strip types without checking them, so projects run `tsc --noEmit` (in the editor, a script, or CI) to type-check.",
            "The bundler always refuses to build if there are type errors.",
            "Type errors show up in the browser console at runtime.",
            "You can't get type errors when using a bundler."
          ],
          correct: 0,
          explanation: "For speed, many build tools treat TypeScript as 'JavaScript with types to delete'. Type checking is a separate step — your editor shows errors as you type, and `tsc --noEmit` in CI stops broken types from being merged."
        }
      ],
      challenges: [
        {
          id: "rw-c1",
          title: "Validate unknown API data",
          difficulty: "Medium",
          prompt: 'You fetched JSON and got back <code>unknown</code>. Write a type guard <code>isUser(data: unknown): data is { id: number; name: string }</code> that checks data is a non-null object with a numeric <code>id</code> and a string <code>name</code>. Then write <code>parseUser(data: unknown): { id: number; name: string }</code> that returns the validated user, or throws <code>new Error("Invalid user")</code> if it doesn\'t match.',
          starter:
'function isUser(data: unknown) {\n' +
'  // TODO: return `data is { id: number; name: string }`, checking the shape at runtime\n' +
'  return false;\n' +
'}\n\n' +
'function parseUser(data: unknown) {\n' +
'  // TODO: use isUser to validate, return it or throw new Error("Invalid user")\n' +
'  return data;\n' +
'}\n',
          solution:
'function isUser(data: unknown): data is { id: number; name: string } {\n' +
'  return (\n' +
'    typeof data === "object" &&\n' +
'    data !== null &&\n' +
'    typeof (data as any).id === "number" &&\n' +
'    typeof (data as any).name === "string"\n' +
'  );\n' +
'}\n\n' +
'function parseUser(data: unknown): { id: number; name: string } {\n' +
'  if (isUser(data)) {\n' +
'    return data;\n' +
'  }\n' +
'  throw new Error("Invalid user");\n' +
'}\n',
          exposes: ["isUser", "parseUser"],
          typeTests:
'// test: isUser is a type predicate that narrows unknown to a user\n' +
'declare const __maybeUser: unknown;\n' +
'if (isUser(__maybeUser)) {\n' +
'  const __userId: number = __maybeUser.id;\n' +
'  const __userName: string = __maybeUser.name;\n' +
'}\n' +
'// test: parseUser returns a typed user, not unknown\n' +
'const __parsedName: string = parseUser({}).name;\n',
          run: function (ctx) {
            var parseUser = ctx.exports.parseUser;
            var isUser = ctx.exports.isUser;
            if (typeof parseUser !== "function" || typeof isUser !== "function") {
              return [ok("isUser and parseUser are defined", false)];
            }
            var good = parseUser({ id: 1, name: "Ada" });
            var threw = false;
            var message = "";
            try {
              parseUser("nope");
            } catch (e) {
              threw = true;
              message = e && e.message;
            }
            return [
              ok("accepts a valid user", good && good.id === 1 && good.name === "Ada", "got " + JSON.stringify(good)),
              ok("rejects junk via isUser", isUser("nope") === false),
              ok("parseUser throws on invalid data", threw && message === "Invalid user", "got " + JSON.stringify(message))
            ];
          }
        },
        {
          id: "rw-c2",
          title: "Replace the anys with generics",
          difficulty: "Hard",
          prompt: "This <code>groupBy</code> helper works at runtime, but it's typed with <code>any</code> everywhere, so callers get no help. Rewrite its signature with generics: <code>T</code> for the item type and <code>K extends string</code> for the key that <code>getKey</code> returns. Return <code>Partial&lt;Record&lt;K, T[]&gt;&gt;</code> &mdash; <code>Partial</code> because a group might have no items.",
          starter:
'interface Order {\n' +
'  id: number;\n' +
'  status: "paid" | "unpaid";\n' +
'}\n\n' +
'// TODO: replace the anys with generics (T for items, K for keys)\n' +
'function groupBy(items: any[], getKey: (item: any) => any): any {\n' +
'  const groups: any = {};\n' +
'  for (const item of items) {\n' +
'    const key = getKey(item);\n' +
'    (groups[key] ??= []).push(item);\n' +
'  }\n' +
'  return groups;\n' +
'}\n',
          solution:
'interface Order {\n' +
'  id: number;\n' +
'  status: "paid" | "unpaid";\n' +
'}\n\n' +
'function groupBy<T, K extends string>(items: T[], getKey: (item: T) => K): Partial<Record<K, T[]>> {\n' +
'  const groups: Partial<Record<K, T[]>> = {};\n' +
'  for (const item of items) {\n' +
'    const key = getKey(item);\n' +
'    const list = groups[key] ?? [];\n' +
'    list.push(item);\n' +
'    groups[key] = list;\n' +
'  }\n' +
'  return groups;\n' +
'}\n',
          exposes: ["groupBy"],
          typeTests:
'declare const __orders: Order[];\n' +
'// test: the callback parameter is typed from the items (Order), not any\n' +
'// @ts-expect-error\n' +
'groupBy(__orders, (o) => o.missing);\n' +
'// test: the result is keyed by what getKey returns\n' +
'const __groups = groupBy(__orders, (o) => o.status);\n' +
'const __paidOrders: Order[] | undefined = __groups.paid;\n' +
'// test: keys that getKey can never return are rejected\n' +
'// @ts-expect-error\n' +
'__groups.refunded;\n',
          run: function (ctx) {
            var f = ctx.exports.groupBy;
            if (typeof f !== "function") return [ok("groupBy is defined", false)];
            var orders = [{ id: 1, status: "paid" }, { id: 2, status: "unpaid" }, { id: 3, status: "paid" }];
            var g = f(orders, function (o) { return o.status; });
            var ids = function (list) { return (list || []).map(function (o) { return o.id; }); };
            return [
              ok("paid orders are grouped together", JSON.stringify(ids(g.paid)) === "[1,3]", "got " + JSON.stringify(ids(g.paid))),
              ok("unpaid orders are grouped together", JSON.stringify(ids(g.unpaid)) === "[2]", "got " + JSON.stringify(ids(g.unpaid)))
            ];
          }
        }
      ],
      examples: [
        {
          id: "rw-e1",
          title: "A minimal, strict tsconfig.json",
          scenario: "Most of a real project's TypeScript behavior is set once, in this file.",
          code:
'{\n' +
'  "compilerOptions": {\n' +
'    "target": "ES2020",\n' +
'    "module": "ESNext",\n' +
'    "strict": true,\n' +
'    "skipLibCheck": true,\n' +
'    "esModuleInterop": true,\n' +
'    "noUncheckedIndexedAccess": true\n' +
'  }\n' +
'}',
          takeaway: "`strict` turns on the core safety net. `skipLibCheck` skips type-checking inside third-party `.d.ts` files (faster builds, fewer unrelated errors). `noUncheckedIndexedAccess` is an extra, very useful flag that makes array/object index access include `| undefined`, catching a whole class of out-of-bounds bugs."
        },
        {
          id: "rw-e2",
          title: "Fetch, then validate before trusting",
          scenario: "Combining the narrowing from the Unions chapter with a real network call.",
          code:
'async function getUser(id: number): Promise<{ id: number; name: string }> {\n' +
'  const res = await fetch(`/api/users/${id}`);\n' +
'  const data: unknown = await res.json();\n' +
'  if (!isUser(data)) {\n' +
'    throw new Error("Unexpected response shape");\n' +
'  }\n' +
'  return data;\n' +
'}',
          takeaway: "Typing the parsed JSON as `unknown` (rather than trusting `.json()`'s default `any`) means a backend change that silently alters the response shape fails loudly, right where the data enters your app — instead of crashing somewhere unrelated three function calls later."
        },
        {
          id: "rw-e3",
          title: "A typed request handler",
          scenario: "Backend frameworks (Express, Fastify, and similar) type their request and response objects so handler code is checked too.",
          code:
'interface GetUserRequest {\n' +
'  params: { id: string };\n' +
'}\n\n' +
'interface JsonResponse {\n' +
'  json(body: unknown): void;\n' +
'}\n\n' +
'function getUserHandler(req: GetUserRequest, res: JsonResponse) {\n' +
'  const id = Number(req.params.id);\n' +
'  res.json({ id, name: "placeholder" });\n' +
'}',
          takeaway: "Typing `req` and `res` catches mistakes like reading `req.params.userId` (which doesn't exist) at compile time, instead of finding out in production when that route gets hit."
        },
        {
          id: "rw-e4",
          title: "Declaring types for an untyped JS library",
          scenario: "Sometimes you need to use a plain JavaScript package that ships with no types at all.",
          code:
'// a hand-written declaration file for an untyped package\n' +
'declare module "legacy-math-lib" {\n' +
'  export function add(a: number, b: number): number;\n' +
'  export function multiply(a: number, b: number): number;\n' +
'}\n\n' +
'// elsewhere in the app:\n' +
'// import { add } from "legacy-math-lib"; // now fully typed',
          takeaway: "A `declare module` block describes a module's shape without needing (or having) its source. This is exactly what the community-maintained `@types/*` packages are — hand-written or generated declaration files for JavaScript libraries that don't ship their own types."
        }
      ]
    }
  ];

  var NOTES = {
    basics: [
      { title: "TypeScript is JavaScript plus types", text: "Types are checked when you compile, then erased. What actually runs is plain JavaScript, so types never slow your code down or change what it does." },
      { title: "Inference", text: "You don't have to annotate everything. TypeScript infers types from initial values: `let` widens to the general type, `const` keeps the exact literal.", code: 'let a = "hi";   // string\nconst b = "hi"; // "hi"' },
      { title: "any, unknown, never", text: "`any` switches checking off for a value. `unknown` means 'could be anything, check before you use it'. `never` means 'this can't happen'." },
      { title: "Arrays and tuples", text: "Arrays can be any length. Tuples fix the length and the type at each position.", code: "const ids: number[] = [1, 2, 3];\nconst point: [number, number] = [3, 4];" }
    ],
    functions: [
      { title: "Annotate what comes in", text: "Parameters need types (TypeScript can't guess them). Return types are inferred, but writing them makes the function's contract explicit.", code: "function total(price: number, qty: number): number {\n  return price * qty;\n}" },
      { title: "Optional and default parameters", text: "`?` lets callers leave an argument out, and its type becomes `T | undefined`. A default value makes it optional too, and keeps it defined.", code: 'function greet(name?: string) {}\nfunction welcome(name = "friend") {}' },
      { title: "Function types", text: "Describe a function's shape with an arrow-style type, handy for callbacks.", code: "type Handler = (event: string) => void;\nfunction on(name: string, handler: Handler) {}" },
      { title: "void vs never", text: "`void` means 'returns, but don't use the result'. `never` means the function can't finish normally, e.g. it always throws." }
    ],
    objects: [
      { title: "Interfaces describe shape", text: "An interface lists the properties an object must have, and their types. It disappears completely at compile time.", code: "interface User {\n  id: number;\n  name: string;\n}" },
      { title: "Optional and readonly", text: "`?` means the key can be missing. `readonly` means it can't be reassigned after creation.", code: "interface Config {\n  readonly apiUrl: string;\n  retries?: number;\n}" },
      { title: "Dictionaries", text: "When you don't know the keys in advance, use an index signature or `Record`.", code: "interface Scores { [name: string]: number }\ntype Scores2 = Record<string, number>;" },
      { title: "Structural typing", text: "Matching shape is enough: any object with the right properties satisfies the type, whatever it's called. Fresh object literals also get an 'excess property' check to catch typos." }
    ],
    classes: [
      { title: "Access modifiers", text: "`public` (default) is visible everywhere, `protected` to the class and subclasses, `private` only inside the class. All checked at compile time only." },
      { title: "Parameter properties", text: "A modifier on a constructor parameter declares and assigns the property in one go.", code: "class OrderService {\n  constructor(private db: Database) {}\n}" },
      { title: "implements is a contract", text: "`class A implements B` makes TypeScript check that A has everything B requires. It doesn't copy any code into A." },
      { title: "abstract, static, readonly", text: "Abstract classes can't be created directly and can require methods. Static members live on the class. Readonly properties are set once.", code: "abstract class Shape {\n  static count = 0;\n  readonly id = ++Shape.count;\n  abstract area(): number;\n}" }
    ],
    generics: [
      { title: "Type parameters", text: "A generic is a type-level parameter, usually inferred from the arguments you pass.", code: "function identity<T>(value: T): T {\n  return value;\n}\nidentity(5); // T is number" },
      { title: "Constraints", text: "`extends` limits what T can be without fixing it to one exact type.", code: "function byId<T extends { id: number }>(items: T[], id: number) {\n  return items.find((i) => i.id === id);\n}" },
      { title: "keyof and indexed access", text: "`keyof T` is the union of T's keys, and `T[K]` is the type at key K. Together they type property lookups exactly.", code: "function get<T, K extends keyof T>(obj: T, key: K): T[K] {\n  return obj[key];\n}" },
      { title: "Generics you already use", text: "`Array<T>` (written `T[]`), `Promise<T>`, `Record<K, V>`, `Map<K, V>` are all generic types." }
    ],
    unions: [
      { title: "Unions and narrowing", text: "`A | B` means either. Before using union-specific methods, narrow with `typeof`, `instanceof`, `in`, or equality checks.", code: 'function fmt(id: string | number) {\n  return typeof id === "number" ? `#${id}` : id;\n}' },
      { title: "Discriminated unions", text: "Give each variant a shared literal tag, then switch on it. TypeScript narrows the rest of the shape for you.", code: 'type Result =\n  | { ok: true; value: number }\n  | { ok: false; error: string };' },
      { title: "Type guards", text: "A function returning `x is T` teaches TypeScript how to narrow wherever it's called.", code: 'function isString(x: unknown): x is string {\n  return typeof x === "string";\n}' },
      { title: "Exhaustiveness", text: "Assign the value to `never` in `default`. If a new variant is added and not handled, that line becomes a compile error.", code: "default: {\n  const unhandled: never = shape;\n  return unhandled;\n}" }
    ],
    utility: [
      { title: "Reshaping objects", text: "`Partial<T>` makes everything optional, `Required<T>` the opposite, `Readonly<T>` locks everything." },
      { title: "Picking and dropping keys", text: "`Pick<T, K>` keeps only keys K. `Omit<T, K>` keeps everything else. `Record<K, V>` builds a dictionary type.", code: 'type Preview = Pick<User, "id" | "name">;\ntype NewUser = Omit<User, "id">;' },
      { title: "Types from values", text: "`typeof` in a type position reuses a value's type; `ReturnType` grabs a function's output type.", code: "const defaults = { port: 3000, debug: false };\ntype Config = typeof defaults;" },
      { title: "Mapped and conditional types", text: "Mapped types loop over keys; conditional types branch like a ternary.", code: "type Nullable<T> = { [K in keyof T]: T[K] | null };\ntype IsString<T> = T extends string ? true : false;" }
    ],
    "real-world": [
      { title: "tsconfig essentials", text: "`strict` turns on the safety net, `target` sets which JavaScript syntax is emitted, `module` sets the import/export style, `outDir` sets where output goes." },
      { title: "Validate outside data", text: "Treat API responses and parsed JSON as `unknown`, then check them with a type guard before trusting them." },
      { title: "as vs satisfies", text: "`as` overrules the compiler with no checks. `satisfies` checks the value against a type but keeps the more precise inferred type.", code: "const config = { port: 3000 } satisfies Config;" },
      { title: "Declaration files", text: "`.d.ts` files describe JavaScript that has no types. `@types/*` packages are exactly this.", code: 'declare module "legacy-lib" {\n  export function add(a: number, b: number): number;\n}' }
    ],
    "lab-1": [
      { title: "What tsc does", text: "`tsc` type-checks your whole project, then writes one `.js` file per `.ts` file. Interfaces, type aliases and annotations are erased in the output." },
      { title: "Where output goes", text: "Without `outDir`, `.js` files are written next to your sources. `outDir` sends them elsewhere, and `rootDir` controls which folder structure gets mirrored.", code: '"outDir": "dist",\n"rootDir": "src"' },
      { title: "Strict mode", text: "`\"strict\": true` turns on `noImplicitAny`, `strictNullChecks` and more. Turning it on in an existing project usually reveals a few real bugs." }
    ],
    "lab-2": [
      { title: "module", text: "Controls the import/export syntax tsc emits. `CommonJS` emits `require` and `exports`. `ESNext` and `NodeNext` keep `import` and `export`. It has to match how your runtime loads files; for Node, that's the `\"type\"` field in package.json." },
      { title: "target", text: "Controls which JavaScript version tsc writes. Newer syntax than the target gets rewritten into older equivalents, e.g. `??` becomes a ternary for ES2017." },
      { title: "noUncheckedIndexedAccess", text: "Makes `arr[i]` and `obj[key]` include `| undefined`, so out-of-bounds lookups have to be handled.", code: "const first = names[0]; // string | undefined" }
    ],
    "lab-3": [
      { title: "Declaring a module", text: "When a package ships no types, a `declare module` block in any `.d.ts` file in your project describes it.", code: 'declare module "tiny-slug" {\n  export function slugify(input: string): string;\n}' },
      { title: "Which imports survive", text: "`import type` is always erased. By default tsc also drops imports that are only used as types or never used. `verbatimModuleSyntax` makes this explicit: only `type` imports are removed." },
      { title: "Path aliases", text: "`paths` maps import prefixes to folders for the type checker. Your bundler or runtime needs the same alias, because tsc doesn't rewrite the import.", code: '"paths": {\n  "@/*": ["./src/*"]\n}' }
    ]
  };

  var LABS = [
    {
      id: "lab-1",
      after: "objects",
      title: "Project setup",
      blurb: "A real (tiny) project: a tsconfig.json, a src folder, and the actual compiler. See what tsc emits, turn on strict mode, and send the output where it belongs.",
      tasks: [
        {
          id: "lab1-t1",
          kind: "predict",
          title: "Where do the types go?",
          difficulty: "Easy",
          compilerOptions: { target: "ES2017", module: "ESNext" },
          showFile: "/src/user.ts",
          files: {
            "/src/user.ts":
'interface User {\n' +
'  id: number;\n' +
'  name: string;\n' +
'}\n\n' +
'type Role = "admin" | "member";\n\n' +
'function greet(user: User, role: Role): string {\n' +
'  return `Hi ${user.name} (${role})`;\n' +
'}\n'
          },
          question: "Which of these are still in the JavaScript that tsc emits for this file?",
          choices: ["The `interface User`", "The `type Role` alias", "The `greet` function", "The `: User` and `: string` annotations"],
          correct: [2],
          explanation: "Interfaces, type aliases and annotations only exist for the type checker, so tsc erases all of them. Only `greet` survives, with plain untyped parameters."
        },
        {
          id: "lab1-t2",
          kind: "build",
          title: "Turn on strict mode",
          difficulty: "Medium",
          prompt: "This project was started with <code>\"strict\": false</code>. Turn strict mode on in <code>tsconfig.json</code>, press Build, then fix the two errors it uncovers. (Hint: <code>findUser</code> can return <code>undefined</code>.)",
          openFile: "/tsconfig.json",
          files: {
            "/tsconfig.json":
'{\n' +
'  "compilerOptions": {\n' +
'    "target": "ES2020",\n' +
'    "module": "ESNext",\n' +
'    "outDir": "dist",\n' +
'    "strict": false\n' +
'  }\n' +
'}\n',
            "/src/index.ts":
'import { findUser } from "./users";\n\n' +
'const user = findUser(2);\n' +
'console.log(user.name.toUpperCase());\n',
            "/src/users.ts":
'export interface User {\n' +
'  id: number;\n' +
'  name: string;\n' +
'}\n\n' +
'const users: User[] = [\n' +
'  { id: 1, name: "Ada" },\n' +
'  { id: 2, name: "Linus" }\n' +
'];\n\n' +
'export function findUser(id) {\n' +
'  return users.find((u) => u.id === id);\n' +
'}\n'
          },
          solution: {
            "/tsconfig.json":
'{\n' +
'  "compilerOptions": {\n' +
'    "target": "ES2020",\n' +
'    "module": "ESNext",\n' +
'    "outDir": "dist",\n' +
'    "strict": true\n' +
'  }\n' +
'}\n',
            "/src/index.ts":
'import { findUser } from "./users";\n\n' +
'const user = findUser(2);\n' +
'if (user) {\n' +
'  console.log(user.name.toUpperCase());\n' +
'}\n',
            "/src/users.ts":
'export interface User {\n' +
'  id: number;\n' +
'  name: string;\n' +
'}\n\n' +
'const users: User[] = [\n' +
'  { id: 1, name: "Ada" },\n' +
'  { id: 2, name: "Linus" }\n' +
'];\n\n' +
'export function findUser(id: number): User | undefined {\n' +
'  return users.find((u) => u.id === id);\n' +
'}\n'
          },
          checks: [
            { name: "strict is on in tsconfig.json", test: function (ctx) { return ctx.options.strict === true; } },
            { name: "the project builds with no errors", test: function (ctx) { return ctx.errorCount === 0; } }
          ]
        },
        {
          id: "lab1-t3",
          kind: "build",
          title: "Send the output to dist/",
          difficulty: "Easy",
          prompt: "Press Build and look at where the JavaScript lands: right next to your <code>.ts</code> files, cluttering <code>src/</code>. Change <code>tsconfig.json</code> so the output goes to <code>dist/index.js</code> and <code>dist/math.js</code> instead.",
          openFile: "/tsconfig.json",
          files: {
            "/tsconfig.json":
'{\n' +
'  "compilerOptions": {\n' +
'    "target": "ES2020",\n' +
'    "module": "ESNext",\n' +
'    "strict": true\n' +
'  }\n' +
'}\n',
            "/src/index.ts":
'import { add } from "./math";\n\n' +
'console.log(add(2, 3));\n',
            "/src/math.ts":
'export function add(a: number, b: number): number {\n' +
'  return a + b;\n' +
'}\n'
          },
          solution: {
            "/tsconfig.json":
'{\n' +
'  "compilerOptions": {\n' +
'    "target": "ES2020",\n' +
'    "module": "ESNext",\n' +
'    "strict": true,\n' +
'    "rootDir": "src",\n' +
'    "outDir": "dist"\n' +
'  }\n' +
'}\n'
          },
          checks: [
            { name: "dist/index.js and dist/math.js are emitted", test: function (ctx) { return !!ctx.outputs["/dist/index.js"] && !!ctx.outputs["/dist/math.js"]; } },
            { name: "nothing is written into src/", test: function (ctx) { return !Object.keys(ctx.outputs).some(function (p) { return p.indexOf("/src/") === 0; }); } },
            { name: "the project builds with no errors", test: function (ctx) { return ctx.errorCount === 0; } }
          ]
        }
      ]
    },
    {
      id: "lab-2",
      after: "generics",
      title: "tsconfig deep-dive",
      blurb: "The three compiler options that cause the most real-world confusion: module, target, and the bug-catching noUncheckedIndexedAccess.",
      tasks: [
        {
          id: "lab2-t1",
          kind: "build",
          title: "Match the module system",
          difficulty: "Hard",
          prompt: "<code>package.json</code> says <code>\"type\": \"module\"</code>, so Node loads <code>dist/*.js</code> as ES modules. But this config emits CommonJS (<code>require</code> and <code>exports</code>), which crashes with <em>require is not defined in ES module scope</em>. Make the output use <code>import</code>/<code>export</code>. Node's ES modules also need the full file extension on relative imports, so the emitted import must point at <code>./greet.js</code>.",
          openFile: "/tsconfig.json",
          readonly: ["/package.json"],
          files: {
            "/package.json":
'{\n' +
'  "name": "my-api",\n' +
'  "type": "module"\n' +
'}\n',
            "/tsconfig.json":
'{\n' +
'  "compilerOptions": {\n' +
'    "target": "ES2020",\n' +
'    "module": "CommonJS",\n' +
'    "outDir": "dist",\n' +
'    "rootDir": "src",\n' +
'    "strict": true\n' +
'  }\n' +
'}\n',
            "/src/index.ts":
'import { greet } from "./greet";\n\n' +
'console.log(greet("world"));\n',
            "/src/greet.ts":
'export function greet(name: string): string {\n' +
'  return `Hello, ${name}!`;\n' +
'}\n'
          },
          solution: {
            "/tsconfig.json":
'{\n' +
'  "compilerOptions": {\n' +
'    "target": "ES2020",\n' +
'    "module": "NodeNext",\n' +
'    "outDir": "dist",\n' +
'    "rootDir": "src",\n' +
'    "strict": true\n' +
'  }\n' +
'}\n',
            "/src/index.ts":
'import { greet } from "./greet.js";\n\n' +
'console.log(greet("world"));\n'
          },
          checks: [
            { name: "dist/index.js uses import, not require", test: function (ctx) { var js = ctx.outputs["/dist/index.js"] || ""; return /\bimport\b/.test(js) && js.indexOf("require(") === -1; } },
            { name: "dist/greet.js uses export, not exports.", test: function (ctx) { var js = ctx.outputs["/dist/greet.js"] || ""; return /\bexport\b/.test(js) && js.indexOf("exports.") === -1; } },
            { name: "the import points at ./greet.js", test: function (ctx) { return /from\s+["']\.\/greet\.js["']/.test(ctx.outputs["/dist/index.js"] || ""); } },
            { name: "the project builds with no errors", test: function (ctx) { return ctx.errorCount === 0; } }
          ]
        },
        {
          id: "lab2-t2",
          kind: "predict",
          title: "What does target rewrite?",
          difficulty: "Medium",
          compilerOptions: { target: "ES2017", module: "ESNext" },
          showFile: "/src/profile.ts",
          files: {
            "/src/profile.ts":
'interface Profile {\n' +
'  name?: string;\n' +
'  nickname?: string | null;\n' +
'}\n\n' +
'export function displayName(p: Profile): string {\n' +
'  const greet = (n: string) => `Hi, ${n}`;\n' +
'  return greet(p.nickname ?? p.name?.trim() ?? "anonymous");\n' +
'}\n'
          },
          question: 'With `"target": "ES2017"`, which pieces of syntax does tsc rewrite into older JavaScript?',
          choices: ["The `??` operator", "The `?.` operator", "The arrow function", "The template literal"],
          correct: [0, 1],
          explanation: "`??` and `?.` arrived in ES2020, so for an ES2017 target tsc rewrites them into null checks and ternaries. Arrow functions and template literals are ES2015, which ES2017 already supports, so they're left alone."
        },
        {
          id: "lab2-t3",
          kind: "build",
          title: "Catch out-of-bounds access",
          difficulty: "Medium",
          prompt: "<code>shout(5)</code> crashes at runtime because <code>names[5]</code> is <code>undefined</code>, yet strict mode doesn't catch it. Turn on <code>noUncheckedIndexedAccess</code>, then fix the error it reveals: return <code>\"nobody\"</code> when there's no name at that index.",
          openFile: "/tsconfig.json",
          runFile: "/dist/index.js",
          exposes: ["shout"],
          files: {
            "/tsconfig.json":
'{\n' +
'  "compilerOptions": {\n' +
'    "target": "ES2020",\n' +
'    "outDir": "dist",\n' +
'    "rootDir": "src",\n' +
'    "strict": true\n' +
'  }\n' +
'}\n',
            "/src/index.ts":
'const names: string[] = ["ada", "linus"];\n\n' +
'function shout(index: number): string {\n' +
'  const name = names[index];\n' +
'  return name.toUpperCase();\n' +
'}\n\n' +
'console.log(shout(0));\n'
          },
          solution: {
            "/tsconfig.json":
'{\n' +
'  "compilerOptions": {\n' +
'    "target": "ES2020",\n' +
'    "outDir": "dist",\n' +
'    "rootDir": "src",\n' +
'    "strict": true,\n' +
'    "noUncheckedIndexedAccess": true\n' +
'  }\n' +
'}\n',
            "/src/index.ts":
'const names: string[] = ["ada", "linus"];\n\n' +
'function shout(index: number): string {\n' +
'  const name = names[index];\n' +
'  if (name === undefined) {\n' +
'    return "nobody";\n' +
'  }\n' +
'  return name.toUpperCase();\n' +
'}\n\n' +
'console.log(shout(0));\n'
          },
          checks: [
            { name: "noUncheckedIndexedAccess is on", test: function (ctx) { return ctx.options.noUncheckedIndexedAccess === true; } },
            { name: "the project builds with no errors", test: function (ctx) { return ctx.errorCount === 0; } },
            { name: "shout(0) is \"ADA\"", test: function (ctx) { return typeof ctx.exports.shout === "function" && ctx.exports.shout(0) === "ADA"; } },
            { name: "shout(5) is \"nobody\"", test: function (ctx) { return typeof ctx.exports.shout === "function" && ctx.exports.shout(5) === "nobody"; } }
          ]
        }
      ]
    },
    {
      id: "lab-3",
      after: "real-world",
      title: "Real-world project",
      blurb: "The problems you hit in real codebases: an npm package with no types, imports that vanish from the output, and path aliases.",
      tasks: [
        {
          id: "lab3-t1",
          kind: "build",
          title: "Type an untyped package",
          difficulty: "Medium",
          prompt: "<code>tiny-slug</code> is a plain JavaScript package with no types, so the import fails with <em>Could not find a declaration file</em>. Fill in <code>src/types/tiny-slug.d.ts</code> to declare the module and its one export, <code>slugify(input: string): string</code>. Declaring it as just <code>any</code> won't pass: <code>index.ts</code> checks that numbers are rejected.",
          openFile: "/src/types/tiny-slug.d.ts",
          readonly: ["/node_modules/tiny-slug/package.json", "/node_modules/tiny-slug/index.js", "/src/index.ts"],
          files: {
            "/tsconfig.json":
'{\n' +
'  "compilerOptions": {\n' +
'    "target": "ES2020",\n' +
'    "module": "ESNext",\n' +
'    "moduleResolution": "Bundler",\n' +
'    "outDir": "dist",\n' +
'    "strict": true\n' +
'  }\n' +
'}\n',
            "/src/index.ts":
'import { slugify } from "tiny-slug";\n\n' +
'const slug: string = slugify("Hello World");\n' +
'console.log(slug);\n\n' +
'// slugify should only accept strings:\n' +
'// @ts-expect-error\n' +
'slugify(42);\n',
            "/src/types/tiny-slug.d.ts":
'// TODO: declare the "tiny-slug" module here.\n' +
'// It exports one function: slugify(input: string): string\n',
            "/node_modules/tiny-slug/package.json":
'{\n' +
'  "name": "tiny-slug",\n' +
'  "version": "1.0.0",\n' +
'  "main": "index.js"\n' +
'}\n',
            "/node_modules/tiny-slug/index.js":
'export function slugify(input) {\n' +
'  return input.toLowerCase().trim().replace(/\\s+/g, "-");\n' +
'}\n'
          },
          solution: {
            "/src/types/tiny-slug.d.ts":
'declare module "tiny-slug" {\n' +
'  export function slugify(input: string): string;\n' +
'}\n'
          },
          checks: [
            { name: "the import of tiny-slug resolves with types", test: function (ctx) { return !ctx.diagnostics.some(function (d) { return d.code === 7016 || d.code === 2307; }); } },
            { name: "the project builds with no errors", test: function (ctx) { return ctx.errorCount === 0; } }
          ]
        },
        {
          id: "lab3-t2",
          kind: "predict",
          title: "Which imports survive?",
          difficulty: "Medium",
          compilerOptions: { target: "ES2020", module: "ESNext" },
          showFile: "/src/index.ts",
          files: {
            "/src/index.ts":
'import type { User } from "./user";\n' +
'import { formatUser } from "./format";\n' +
'import { version } from "./version";\n\n' +
'const ada: User = { id: 1, name: "Ada" };\n' +
'console.log(formatUser(ada));\n',
            "/src/user.ts":
'export interface User {\n' +
'  id: number;\n' +
'  name: string;\n' +
'}\n',
            "/src/format.ts":
'import type { User } from "./user";\n\n' +
'export function formatUser(user: User): string {\n' +
'  return `#${user.id} ${user.name}`;\n' +
'}\n',
            "/src/version.ts":
'export const version = "1.0.0";\n'
          },
          question: "Which of these import lines are still in the emitted `index.js`?",
          choices: ['`import type { User } from "./user"`', '`import { formatUser } from "./format"`', '`import { version } from "./version"`'],
          correct: [1],
          explanation: "`import type` is always erased. The `./version` import is dropped too: it's never used, and by default tsc removes imports that aren't used as values. Turning on `verbatimModuleSyntax` changes that, so only imports marked `type` get removed."
        },
        {
          id: "lab3-t3",
          kind: "build",
          title: "Set up a path alias",
          difficulty: "Hard",
          prompt: "Deeply nested files end up with imports like <code>../../lib/money</code>. This project wants to write <code>@/lib/money</code> instead, where <code>@/</code> means <code>src/</code>. Add a <code>paths</code> mapping to <code>tsconfig.json</code> so the import resolves. (In a real app, your bundler needs the same alias, since tsc doesn't rewrite the import.)",
          openFile: "/tsconfig.json",
          files: {
            "/tsconfig.json":
'{\n' +
'  "compilerOptions": {\n' +
'    "target": "ES2020",\n' +
'    "module": "ESNext",\n' +
'    "moduleResolution": "Bundler",\n' +
'    "outDir": "dist",\n' +
'    "rootDir": "src",\n' +
'    "strict": true\n' +
'  }\n' +
'}\n',
            "/src/features/billing/invoice.ts":
'import { formatMoney } from "@/lib/money";\n\n' +
'export function invoiceLine(label: string, cents: number): string {\n' +
'  return `${label}: ${formatMoney(cents)}`;\n' +
'}\n',
            "/src/lib/money.ts":
'export function formatMoney(cents: number): string {\n' +
'  return "$" + (cents / 100).toFixed(2);\n' +
'}\n'
          },
          solution: {
            "/tsconfig.json":
'{\n' +
'  "compilerOptions": {\n' +
'    "target": "ES2020",\n' +
'    "module": "ESNext",\n' +
'    "moduleResolution": "Bundler",\n' +
'    "outDir": "dist",\n' +
'    "rootDir": "src",\n' +
'    "strict": true,\n' +
'    "paths": {\n' +
'      "@/*": ["./src/*"]\n' +
'    }\n' +
'  }\n' +
'}\n'
          },
          checks: [
            { name: "tsconfig has a paths entry for @/*", test: function (ctx) { return !!(ctx.options.paths && ctx.options.paths["@/*"]); } },
            { name: "@/lib/money resolves", test: function (ctx) { return !ctx.diagnostics.some(function (d) { return d.code === 2307; }); } },
            { name: "the project builds with no errors", test: function (ctx) { return ctx.errorCount === 0; } }
          ]
        }
      ]
    }
  ];

  var LEVELS = [];
  CHAPTERS.forEach(function (chapter) {
    LEVELS.push({ id: chapter.id, kind: "chapter", title: chapter.title, chapter: chapter, notes: NOTES[chapter.id] || [] });
    LABS.forEach(function (lab) {
      if (lab.after === chapter.id) {
        LEVELS.push({ id: lab.id, kind: "lab", title: lab.title, lab: lab, notes: NOTES[lab.id] || [] });
      }
    });
  });

  window.TSW_CONTENT = { chapters: CHAPTERS, labs: LABS, notes: NOTES, levels: LEVELS };
})();
