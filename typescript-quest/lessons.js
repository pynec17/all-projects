/*
 * lessons.js — the "Guide" tab: a short reference guide for every chapter and lab.
 *
 * Shape of a guide:
 *   minutes   rough reading time
 *   summary   one sentence (markdown: `code`, **bold**)
 *   glance    [[syntax, meaning], ...]   the "at a glance" table
 *   sections  [{ title, blocks }]
 *   gotchas   [{ text, bad?, good? }]
 *
 * Blocks:
 *   "a string"                 a paragraph (keep it to a line or two)
 *   { code, run?, caption? }   a code sample; run: true adds Try it / Show JavaScript
 *   { list: [..] }             bullet points
 *   { tip } / { warn } / { real }   callouts ("Tip", "Watch out", "In real projects")
 *
 * Runnable samples are compiled as standalone scripts (strict mode, no imports),
 * so avoid top-level names that clash with browser globals (name, status, history…).
 */
(function () {
  "use strict";

  // Strip the common indentation so samples can be written indented in this file.
  function c(s) {
    var lines = s.replace(/^\n/, "").replace(/\s+$/, "").split("\n");
    var indent = Infinity;
    lines.forEach(function (l) {
      if (l.trim()) indent = Math.min(indent, l.match(/^ */)[0].length);
    });
    return lines.map(function (l) { return l.slice(indent); }).join("\n");
  }

  var G = {};

  // ------------------------------------------------------------------
  // 1. The Basics
  // ------------------------------------------------------------------
  G.basics = {
    minutes: 5,
    summary: "TypeScript is JavaScript plus a type checker. It catches mistakes like typos and wrong argument types as you write, before the code runs. Then the types are erased.",
    glance: [
      ["let x: string", "annotation: x holds a string"],
      ["let x = 5", "inference: x is number, no annotation needed"],
      ["number[]  /  Array<number>", "array of numbers"],
      ["[string, number]", "tuple: fixed length, a type per position"],
      ['"sm" | "md" | "lg"', "literal union: one of these exact values"],
      ["type Size = …", "type alias: a reusable name for a type"],
      ["unknown", "anything, but must be checked before use"],
      ["any", "anything, checking switched off"],
      ["never", "no possible value (can't happen)"]
    ],
    sections: [
      {
        title: "Checked, then erased",
        blocks: [
          "`tsc` checks your types, then strips them out. What runs is plain JavaScript, so types cost nothing at runtime and can't check data that arrives while the program runs.",
          {
            code: c(`
              function double(n: number) {
                return n * 2;
              }

              console.log(double(21));
            `),
            run: true,
            caption: "Try changing `21` to `\"21\"`, or press Show JavaScript."
          }
        ]
      },
      {
        title: "Annotations and inference",
        blocks: [
          "TypeScript infers types from values. A variable keeps its type, so assigning a different kind of value is an error.",
          {
            code: c(`
              let count = 1;        // number (inferred)
              let title: string;    // annotated, assigned later
              title = "Report";

              count = "three";      // error: string isn't assignable to number
            `),
            run: true
          },
          { tip: "Let locals be inferred. Annotate function parameters and anything other files depend on." }
        ]
      },
      {
        title: "Primitives",
        blocks: [
          {
            list: [
              "`string`, `number` (ints and decimals alike), `boolean`",
              "`null`, `undefined`: only allowed where the type says so under `strict`",
              "`bigint`, `symbol`: rarer",
              "Always lowercase. `String`/`Number` are wrapper objects, not what you want."
            ]
          }
        ]
      },
      {
        title: "Arrays and tuples",
        blocks: [
          {
            code: c(`
              const scores: number[] = [12, 40, 7];
              const mixed = [1, "two"];                 // (string | number)[]
              const entry: [string, number] = ["apples", 5];

              const [label, qty] = entry;               // string, number
              console.log(scores.length, mixed, label, qty * 2);
            `),
            run: true
          },
          { real: "React's `useState` returns a tuple: `const [count, setCount] = useState(0)`." }
        ]
      },
      {
        title: "Literal types and const",
        blocks: [
          "A literal type is one exact value. Unions of them make a fixed set of options. `const` infers the literal; `let` widens to the general type.",
          {
            code: c(`
              type Size = "small" | "medium" | "large";

              let size: Size = "medium";
              size = "huge";          // error: not a Size

              const mode = "dark";    // type "dark"
              let theme = "dark";     // type string
            `),
            run: true
          }
        ]
      },
      {
        title: "any vs unknown vs never",
        blocks: [
          {
            list: [
              "`any`: turns checking off, and spreads to everything it touches. Last resort.",
              "`unknown`: accepts anything, but you must narrow (e.g. `typeof`) before using it. The safe choice.",
              "`never`: no values. Return type of functions that always throw."
            ]
          },
          {
            code: c(`
              function shout(value: unknown) {
                if (typeof value === "string") return value.toUpperCase();
                return "not a string";
              }

              console.log(shout("hi"), shout(42));
            `),
            run: true
          }
        ]
      }
    ],
    gotchas: [
      { text: "Capitalised types are wrapper objects.", bad: 'let t: String = "Hi";', good: 'let t: string = "Hi";' },
      { text: "Types don't exist at runtime. Check values with `typeof`, `Array.isArray` or `instanceof`, never with a type name." },
      { text: "`let total: number = 0` is noise. `let total = 0` already infers `number`." }
    ]
  };

  // ------------------------------------------------------------------
  // 2. Functions
  // ------------------------------------------------------------------
  G.functions = {
    minutes: 4,
    summary: "Annotate what goes in; the return type is inferred, but worth writing on exported functions.",
    glance: [
      ["(a: number, b: number): number", "typed parameters and return type"],
      ["(name?: string)", "optional: type becomes string | undefined"],
      ["(level = 1)", "default: optional, always defined inside"],
      ["(...nums: number[])", "rest: any number of arguments, as an array"],
      ["(): void", "returns nothing useful"],
      ["(): never", "never returns (always throws)"],
      ["type Fn = (x: number) => string", "function type"]
    ],
    sections: [
      {
        title: "Parameters and return types",
        blocks: [
          "Parameters can't be inferred, so they need annotations. Under `strict`, an untyped parameter is an error (`noImplicitAny`).",
          {
            code: c(`
              function total(price: number, quantity: number): number {
                return price * quantity;
              }

              console.log(total(4.5, 3));
              // total("4.5", 3);  // error: string isn't a number
              // total(4.5);       // error: expected 2 arguments
            `),
            run: true
          },
          { tip: "An explicit return type keeps errors inside the function that's wrong, instead of at every caller." }
        ]
      },
      {
        title: "Optional, default and rest",
        blocks: [
          {
            code: c(`
              function greet(person?: string) {
                return "Hi " + (person ?? "there");   // person: string | undefined
              }

              function heading(text: string, level = 1) {
                return "#".repeat(level) + " " + text;  // level: number
              }

              function sum(...nums: number[]) {
                return nums.reduce((a, b) => a + b, 0);
              }

              console.log(greet(), heading("Intro", 2), sum(1, 2, 3));
            `),
            run: true
          },
          {
            list: [
              "Optional and default parameters go after required ones.",
              "`p?: string` lets callers omit it. `p: string | undefined` makes them pass something, even `undefined`."
            ]
          }
        ]
      },
      {
        title: "Function types and callbacks",
        blocks: [
          "Arrow functions infer their whole type from their parameters and body: `const add = (a: number, b: number) => a + b` has the type `(a: number, b: number) => number`.",
          "When a function is assigned to a known function type, its parameters are typed for you (**contextual typing**). That's why callbacks to `map` or `addEventListener` rarely need annotations.",
          {
            code: c(`
              type Formatter = (value: number) => string;

              const asPrice: Formatter = (v) => "£" + v.toFixed(2);   // v: number

              function formatAll(values: number[], format: Formatter) {
                return values.map(format);
              }

              console.log(formatAll([0.5, 1.25], asPrice));
            `),
            run: true
          },
          { real: "Library signatures read the same way: `(event: MouseEvent) => void` for a click handler, `(req, res) => void` for an Express route." }
        ]
      }
    ],
    gotchas: [
      { text: "Optional parameters can be `undefined`.", bad: 'function greet(p?: string) {\n  return p.toUpperCase();\n}', good: 'function greet(p?: string) {\n  return p?.toUpperCase() ?? "THERE";\n}' },
      { text: "Don't type callbacks as `Function` or `any`. Write the shape, e.g. `(id: number) => void`." },
      { text: "`nums.map((n: number) => …)` works, but `n` was already a number." }
    ]
  };

  // ------------------------------------------------------------------
  // 3. Objects & Interfaces
  // ------------------------------------------------------------------
  G.objects = {
    minutes: 5,
    summary: "Interfaces and type aliases describe the shape of objects. Any object with the right shape fits.",
    glance: [
      ["interface User { id: number }", "names an object shape"],
      ["type User = { id: number }", "same thing as a type alias"],
      ["email?: string", "optional property (string | undefined)"],
      ["readonly id: number", "can't be reassigned after creation"],
      ["[key: string]: number", "index signature: any string key"],
      ["Record<string, number>", "same as the index signature above"],
      ["interface B extends A", "B has everything A has, plus more"]
    ],
    sections: [
      {
        title: "Interfaces",
        blocks: [
          {
            code: c(`
              interface User {
                readonly id: number;
                email: string;
                nickname?: string;
              }

              const ada: User = { id: 1, email: "ada@example.com" };
              ada.email = "ada@new.com";   // fine
              // ada.id = 2;               // error: read-only

              console.log(ada.nickname ?? ada.email);
            `),
            run: true,
            caption: "Try removing `email`, or misspelling it."
          },
          {
            list: [
              "Interfaces are erased: they produce no JavaScript.",
              "Optional properties read as `T | undefined`; handle them with `?.`, `??` or an `if`.",
              "`readonly` is compile-time only and shallow: a `readonly string[]` blocks `push`; a `readonly` property holding a `string[]` doesn't."
            ]
          },
          "To \"change\" a read-only object, build a new one with spread syntax. The original stays untouched:",
          {
            code: c(`
              interface Config {
                readonly apiUrl: string;
                readonly timeoutMs: number;
              }

              const base: Config = { apiUrl: "/api", timeoutMs: 1000 };
              const slow: Config = { ...base, timeoutMs: 5000 };   // copy, then override

              console.log(base.timeoutMs, slow.timeoutMs);
            `),
            run: true
          }
        ]
      },
      {
        title: "Structural typing and excess property checks",
        blocks: [
          "Shape is what counts, not names. Extra properties are fine, except in a **fresh object literal**, where they're flagged as likely typos.",
          {
            code: c(`
              interface Point { x: number; y: number }

              function len(p: Point) {
                return Math.hypot(p.x, p.y);
              }

              const pixel = { x: 3, y: 4, colour: "red" };
              console.log(len(pixel));            // fine: has x and y

              len({ x: 3, y: 4, colour: "red" }); // error: excess property
            `),
            run: true
          }
        ]
      },
      {
        title: "Dictionaries",
        blocks: [
          {
            code: c(`
              const prices: Record<string, number> = { "MUG-01": 8 };
              prices["TEE-02"] = 15;

              const missing = prices["NOPE"];   // typed number, actually undefined
              console.log(missing);
            `),
            run: true
          },
          { warn: "Lookups are assumed to succeed. `noUncheckedIndexedAccess` (Lab 2) adds `| undefined` to make them honest." }
        ]
      },
      {
        title: "extends, merging, and interface vs type",
        blocks: [
          {
            list: [
              "`interface Dog extends Animal` inherits every property of `Animal`.",
              "Two interfaces with the same name **merge**. Libraries use this so you can add fields to their types (e.g. Express's `Request`).",
              "`type` can also name unions, tuples and function types; `interface` can only describe objects.",
              "Convention: `interface` for object shapes, `type` for everything else. Be consistent."
            ]
          }
        ]
      }
    ],
    gotchas: [
      { text: "Only fresh literals get the excess property check. A variable with extra properties is accepted." },
      { text: "Reading optional properties without a check.", bad: "user.nickname.toUpperCase()", good: "user.nickname?.toUpperCase() ?? user.email" },
      { text: "`readonly` doesn't freeze anything at runtime. Use `Object.freeze` for that." }
    ]
  };

  // ------------------------------------------------------------------
  // 4. Classes
  // ------------------------------------------------------------------
  G.classes = {
    minutes: 5,
    summary: "TypeScript adds typed properties and access modifiers to JavaScript classes. All checked at compile time, erased at runtime.",
    glance: [
      ["count = 0;  label: string;", "typed properties (must be initialised under strict)"],
      ["public / protected / private", "access: anywhere / class + subclasses / class only"],
      ["constructor(private db: Db) {}", "parameter property: declare + assign in one"],
      ["readonly id: number", "set once, in declaration or constructor"],
      ["static count = 0", "belongs to the class, not instances"],
      ["abstract class / abstract m()", "can't be created; subclasses must implement m"],
      ["class A implements I", "checks A matches interface I (adds no code)"],
      ["#secret", "JavaScript's real runtime-private field"]
    ],
    sections: [
      {
        title: "Properties, modifiers, readonly and static",
        blocks: [
          {
            code: c(`
              class BankAccount {
                static opened = 0;
                readonly id: number;
                private balance = 0;

                constructor(public owner: string) {
                  BankAccount.opened++;
                  this.id = BankAccount.opened;
                }

                deposit(amount: number) {
                  if (amount > 0) this.balance += amount;
                }

                getBalance() {
                  return this.balance;
                }
              }

              const acct = new BankAccount("Sam");
              acct.deposit(50);
              console.log(acct.owner, acct.id, acct.getBalance());
              // acct.balance = 1e6;  // error: private
              // acct.id = 9;         // error: read-only
            `),
            run: true
          },
          "`protected` is like `private`, but subclasses can use it too. Outside code still can't:",
          {
            code: c(`
              class Animal {
                constructor(protected petName: string) {}
              }

              class Dog extends Animal {
                bark() { return this.petName + " says woof"; }   // fine: subclass
              }

              const rex = new Dog("Rex");
              console.log(rex.bark());
              // rex.petName;  // error: protected
            `),
            run: true
          },
          {
            list: [
              "A class is a value (call it with `new`) and a type (`const a: BankAccount`). Unlike an interface, which is erased completely, a class compiles to real JavaScript that exists at runtime.",
              "`public owner: string` in the constructor declares and assigns `this.owner`."
            ]
          },
          { warn: "`private` is compile-time only; it's a normal property in the output. Use `#balance` for real privacy." }
        ]
      },
      {
        title: "abstract and extends",
        blocks: [
          "An abstract class is a partial blueprint: it can't be created with `new`, and its abstract methods must be implemented by every subclass. Call `super()` before using `this`.",
          {
            code: c(`
              abstract class Shape {
                abstract area(): number;
                describe() { return "Area: " + this.area().toFixed(1); }
              }

              class Circle extends Shape {
                constructor(private r: number) { super(); }
                area() { return Math.PI * this.r ** 2; }
              }

              console.log(new Circle(1).describe());
              // new Shape();  // error: abstract
            `),
            run: true
          }
        ]
      },
      {
        title: "implements",
        blocks: [
          {
            code: c(`
              interface Logger { log(message: string): void }

              class ConsoleLogger implements Logger {
                log(message: string) { console.log("[app] " + message); }
              }

              function start(logger: Logger) { logger.log("started"); }
              start(new ConsoleLogger());
            `),
            run: true
          },
          { real: "Depending on an interface (`Logger`) instead of a class lets tests pass in a fake. Angular and NestJS inject dependencies through constructor parameter properties." }
        ]
      }
    ],
    gotchas: [
      { text: "Under `strict`, a declared property with no initial value and no constructor assignment is an error." },
      { text: "`implements` only checks; you still write every method." },
      { text: "Using `this` before `super()` in a subclass constructor is an error." }
    ]
  };

  // ------------------------------------------------------------------
  // 5. Generics
  // ------------------------------------------------------------------
  G.generics = {
    minutes: 5,
    summary: "Generics are type parameters: write code once for many types without losing which type you're using.",
    glance: [
      ["function f<T>(x: T): T", "T is filled in per call, usually inferred"],
      ["f<string>(…)", "pass the type explicitly (rarely needed)"],
      ["<T extends { id: number }>", "constraint: T must have a numeric id"],
      ["keyof T", "union of T's keys"],
      ["T[K]", "type of T's property K"],
      ["interface Box<T> / class Stack<T>", "generic types and classes"],
      ["Array<T>, Promise<T>, Map<K, V>", "built-in generics"]
    ],
    sections: [
      {
        title: "Why: keep the type, unlike any",
        blocks: [
          {
            code: c(`
              function firstAny(items: any[]): any { return items[0]; }
              function first<T>(items: T[]): T | undefined { return items[0]; }

              const a = firstAny(["x"]);  // any: no checking, no autocomplete
              const b = first(["x"]);     // string | undefined

              console.log(a, b?.toUpperCase());
            `),
            run: true
          },
          "`T` is inferred from the arguments. Write it explicitly only when there's nothing to infer from, e.g. `first<string>([])`."
        ]
      },
      {
        title: "Constraints",
        blocks: [
          "Without a constraint you can't use any properties of `T`. `extends` limits what T can be, while the result keeps the caller's full type.",
          {
            code: c(`
              function findById<T extends { id: number }>(items: T[], id: number) {
                return items.find((item) => item.id === id);
              }

              const users = [{ id: 1, email: "a@x.com" }, { id: 2, email: "b@x.com" }];
              console.log(findById(users, 2)?.email);   // email still known
            `),
            run: true
          }
        ]
      },
      {
        title: "keyof and indexed access",
        blocks: [
          {
            code: c(`
              function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
                return obj[key];
              }

              const book = { title: "Dune", pages: 412 };
              const t = getProp(book, "title");   // string
              const p = getProp(book, "pages");   // number
              // getProp(book, "author");         // error

              console.log(t, p);
            `),
            run: true
          }
        ]
      },
      {
        title: "Generic types and classes",
        blocks: [
          {
            code: c(`
              interface ApiResult<T> { ok: boolean; data: T }

              class Stack<T> {
                private items: T[] = [];
                push(item: T) { this.items.push(item); }
                pop(): T | undefined { return this.items.pop(); }
              }

              const undo = new Stack<string>();
              undo.push("typed 'a'");
              const res: ApiResult<number[]> = { ok: true, data: [1, 2, 3] };
              console.log(undo.pop(), res.data.length);
            `),
            run: true
          },
          { real: "`async` functions return `Promise<T>`, and `await` unwraps it. Data-fetching libraries are generic for the same reason: `useQuery<User[]>(…)`." }
        ]
      }
    ],
    gotchas: [
      { text: "Using properties of an unconstrained T.", bad: "function len<T>(x: T) {\n  return x.length;  // error\n}", good: "function len<T extends { length: number }>(x: T) {\n  return x.length;\n}" },
      { text: "If `T` appears only once in a signature, it isn't connecting anything. Use `unknown` instead." },
      { text: "`first<number>([1, 2])` is the same as `first([1, 2])`. Let inference do it." }
    ]
  };

  // ------------------------------------------------------------------
  // 6. Unions, Narrowing & Guards
  // ------------------------------------------------------------------
  G.unions = {
    minutes: 6,
    summary: "A union is \"one of these types\". Narrowing is TypeScript following your checks to work out which one you have.",
    glance: [
      ["string | number", "union: either"],
      ["A & B", "intersection: both at once"],
      ['typeof x === "string"', "narrows primitives"],
      ["Array.isArray(x)  /  x instanceof C", "narrows arrays / class instances"],
      ['"email" in x', "narrows by property"],
      ["if (x)  /  x !== undefined", "removes null/undefined"],
      ["x?.y  /  x ?? fallback", "optional chaining / default"],
      ["(x): x is Cat", "custom type guard"],
      ["const n: never = x", "exhaustiveness check"]
    ],
    sections: [
      {
        title: "Narrowing",
        blocks: [
          "Before narrowing you can only use what every member shares. After a check, each branch knows the exact type.",
          {
            code: c(`
              function describe(value: string | number | string[]) {
                if (typeof value === "string") return "text: " + value.toUpperCase();
                if (Array.isArray(value)) return "list of " + value.length;
                return "number: " + value.toFixed(2);   // only number is left
              }

              console.log(describe("hi"), describe(["a"]), describe(3.14159));
            `),
            run: true
          },
          "Early returns narrow too: after `if (!user) return;`, `user` is defined."
        ]
      },
      {
        title: "null and undefined (strictNullChecks)",
        blocks: [
          "Under `strict`, a value that might be missing says so in its type, and you must handle it. This prevents *Cannot read properties of undefined*.",
          {
            code: c(`
              const emails = ["a@x.com", "b@x.com"];
              const match = emails.find((e) => e.startsWith("c"));  // string | undefined

              // match.length;              // error: possibly undefined
              console.log(match?.length ?? 0);
            `),
            run: true
          },
          { warn: "`match!` (non-null assertion) silences the error without checking anything. Prefer a real check." }
        ]
      },
      {
        title: "Discriminated unions",
        blocks: [
          "Give every variant a shared literal **tag**. Switching on the tag narrows the whole object.",
          {
            code: c(`
              type Shape =
                | { kind: "circle"; radius: number }
                | { kind: "rect"; width: number; height: number };

              function area(shape: Shape): number {
                switch (shape.kind) {
                  case "circle": return Math.PI * shape.radius ** 2;
                  case "rect":   return shape.width * shape.height;
                }
              }

              console.log(area({ kind: "rect", width: 2, height: 5 }));
            `),
            run: true
          },
          { real: "Model request state this way: `{ status: \"loading\" } | { status: \"error\"; message: string } | { status: \"done\"; data: User[] }`. You can't read `data` while loading." }
        ]
      },
      {
        title: "Exhaustiveness checks",
        blocks: [
          "In `default`, every case is handled, so the value is `never`. If someone adds a variant and forgets it, assigning to `never` fails to compile.",
          {
            code: c(`
              type PostState = "draft" | "published" | "archived";

              function badge(state: PostState): string {
                switch (state) {
                  case "draft": return "✏️";
                  case "published": return "✅";
                  default: {
                    const unhandled: never = state;  // error: "archived" not handled
                    return unhandled;
                  }
                }
              }

              console.log(badge("draft"));
            `),
            run: true,
            caption: "Errors on purpose. Add a `case \"archived\":` to fix it."
          }
        ]
      },
      {
        title: "Type guards and intersections",
        blocks: [
          {
            code: c(`
              interface Cat { meow(): string }
              interface Dog { bark(): string }

              function isCat(pet: Cat | Dog): pet is Cat {
                return "meow" in pet;
              }

              function speak(pet: Cat | Dog) {
                return isCat(pet) ? pet.meow() : pet.bark();
              }

              console.log(speak({ bark: () => "woof" }));

              type Timestamps = { createdAt: Date };
              type Post = { title: string } & Timestamps;   // has both
            `),
            run: true
          },
          "TypeScript trusts a guard completely, so keep guards simple and correct."
        ]
      }
    ],
    gotchas: [
      { text: "Asserting instead of checking.", bad: "const user = users.find((u) => u.id === id)!;", good: 'const user = users.find((u) => u.id === id);\nif (!user) throw new Error("Not found");' },
      { text: "Modelling state as optional fields (`loading?`, `error?`, `data?`) allows impossible combinations. Use a discriminated union." },
      { text: "A union has the properties *all* members share; an intersection has *every* member's properties." }
    ]
  };

  // ------------------------------------------------------------------
  // 7. Utility Types & Type Manipulation
  // ------------------------------------------------------------------
  G.utility = {
    minutes: 5,
    summary: "Build new types from existing ones instead of copying them, so they stay in sync.",
    glance: [
      ["keyof T", 'union of T\'s keys, e.g. "id" | "email"'],
      ["typeof value", "the type of a value (in a type position)"],
      ["ReturnType<typeof fn>", "a function's return type"],
      ["Partial<T> / Required<T>", "all properties optional / required"],
      ["Readonly<T>", "all properties read-only (shallow)"],
      ['Pick<T, "a" | "b">', "keep only these keys"],
      ['Omit<T, "a">', "drop these keys"],
      ["Record<K, V>", "object with keys K and values V"],
      ["Exclude<U, X> / Extract<U, X>", "remove / keep union members"],
      ["NonNullable<T>", "remove null and undefined"],
      ["{ [K in keyof T]: … }", "mapped type"],
      ["T extends U ? X : Y", "conditional type"]
    ],
    sections: [
      {
        title: "Types from values",
        blocks: [
          {
            code: c(`
              const defaults = { port: 3000, host: "localhost", debug: false };
              type Settings = typeof defaults;   // { port: number; host: string; debug: boolean }

              function makeUrl(s: Settings) { return s.host + ":" + s.port; }
              type Url = ReturnType<typeof makeUrl>;   // string

              console.log(makeUrl({ ...defaults, port: 8080 }));
            `),
            run: true
          }
        ]
      },
      {
        title: "Reshaping object types",
        blocks: [
          {
            code: c(`
              interface Account {
                id: number;
                email: string;
                passwordHash: string;
              }

              type PublicAccount = Omit<Account, "passwordHash">;
              type AccountUpdate = Partial<Account>;
              type Preview = Pick<Account, "id" | "email">;

              function update(a: Account, changes: AccountUpdate): Account {
                return { ...a, ...changes };
              }

              const acct: Account = { id: 1, email: "a@x.com", passwordHash: "…" };
              const shown: PublicAccount = { id: acct.id, email: acct.email };
              console.log(update(acct, { email: "new@x.com" }).email, shown);
            `),
            run: true
          },
          { real: "`Partial<T>` for update/PATCH payloads, `Omit<T, \"password\">` for what you send to the client." }
        ]
      },
      {
        title: "Record with literal keys",
        blocks: [
          "With a union of literals as keys, `Record` requires every key, which keeps lookup tables complete.",
          {
            code: c(`
              type Role = "admin" | "editor" | "viewer";

              const level: Record<Role, number> = {
                admin: 3,
                editor: 2,
                viewer: 1,
              };

              console.log(level.editor);
            `),
            run: true,
            caption: "Try deleting the `viewer` line."
          }
        ]
      },
      {
        title: "Filtering unions",
        blocks: [
          {
            code: c(`
              type PostState = "draft" | "published" | "archived";

              type Live = Exclude<PostState, "archived">;   // "draft" | "published"
              type Gone = Extract<PostState, "archived">;   // "archived"
              type Text = NonNullable<string | null>;       // string
            `)
          },
          "`Pick`/`Omit` work on **object keys**. `Exclude`/`Extract` work on **union members**."
        ]
      },
      {
        title: "Mapped and conditional types",
        blocks: [
          "The built-ins are written with these. A mapped type loops over keys; a conditional type is a ternary for types (and runs per member of a union).",
          {
            code: c(`
              type Nullable<T> = { [K in keyof T]: T[K] | null };
              type IsString<T> = T extends string ? "yes" : "no";

              // How Exclude is defined:
              type MyExclude<T, U> = T extends U ? never : T;

              const draft: Nullable<{ bio: string; age: number }> = { bio: null, age: 30 };
              const answer: IsString<"hi"> = "yes";
              console.log(draft, answer);
            `),
            run: true
          }
        ]
      }
    ],
    gotchas: [
      { text: "Copy-pasting a type to make a variation. The copy drifts when the original changes." },
      { text: "`Partial<User>` makes `id` optional too.", bad: "type UserUpdate = Partial<User>;", good: 'type UserUpdate = Pick<User, "id"> & Partial<Omit<User, "id">>;' },
      { text: "`Readonly<T>` is shallow: nested objects stay mutable." }
    ]
  };

  // ------------------------------------------------------------------
  // 8. TypeScript in Real Projects
  // ------------------------------------------------------------------
  G["real-world"] = {
    minutes: 6,
    summary: "How TypeScript fits into a real build, and how to handle data and libraries that have no types.",
    glance: [
      ["tsc --noEmit", "type-check only, write no files (use in CI)"],
      ['"strict": true', "turn on all the safety checks"],
      ["const data: unknown = await res.json()", "treat outside data as unknown"],
      ["(v: unknown): v is User", "validate it with a type guard"],
      ["value as User", "assertion: no check at all"],
      ["{ … } satisfies Config", "checked, keeps the precise type"],
      ["import type { User } from …", "type-only import, always erased from the output"],
      ["npm i -D @types/x", "community types for a JS package"],
      ['declare module "x" { … }', "write types for an untyped package"]
    ],
    sections: [
      {
        title: "Where type checking happens",
        blocks: [
          "Bundlers like Vite, esbuild and Next.js usually **strip types without checking them**. Your app builds even with type errors. Checking happens in the editor and in a `tsc --noEmit` step.",
          {
            code: c(`
              // package.json
              "scripts": {
                "dev": "vite",
                "build": "tsc --noEmit && vite build",
                "typecheck": "tsc --noEmit"
              }
            `)
          },
          { real: "If CI doesn't run `tsc`, type errors get merged. It's worth checking in any new codebase." }
        ]
      },
      {
        title: "tsconfig essentials",
        blocks: [
          {
            code: c(`
              {
                "compilerOptions": {
                  "target": "ES2022",     // JS syntax to emit
                  "module": "ESNext",     // import/export style to emit
                  "strict": true,         // noImplicitAny, strictNullChecks, …
                  "outDir": "dist",       // where output goes
                  "skipLibCheck": true    // don't re-check node_modules types
                },
                "include": ["src"]
              }
            `)
          },
          "The Project Labs cover these settings with the real compiler."
        ]
      },
      {
        title: "Validating outside data",
        blocks: [
          "`JSON.parse` and `res.json()` return `any`. Treat the result as `unknown` and validate it before trusting it.",
          {
            code: c(`
              interface User { id: number; email: string }

              function isUser(v: unknown): v is User {
                return typeof v === "object" && v !== null &&
                  "id" in v && typeof v.id === "number" &&
                  "email" in v && typeof v.email === "string";
              }

              const raw: unknown = JSON.parse('{"id": 1, "email": "ada@x.com"}');
              console.log(isUser(raw) ? "valid: " + raw.email : "bad data");
            `),
            run: true,
            caption: "Change `\"id\": 1` to `\"id\": \"1\"` and run it."
          },
          { real: "Most projects use **Zod** for this: one schema gives you the runtime check and the type (`z.infer<typeof UserSchema>`)." }
        ]
      },
      {
        title: "as vs satisfies",
        blocks: [
          {
            code: c(`
              type Route = { path: string; auth: boolean };

              const routes = {
                home: { path: "/", auth: false },
                settings: { path: "/settings", auth: true },
              } satisfies Record<string, Route>;

              console.log(routes.settings.path);   // exact keys still known

              const wrong = { path: 42 } as unknown as Route;  // compiles. It's a lie.
              console.log(typeof wrong.path);
            `),
            run: true
          },
          {
            list: [
              "`as` checks nothing. Use it only when you really know better (e.g. a DOM element's exact type).",
              "`satisfies` checks against the type but keeps the inferred one.",
              "`as unknown as X` is a red flag."
            ]
          }
        ]
      },
      {
        title: "Untyped libraries",
        blocks: [
          "*Could not find a declaration file for module 'x'*: check for built-in types, then `@types/x`, then declare it yourself in a `.d.ts` file.",
          {
            code: c(`
              // src/types/legacy-lib.d.ts
              declare module "legacy-lib" {
                export function slugify(input: string): string;
              }
            `)
          }
        ]
      },
      {
        title: "Type-only imports",
        blocks: [
          "When you import something only to use as a type, say so with `import type`. It's guaranteed to be erased, so it never pulls the other module in at runtime. Build tools that compile one file at a time (esbuild, Vite) rely on this.",
          {
            code: c(`
              import type { User } from "./user";     // erased completely
              import { formatUser } from "./format";  // a real import, kept
            `)
          }
        ]
      }
    ],
    gotchas: [
      { text: "Trusting API responses.", bad: "const user: User = await res.json();", good: 'const data: unknown = await res.json();\nif (!isUser(data)) throw new Error("Bad response");' },
      { text: "Assuming `vite build` catches type errors. It doesn't; run `tsc --noEmit`." },
      { text: "`declare module \"x\";` with no body makes every import `any`. Fine as a stopgap, not a fix." }
    ]
  };

  // ------------------------------------------------------------------
  // Lab 1: Project setup
  // ------------------------------------------------------------------
  G["lab-1"] = {
    minutes: 3,
    summary: "What `tsc` does with a whole project, and where its output goes.",
    glance: [
      ["tsc", "check every file in the project, then emit .js"],
      ['"include": ["src"]', "which files are part of the project"],
      ['"outDir": "dist"', "write output here instead of next to sources"],
      ['"rootDir": "src"', "which folder structure the output mirrors"],
      ['"strict": true', "noImplicitAny, strictNullChecks and more"],
      ['"noEmitOnError": true', "don't write output if there are errors"]
    ],
    sections: [
      {
        title: "What tsc does",
        blocks: [
          {
            list: [
              "Reads `tsconfig.json` and collects the files it covers.",
              "Type-checks them **together**, so calls between files are checked.",
              "Emits one `.js` per `.ts`, even if there are errors (unless `noEmitOnError`)."
            ]
          }
        ]
      },
      {
        title: "What's erased",
        blocks: [
          "Interfaces, type aliases, annotations, `<T>`, `as` and modifiers like `private` all disappear. Only `enum`, parameter properties and decorators generate code.",
          {
            code: c(`
              interface User { id: number; email: string }
              type Role = "admin" | "member";

              function welcome(user: User, role: Role): string {
                return "Hi " + user.email + " (" + role + ")";
              }

              console.log(welcome({ id: 1, email: "ada@x.com" }, "admin"));
            `),
            run: true,
            caption: "Press Show JavaScript to see what survives."
          }
        ]
      },
      {
        title: "outDir and rootDir",
        blocks: [
          {
            code: c(`
              src/index.ts        →  dist/index.js
              src/utils/math.ts   →  dist/utils/math.js
            `)
          },
          "Without `outDir`, `.js` files land next to the `.ts` files. Without `rootDir`, tsc guesses the root from the inputs, so the layout can shift when files are added.",
          { real: "`dist/` goes in `.gitignore`. Commit source, rebuild output." }
        ]
      },
      {
        title: "Turning on strict",
        blocks: [
          "The errors that appear are usually real: places where a value can be `undefined` and the code doesn't handle it. Fix them with a check or a default.",
          {
            code: c(`
              const user = findUser(2);              // User | undefined
              if (!user) throw new Error("No user 2");
              console.log(user.email);               // narrowed to User
            `)
          }
        ]
      }
    ],
    gotchas: [
      { text: "Editing files in `dist/`. They're overwritten on the next build." }
    ]
  };

  // ------------------------------------------------------------------
  // Lab 2: tsconfig deep-dive
  // ------------------------------------------------------------------
  G["lab-2"] = {
    minutes: 4,
    summary: "`target` and `module` decide what the emitted JavaScript looks like. Get them wrong and correct code crashes at runtime.",
    glance: [
      ['"target": "ES2017"', "emit ES2017 syntax; newer syntax is rewritten"],
      ['"module": "CommonJS"', "emit require() / exports"],
      ['"module": "ESNext"', "keep import / export"],
      ['"module": "NodeNext"', "follow Node's rules (package.json \"type\")"],
      ['import "./greet.js"', "Node ESM needs the extension, even from .ts"],
      ['"noUncheckedIndexedAccess": true', "arr[i] and obj[key] include | undefined"]
    ],
    sections: [
      {
        title: "target",
        blocks: [
          {
            code: c(`
              // You write:
              const port = config.port ?? 3000;

              // target ES2020+: unchanged.  target ES2017 (no ??):
              const port = (_a = config.port) !== null && _a !== void 0 ? _a : 3000;
            `)
          },
          "Only syntax **newer than the target** is rewritten. Useful dates:",
          {
            list: [
              "ES2015: arrow functions, `let`/`const`, classes, template literals",
              "ES2017: `async` / `await`",
              "ES2020: `??` and `?.`",
              "ES2022: class fields with `#private`, top-level `await`"
            ]
          },
          "So with `\"target\": \"ES2017\"`, `??` and `?.` get rewritten, while arrow functions and template literals are left alone.",
          "`target` rewrites **syntax** only. It doesn't add missing built-ins like `Array.prototype.at`; that's `lib` and polyfills."
        ]
      },
      {
        title: "module",
        blocks: [
          {
            code: c(`
              // You write:
              import { greet } from "./greet.js";
              export const main = () => greet("world");

              // module: CommonJS emits:
              const greet_js_1 = require("./greet.js");
              const main = () => (0, greet_js_1.greet)("world");
              exports.main = main;
            `)
          },
          "Must match how the code is loaded. With `\"type\": \"module\"` in package.json, CommonJS output fails with *require is not defined in ES module scope*."
        ]
      },
      {
        title: "Why .js in a .ts import",
        blocks: [
          "Node's ES modules need full extensions, and tsc doesn't rewrite paths. So you write the path that's correct after compiling: `./greet.js`. `NodeNext` maps it back to `greet.ts` for checking.",
          { tip: "Bundler projects use `\"moduleResolution\": \"bundler\"` and don't need extensions." }
        ]
      },
      {
        title: "noUncheckedIndexedAccess",
        blocks: [
          "Not part of `strict`. Makes index lookups honest, at the cost of more checks.",
          {
            code: c(`
              const names = ["Ada", "Grace"];
              const third = names[2];   // string, or string | undefined with the flag

              console.log(third?.toUpperCase() ?? "nobody");
            `),
            run: true
          }
        ]
      }
    ],
    gotchas: [
      { text: "Expecting `target` to polyfill. It only rewrites syntax." },
      { text: "Writing `./greet` or `./greet.ts` in code Node runs as ESM. Write `./greet.js`." }
    ]
  };

  // ------------------------------------------------------------------
  // Lab 3: Real-world project
  // ------------------------------------------------------------------
  G["lab-3"] = {
    minutes: 4,
    summary: "Typing an untyped library, knowing which imports survive, and path aliases.",
    glance: [
      ['declare module "x" { export … }', "types for an untyped package (.d.ts)"],
      ['declare module "x";', "shorthand: every import is any"],
      ["import type { T } from …", "always erased from the output"],
      ['"verbatimModuleSyntax": true', "only type imports are removed; the rest kept as written"],
      ['"paths": { "@/*": ["./src/*"] }', "import alias for the type checker"]
    ],
    sections: [
      {
        title: "Declaring an untyped module",
        blocks: [
          {
            code: c(`
              // src/types/tiny-slug.d.ts
              declare module "tiny-slug" {
                export function slugify(input: string): string;
              }
            `)
          },
          "Put it anywhere `include` covers. Describe only what you use."
        ]
      },
      {
        title: "Which imports survive",
        blocks: [
          {
            code: c(`
              import type { User } from "./types";    // erased
              import { formatUser } from "./format";  // kept: used as a value
              import { version } from "./version";    // dropped by default if unused
              import "./polyfills";                   // kept: side effects
            `)
          },
          "Tools that compile one file at a time (esbuild, `isolatedModules`) can't tell whether an import is type-only, so mark it with `import type`."
        ]
      },
      {
        title: "Path aliases",
        blocks: [
          {
            code: c(`
              {
                "compilerOptions": {
                  "paths": { "@/*": ["./src/*"] }
                }
              }
            `)
          },
          "tsc doesn't rewrite `@/lib/money` in the output. The bundler or runtime needs the same alias (Vite `resolve.alias`; Next.js reads tsconfig; `tsc-alias` for Node)."
        ]
      }
    ],
    gotchas: [
      { text: "Adding `paths` and expecting it to work at runtime. Configure the bundler too." }
    ]
  };

  window.TSW_LESSONS = G;
})();
