/*
 * lessons.js — the "Guide" tab: a reference guide for every chapter and lab.
 *
 * Written for someone who knows JavaScript and is new to TypeScript.
 *
 * Shape of a guide:
 *   minutes   rough reading time
 *   summary   one or two sentences (markdown: `code`, **bold**)
 *   glance    [[syntax, meaning], ...]   the "at a glance" table
 *   sections  [{ title, blocks }]
 *   gotchas   [{ text, bad?, good? }]
 *
 * Blocks:
 *   "a string"                 a paragraph
 *   { code, run?, caption? }   a code sample; run: true adds Try it / Show JavaScript
 *   { list: [..] }             bullet points
 *   { tip } / { warn } / { real }   callouts ("Tip", "Watch out", "In real projects")
 *
 * Runnable samples are compiled as standalone scripts (strict mode, no imports),
 * so avoid top-level names that clash with browser globals (name, status, history…),
 * and keep console.log calls synchronous (async output isn't captured).
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

  // ==================================================================
  // 1. The Basics
  // ==================================================================
  G.basics = {
    minutes: 9,
    summary: "TypeScript is JavaScript with a type checker built in. You write the JavaScript you already know, add types where they help, and TypeScript catches mistakes like typos and wrong argument types as you write, before the code runs. Then the types are erased.",
    glance: [
      ["let x: string", "annotation: x holds a string"],
      ["let x = 5", "inference: x is number, no annotation needed"],
      ["number[]  /  Array<number>", "array of numbers"],
      ["[string, number]", "tuple: fixed length, a type per position"],
      ["string | number", "union: either a string or a number"],
      ['"small" | "medium" | "large"', "literal union: one of these exact values"],
      ["type Size = …", "type alias: a reusable name for a type"],
      ["as const", "infer exact values and make them read-only"],
      ["unknown", "anything, but must be checked before use"],
      ["any", "anything, checking switched off"],
      ["never", "no possible value (can't happen)"]
    ],
    sections: [
      {
        title: "What TypeScript adds to JavaScript",
        blocks: [
          "TypeScript is a **superset** of JavaScript: the JavaScript you already know is valid TypeScript. What it adds is a way to say what kind of value each variable, parameter and property holds. Those descriptions are **types**.",
          "The TypeScript compiler (`tsc`) reads your code and checks that every value is used in a way its type allows. You mostly experience this in your editor: errors are underlined as you type, and autocomplete knows exactly which properties and methods exist.",
          {
            code: c(`
              function double(n: number) {
                return n * 2;
              }

              console.log(double(21));
            `),
            run: true,
            caption: "Try changing `21` to `\"21\"`, or press Show JavaScript."
          },
          "Once the code checks out, the types are **erased**: the compiler strips them out and produces plain JavaScript. That JavaScript is all the browser or Node ever runs. Press **Show JavaScript** above to see it.",
          "What that means in practice:",
          {
            list: [
              "Types cost nothing at runtime. They don't slow anything down or change what the code does.",
              "Types can't check data that arrives while the program runs, like an API response or user input. Chapter 8 covers how to handle that.",
              "You can't test a type in an `if` at runtime. You check values with ordinary JavaScript: `typeof`, `Array.isArray`, `instanceof`."
            ]
          }
        ]
      },
      {
        title: "Annotations and inference",
        blocks: [
          "You can give something a type by writing a colon after its name. This is a **type annotation**:",
          {
            code: c(`
              let city: string = "Leeds";
              let population: number = 812000;
              let isCapital: boolean = false;
            `)
          },
          "Most of the time you don't need to. TypeScript **infers** a variable's type from the value you give it, and you get exactly the same checking. Once a variable has a type it keeps it, so assigning a different kind of value later is an error:",
          {
            code: c(`
              let city = "Leeds";   // inferred: string
              let count = 1;        // inferred: number

              count = count + 1;    // fine
              count = "three";      // error: string isn't assignable to number
            `),
            run: true
          },
          "Inference needs a value to go on. When a variable starts empty or gets its value later, annotate it, or TypeScript can't help you:",
          {
            code: c(`
              let title: string;           // assigned later
              const ids: number[] = [];    // an empty array says nothing about its contents

              title = "Report";
              ids.push(7);
            `)
          },
          { tip: "A good rule: let TypeScript infer local variables, and annotate function parameters (it can't infer those) and anything other files depend on." }
        ]
      },
      {
        title: "Primitive types",
        blocks: [
          "These are the basic building blocks, matching JavaScript's own primitive values:",
          {
            list: [
              "`string`: text, in any kind of quotes.",
              "`number`: integers and decimals alike. There's no separate `int` or `float`.",
              "`boolean`: `true` or `false`.",
              "`null` and `undefined`: \"no value\". Under strict mode (below) they're only allowed where a type says so.",
              "`bigint` (`10n`) and `symbol`: rarer; you'll know when you need them."
            ]
          },
          { warn: "Always use the lowercase names. `String`, `Number` and `Boolean` with a capital letter are JavaScript's wrapper objects, which you almost never want as types." }
        ]
      },
      {
        title: "Arrays and tuples",
        blocks: [
          "An array type is the element type followed by `[]`. `Array<number>` is another way to write `number[]`. TypeScript then checks everything you put in and everything you take out:",
          {
            code: c(`
              const scores: number[] = [12, 40, 7];
              scores.push(19);            // fine
              // scores.push("nine");     // error: string isn't a number

              const best = Math.max(...scores);   // number
              const tags = ["ts", "web"];         // inferred: string[]
              console.log(best, tags.join(", "));
            `),
            run: true
          },
          "If an array mixes types, TypeScript infers a union (see the next section): `[1, \"two\"]` becomes `(string | number)[]`.",
          "A **tuple** is an array with a fixed length and a known type at each position. Use one for small, ordered groups of values where position has meaning, like coordinates or a key and value:",
          {
            code: c(`
              const point: [number, number] = [3, 4];
              const entry: [string, number] = ["apples", 5];

              const [label, qty] = entry;   // label: string, qty: number
              console.log(label, qty * 2, point[0] + point[1]);
              // point[2];                   // error: the tuple only has 2 elements
            `),
            run: true
          },
          { real: "You use tuples without noticing. React's `useState` returns one (`const [count, setCount] = useState(0)`), and `Object.entries(obj)` returns an array of `[key, value]` tuples." }
        ]
      },
      {
        title: "Union types: this or that",
        blocks: [
          "`|` combines types into a **union**: a value that can be any one of them. Read `|` as \"or\". Unions are everywhere in TypeScript, because real values often come in more than one form: an id might be a number from a database or a string from a URL.",
          {
            code: c(`
              let id: string | number = 42;
              id = "A-42";     // fine: strings are allowed too
              // id = true;    // error: boolean isn't in the union

              let nickname: string | undefined;   // a string, or not set yet
              console.log(id, nickname);
            `),
            run: true
          },
          "`T | undefined` is how TypeScript says \"might be missing\". You'll see it constantly, and TypeScript makes you check for `undefined` before using the value. Chapter 4 covers working with unions in depth."
        ]
      },
      {
        title: "Type aliases, literal types and as const",
        blocks: [
          "`type Name = ...` creates a **type alias**: a reusable name for any type, so you don't repeat it everywhere.",
          "A **literal type** is one exact value rather than a kind of value. The type `\"small\"` allows only the string `\"small\"`. A union of literals gives you a fixed set of options, which is TypeScript's lightweight version of an enum:",
          {
            code: c(`
              type Size = "small" | "medium" | "large";

              let size: Size = "medium";
              size = "large";   // fine
              size = "huge";    // error: not a Size
            `),
            run: true
          },
          "Literal types explain a difference between `let` and `const`. A `const` can never change, so TypeScript infers the exact literal. A `let` could be reassigned, so its type **widens** to the general one:",
          {
            code: c(`
              const mode = "dark";   // type: "dark"
              let theme = "dark";    // type: string
            `)
          },
          "Objects and arrays widen too, because their contents can change. Adding `as const` tells TypeScript to infer the exact values and make everything read-only. It's handy for fixed lists and config:",
          {
            code: c(`
              const sizes = ["small", "medium", "large"] as const;
              // type: readonly ["small", "medium", "large"]

              const settings = { theme: "dark", retries: 3 } as const;
              // settings.theme is "dark" (not string), and can't be reassigned

              console.log(sizes[0], settings.theme);
            `),
            run: true
          },
          { tip: "Many codebases prefer unions of string literals to the `enum` keyword: at runtime they're just strings, and they need no import." }
        ]
      },
      {
        title: "any, unknown and never",
        blocks: [
          "Three special types work differently from the rest.",
          "**`any`** switches type checking off for a value. You can do anything with it and TypeScript won't complain, which means it can't help either. It also spreads: anything you get out of an `any` is `any` too. Treat it as a last resort.",
          "**`unknown`** also accepts any value, but you can't *use* it until you've checked what it is. That makes it the safe choice for values you don't control yet:",
          {
            code: c(`
              function shout(value: unknown) {
                // value.toUpperCase();   // error: 'value' is of type 'unknown'
                if (typeof value === "string") {
                  return value.toUpperCase();   // fine: we checked it's a string
                }
                return "not a string";
              }

              console.log(shout("hi"), shout(42));
            `),
            run: true
          },
          "Inside `if (typeof value === \"string\")`, TypeScript knows `value` is a string. Checking a value to pin down its type like this is called **narrowing**; chapter 4 covers it in depth.",
          "**`never`** is the type with no possible values. You'll see it as the return type of functions that never finish normally (they always throw), and in chapter 4 as a way to make sure every case is handled.",
          {
            code: c(`
              function fail(message: string): never {
                throw new Error(message);
              }
            `)
          }
        ]
      },
      {
        title: "Strict mode",
        blocks: [
          "Projects switch on `\"strict\": true` in their TypeScript config (`tsconfig.json`). It turns on the checks that make TypeScript worth using, including:",
          {
            list: [
              "no value can silently end up as `any`",
              "`null` and `undefined` must be handled before a value is used"
            ]
          },
          {
            code: c(`
              function greet(person: string) {
                return "Hi " + person.toUpperCase();
              }

              greet(undefined);   // error under strict: undefined isn't a string
            `),
            run: true,
            caption: "Errors on purpose. Without strict mode this would compile and then crash."
          },
          "Every example, quiz and challenge here assumes strict mode. Lab 1 shows how to turn it on in a real project."
        ]
      }
    ],
    gotchas: [
      { text: "Capitalised types are wrapper objects.", bad: 'let t: String = "Hi";', good: 'let t: string = "Hi";' },
      { text: "Types don't exist at runtime. Check values with `typeof`, `Array.isArray` or `instanceof`, never with a type name." },
      { text: "An empty array gives inference nothing to go on.", bad: "const ids = [];", good: "const ids: number[] = [];" },
      { text: "`let total: number = 0` is noise. `let total = 0` already infers `number`." }
    ]
  };

  // ==================================================================
  // 2. Functions
  // ==================================================================
  G.functions = {
    minutes: 8,
    summary: "Functions are where types pay off most, because they're the contracts between the parts of your program. Annotate what goes in; TypeScript infers what comes out, though it's often worth writing that too.",
    glance: [
      ["(a: number, b: number): number", "typed parameters and return type"],
      ["(name?: string)", "optional: type becomes string | undefined"],
      ["(level = 1)", "default: optional, always defined inside"],
      ["(...nums: number[])", "rest: any number of arguments, as an array"],
      ["(): void", "returns nothing useful"],
      ["(): never", "never returns (always throws)"],
      ["type Fn = (x: number) => string", "function type"],
      ["function f(x: string): number;", "overload signature"]
    ],
    sections: [
      {
        title: "Parameters and return types",
        blocks: [
          "Parameters are the one place TypeScript can't infer a type, because it can't see who will call the function. So you annotate them:",
          {
            code: c(`
              function total(price: number, quantity: number): number {
                return price * quantity;
              }

              console.log(total(4.5, 3));
              // total("4.5", 3);   // error: string isn't a number
              // total(4.5);        // error: expected 2 arguments, got 1
            `),
            run: true
          },
          "TypeScript also checks the **number** of arguments. JavaScript would silently pass `undefined` for a missing one, or ignore extras; TypeScript makes both an error.",
          "The `: number` after the parentheses is the **return type**. TypeScript would infer it here, so it's optional, but writing it states the contract. If you later change the body and accidentally return something else, the error appears inside the function, where the mistake is, instead of at every place that calls it.",
          "Under strict mode, a parameter with no type is an error: *Parameter 'x' implicitly has an 'any' type*. That's the `noImplicitAny` check, and it stops untyped holes from creeping in.",
          { real: "Explicit return types are most worth it on exported functions. They're your module's public API, and they keep error messages pointing at the right file." }
        ]
      },
      {
        title: "Optional and default parameters",
        blocks: [
          "Put `?` after a parameter's name to make it optional. Callers can leave it out, so inside the function its type becomes `string | undefined`, and TypeScript makes you handle the missing case:",
          {
            code: c(`
              function greet(person?: string) {
                // return "Hi " + person.toUpperCase();   // error: possibly undefined
                return "Hi " + (person ?? "there");
              }

              console.log(greet("Sam"));
              console.log(greet());
            `),
            run: true
          },
          "A **default value** also makes a parameter optional, but inside the function it's always defined. TypeScript infers the type from the default, so you rarely need an annotation:",
          {
            code: c(`
              function heading(text: string, level = 1) {
                return "#".repeat(level) + " " + text;   // level: number, never undefined
              }

              console.log(heading("Intro"));
              console.log(heading("Details", 3));
            `),
            run: true
          },
          "Optional and default parameters must come after the required ones.",
          { tip: "`person?: string` lets callers leave the argument out. `person: string | undefined` makes them pass *something*, even if it's `undefined`. The `?` form is what you usually want." }
        ]
      },
      {
        title: "Rest parameters",
        blocks: [
          "A rest parameter (`...`) collects any number of arguments into an array, so its type is always an array type. You can still call it with an existing array by spreading it:",
          {
            code: c(`
              function sum(...nums: number[]): number {
                return nums.reduce((total, n) => total + n, 0);
              }

              const values = [5, 10, 15];
              console.log(sum(), sum(1, 2), sum(...values));
            `),
            run: true
          }
        ]
      },
      {
        title: "void and never",
        blocks: [
          "A function that doesn't return anything useful has the return type **`void`**. Logging, saving and updating the page are typical `void` functions. TypeScript infers it automatically when there's no `return` with a value.",
          "**`never`** is stronger: the function can't finish normally at all, because it always throws or runs forever. It's useful for helpers like `fail()`, and TypeScript understands that code after calling one is unreachable.",
          {
            code: c(`
              function log(message: string): void {
                console.log(message);
              }

              function crash(reason: string): never {
                throw new Error(reason);
              }
            `)
          }
        ]
      },
      {
        title: "Arrow functions, callbacks and function types",
        blocks: [
          "Arrow functions infer their whole type from their parameters and body: `const add = (a: number, b: number) => a + b` has the type `(a: number, b: number) => number`.",
          "To describe a function you'll pass around, like a callback, write a **function type**: the parameters, then `=>`, then the return type.",
          {
            code: c(`
              type Formatter = (value: number) => string;

              const asPrice: Formatter = (v) => "£" + v.toFixed(2);   // v: number
              const asPercent: Formatter = (v) => Math.round(v * 100) + "%";

              function formatAll(values: number[], format: Formatter) {
                return values.map(format);
              }

              console.log(formatAll([0.5, 1.25], asPrice));
              console.log(formatAll([0.5, 1.25], asPercent));
            `),
            run: true
          },
          "Notice `(v) =>` needed no annotation. Because `asPrice` is declared as a `Formatter`, TypeScript already knows `v` is a number. This is **contextual typing**, and it's why callbacks you pass to `map`, `filter` or `addEventListener` rarely need annotations.",
          { real: "Most function types you meet come from libraries: `(event: MouseEvent) => void` for a click handler, `(req, res) => void` for an Express route. Reading these signatures is how you learn what a library expects from you." }
        ]
      },
      {
        title: "Overloads",
        blocks: [
          "Occasionally a function genuinely accepts different kinds of argument and returns a different type for each. **Overloads** list each call signature separately, followed by one implementation that handles them all:",
          {
            code: c(`
              function parse(input: string): number;
              function parse(input: string[]): number[];
              function parse(input: string | string[]) {
                return Array.isArray(input) ? input.map(Number) : Number(input);
              }

              const one = parse("42");          // number
              const many = parse(["1", "2"]);   // number[]
              console.log(one, many);
            `),
            run: true
          },
          "Callers only see the overload signatures, so each call gets a precise return type. Reach for overloads rarely: a union parameter, or a generic (chapter 6), is usually simpler."
        ]
      }
    ],
    gotchas: [
      { text: "Forgetting that optional parameters can be `undefined`.", bad: "function greet(p?: string) {\n  return p.toUpperCase();\n}", good: 'function greet(p?: string) {\n  return p?.toUpperCase() ?? "THERE";\n}' },
      { text: "Putting an optional parameter before a required one. `function f(a?: string, b: number)` is an error; reorder them, or give `a` a default." },
      { text: "Typing callbacks as `Function` or `any`. Write the real shape, like `(id: number) => void`, so the functions people pass in get checked." },
      { text: "Annotating callback parameters that are already contextually typed. `nums.map((n: number) => …)` works, but `n` was already a number." }
    ]
  };

  // ==================================================================
  // 3. Objects & Interfaces
  // ==================================================================
  G.objects = {
    minutes: 9,
    summary: "Most data in a real app is objects: users, orders, settings, API responses. You describe their shape with object types and interfaces, and any object with the right shape fits.",
    glance: [
      ["{ x: number; y: number }", "inline object type"],
      ["interface User { id: number }", "names an object shape"],
      ["type User = { id: number }", "same thing, as a type alias"],
      ["email?: string", "optional property (string | undefined)"],
      ["readonly id: number", "can't be reassigned after creation"],
      ["items: LineItem[]", "property holding an array of objects"],
      ["[key: string]: number", "index signature: any string key"],
      ["Record<string, number>", "same as the index signature above"],
      ["interface B extends A", "B has everything A has, plus more"]
    ],
    sections: [
      {
        title: "Object types",
        blocks: [
          "The simplest way to describe an object is inline: list its properties and their types in braces, separated by `;` or `,`:",
          {
            code: c(`
              function printCoord(pt: { x: number; y: number }) {
                console.log("x is " + pt.x + ", y is " + pt.y);
              }

              printCoord({ x: 3, y: 7 });
              // printCoord({ x: 3 });   // error: property 'y' is missing
            `),
            run: true
          },
          "TypeScript now checks every object passed in, and autocompletes `pt.` with exactly `x` and `y`. Once a shape is needed in more than one place, give it a name."
        ]
      },
      {
        title: "Interfaces",
        blocks: [
          "An **interface** gives a name to an object shape, so you can reuse it:",
          {
            code: c(`
              interface User {
                id: number;
                email: string;
                isAdmin: boolean;
              }

              const ada: User = { id: 1, email: "ada@example.com", isAdmin: true };

              function label(user: User) {
                return user.email + (user.isAdmin ? " (admin)" : "");
              }

              console.log(label(ada));
            `),
            run: true,
            caption: "Try removing `isAdmin` from `ada`, or misspelling `email`."
          },
          "Leave a property out, misspell one, or give one the wrong type, and the error appears right where you created the object, not later where it's used. Like all types, an interface is erased when compiled: it produces no JavaScript."
        ]
      },
      {
        title: "Optional and readonly properties",
        blocks: [
          "`?` marks a property that might be missing. `readonly` marks one that's set when the object is created and can't be reassigned afterwards:",
          {
            code: c(`
              interface Product {
                readonly sku: string;
                title: string;
                description?: string;   // string | undefined
              }

              const mug: Product = { sku: "MUG-01", title: "Mug" };
              mug.title = "Big mug";     // fine
              // mug.sku = "MUG-02";     // error: sku is read-only

              console.log(mug.description?.length ?? "no description");
            `),
            run: true
          },
          "Reading an optional property gives you `T | undefined`, so handle the missing case with `?.`, `??` or an `if`.",
          "To \"change\" a read-only object, build a new one with spread syntax. The original stays untouched, which is exactly what state updates in React and Redux rely on:",
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
          },
          { warn: "`readonly` is checked at compile time only, and it's shallow. A `readonly items: string[]` can't be replaced, but you can still `push` to it. Write `readonly string[]` to block that too." }
        ]
      },
      {
        title: "Nested objects and arrays of objects",
        blocks: [
          "Types compose: a property can be another object type, an array of objects, or a union. This is how real data, like an API response, is usually described:",
          {
            code: c(`
              interface LineItem {
                sku: string;
                qty: number;
              }

              interface Order {
                id: number;
                customer: { email: string; vip: boolean };
                items: LineItem[];
              }

              const order: Order = {
                id: 7,
                customer: { email: "a@x.com", vip: false },
                items: [{ sku: "MUG", qty: 2 }, { sku: "TEE", qty: 1 }],
              };

              const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);
              console.log(order.customer.email, totalQty);
            `),
            run: true
          },
          "Inside `reduce`, `item` is known to be a `LineItem` without any annotation: TypeScript follows the types all the way down."
        ]
      },
      {
        title: "Structural typing: shape is what counts",
        blocks: [
          "TypeScript cares about **shape, not names**. Any object with the right properties fits a type, even if it was never declared as one. This is called **structural typing**:",
          {
            code: c(`
              interface Point { x: number; y: number }

              function len(p: Point) {
                return Math.hypot(p.x, p.y);
              }

              const pixel = { x: 3, y: 4, colour: "red" };
              console.log(len(pixel));             // fine: it has x and y

              len({ x: 3, y: 4, colour: "red" });  // error: excess property
            `),
            run: true
          },
          "`pixel` was never declared a `Point`, and it has an extra property, but it has everything a `Point` needs, so it's accepted.",
          "The last line is the exception. When you write an object literal *directly* where a type is expected, TypeScript runs an **excess property check** and rejects properties the type doesn't list, because extra keys in a fresh literal are almost always typos."
        ]
      },
      {
        title: "Dictionaries: index signatures and Record",
        blocks: [
          "Sometimes you don't know the keys in advance: prices by product code, word counts, feature flags. An **index signature** says \"any string key, and every value has this type\". `Record<string, number>` means the same thing and is what you'll see most:",
          {
            code: c(`
              interface PriceList {
                [code: string]: number;
              }

              const prices: PriceList = { "MUG-01": 8 };
              const stock: Record<string, number> = { "MUG-01": 40 };

              prices["TEE-02"] = 15;
              const missing = prices["NOPE"];   // typed number, actually undefined
              console.log(prices, stock["MUG-01"], missing);
            `),
            run: true
          },
          { warn: "TypeScript assumes every key exists, so a missing one is typed `number` even though it's `undefined` at runtime. The `noUncheckedIndexedAccess` setting (Lab 2) fixes this." }
        ]
      },
      {
        title: "extends, merging, and interface vs type",
        blocks: [
          "An interface can **extend** another one: it gets all of that interface's properties, plus its own. It's a neat way to share common fields:",
          {
            code: c(`
              interface Animal {
                petName: string;
              }

              interface Dog extends Animal {
                breed: string;
              }

              const rex: Dog = { petName: "Rex", breed: "Collie" };
              console.log(rex.petName + " the " + rex.breed);
            `),
            run: true
          },
          "Two interfaces with the same name in the same scope **merge** into one. Libraries rely on this so you can add your own properties to their types, like adding a `user` field to Express's `Request`.",
          "You can also describe objects with a type alias: `type User = { id: number; email: string }`. For object shapes, the two are nearly interchangeable:",
          {
            list: [
              "A `type` can name *any* type, including unions, tuples and function types. An interface can only describe object shapes.",
              "An `interface` can be extended with `extends` and merged by declaring it again.",
              "Common convention: `interface` for object shapes, `type` for everything else. Whichever you choose, be consistent."
            ]
          }
        ]
      }
    ],
    gotchas: [
      { text: "Expecting extra properties to always be rejected. Only fresh object literals get the excess property check; a variable that happens to have extra properties is accepted." },
      { text: "Reading optional properties without a check.", bad: "user.nickname.toUpperCase()", good: "user.nickname?.toUpperCase() ?? user.email" },
      { text: "Assuming `readonly` freezes an object. It's a compile-time check only, and one level deep. Use `Object.freeze` for a runtime guarantee." },
      { text: "Trusting dictionary lookups. A key that isn't there gives `undefined`, whatever the type says." }
    ]
  };

  // ==================================================================
  // 4. Unions, Narrowing & Guards
  // ==================================================================
  G.unions = {
    minutes: 10,
    summary: "Real data comes in more than one shape: an id that's a string or a number, a request that's loading, failed or done. Unions describe that, and narrowing is TypeScript following your checks to work out which shape you have. This chapter is the heart of everyday TypeScript.",
    glance: [
      ["string | number", "union: either"],
      ['typeof x === "string"', "narrows primitives"],
      ['"swim" in animal', "narrows by property"],
      ["x instanceof Date", "narrows class instances"],
      ["Array.isArray(x)", "narrows arrays"],
      ["if (x)  /  x !== undefined", "removes null/undefined"],
      ["x?.y  /  x ?? fallback", "optional chaining / default"],
      ['{ kind: "circle"; … } | …', "discriminated union"],
      ["(x): x is Cat", "custom type guard"],
      ["const n: never = x", "exhaustiveness check"],
      ["A & B", "intersection: both at once"]
    ],
    sections: [
      {
        title: "Working with a union",
        blocks: [
          "A union `A | B` means \"either an A or a B\". Until you've checked which one you have, TypeScript only lets you do things that work for *every* member:",
          {
            code: c(`
              type Id = string | number;

              function formatId(id: Id) {
                // id.toUpperCase();   // error: doesn't exist on number
                return "#" + id;       // fine: both can be added to a string
              }

              console.log(formatId(42), formatId("abc"));
            `),
            run: true
          },
          "To use something specific to one member, like `toUpperCase()` on a string, you first narrow the union down."
        ]
      },
      {
        title: "Narrowing with typeof",
        blocks: [
          "**Narrowing** is TypeScript following your `if` checks. After a check, it knows which member of the union you have inside that branch, and in the code after an early `return`:",
          {
            code: c(`
              function describe(value: string | number | string[]) {
                if (typeof value === "string") {
                  return "text: " + value.toUpperCase();   // value: string
                }
                if (Array.isArray(value)) {
                  return "list of " + value.length;        // value: string[]
                }
                return "number: " + value.toFixed(2);      // value: number, the only option left
              }

              console.log(describe("hi"));
              console.log(describe(["a", "b"]));
              console.log(describe(3.14159));
            `),
            run: true
          },
          "You're writing ordinary JavaScript checks. TypeScript simply understands them, so there's no special syntax to learn. `typeof` works for `\"string\"`, `\"number\"`, `\"boolean\"`, `\"function\"`, `\"object\"` and `\"undefined\"`. For arrays, use `Array.isArray(x)`, as in the second check above: `typeof` says `\"object\"` for an array, so it can't tell them apart."
        ]
      },
      {
        title: "Other ways to narrow",
        blocks: [
          "For objects and classes, `typeof` isn't enough (it says `\"object\"` for all of them). Use `in` to check for a property, or `instanceof` for a class:",
          {
            code: c(`
              interface Fish { swim(): string }
              interface Bird { fly(): string }

              function move(animal: Fish | Bird) {
                if ("swim" in animal) return animal.swim();   // Fish
                return animal.fly();                           // Bird
              }

              function year(value: Date | string) {
                if (value instanceof Date) return value.getFullYear();   // Date
                return new Date(value).getFullYear();                    // string
              }

              console.log(move({ fly: () => "flap" }), year(new Date(2000, 5, 1)), year("2024-01-01"));
            `),
            run: true
          },
          "Equality checks narrow too: after `if (x === null) return;`, `x` can't be `null`. And so does plain truthiness: `if (user)` rules out `null` and `undefined`.",
          { warn: "Truthiness also rules out `0`, `\"\"` and `false`. If `0` or an empty string is a valid value, check `!== undefined` instead of `if (count)`." }
        ]
      },
      {
        title: "null, undefined and strictNullChecks",
        blocks: [
          "With `strictNullChecks` (part of strict mode), `null` and `undefined` aren't quietly allowed everywhere. If a value might be missing, its type says so, like `string | undefined`, and you must narrow before using it. This one setting prevents JavaScript's most common crash: *Cannot read properties of undefined*.",
          {
            code: c(`
              const emails = ["a@x.com", "b@x.com"];
              const match = emails.find((e) => e.startsWith("c"));   // string | undefined

              // match.length;   // error: 'match' is possibly undefined

              if (match) {
                console.log(match.length);
              } else {
                console.log("no match");
              }

              console.log(match?.length ?? 0);   // or: optional chaining plus a default
            `),
            run: true
          },
          "The last line uses two JavaScript operators that pair naturally with these types:",
          {
            list: [
              "`x?.y` (**optional chaining**): if `x` is `null` or `undefined`, stop and give `undefined` instead of crashing. Otherwise read `x.y`. TypeScript types the result as `T | undefined`.",
              "`x ?? fallback` (**nullish coalescing**): use `fallback` when `x` is `null` or `undefined`, otherwise `x`. Unlike `||`, it keeps `0` and `\"\"`."
            ]
          },
          { warn: "`match!` (the non-null assertion) tells TypeScript \"trust me, this isn't null or undefined\" without checking anything. Every `!` is a spot where a crash can slip through. Prefer a real check." }
        ]
      },
      {
        title: "Discriminated unions",
        blocks: [
          "This is the most useful pattern in the chapter. Give each variant of a union a shared property with a different literal value, a **tag** (often called `kind`, `type` or `status`). Checking the tag narrows the whole object, so each branch can use that variant's own properties:",
          {
            code: c(`
              type Shape =
                | { kind: "circle"; radius: number }
                | { kind: "square"; size: number }
                | { kind: "rect"; width: number; height: number };

              function area(shape: Shape): number {
                switch (shape.kind) {
                  case "circle":
                    return Math.PI * shape.radius ** 2;   // only the circle variant here
                  case "square":
                    return shape.size ** 2;
                  case "rect":
                    return shape.width * shape.height;
                }
              }

              console.log(area({ kind: "square", size: 3 }));
              console.log(area({ kind: "rect", width: 2, height: 5 }));
            `),
            run: true
          },
          { real: "This is how real apps model state. A request can be `{ status: \"loading\" } | { status: \"error\"; message: string } | { status: \"done\"; data: User[] }`, which makes it impossible to read `data` while it's still loading. Redux actions, API results and form states all use this pattern." }
        ]
      },
      {
        title: "Exhaustiveness checks",
        blocks: [
          "What happens when someone adds a new variant and forgets to handle it? An **exhaustiveness check** turns that into a compile error.",
          "In a `switch`'s `default` branch, every variant has already been handled, so the value's type is `never`. Assign it to a `never` variable: if a new variant ever reaches that line, it won't fit, and the build fails.",
          {
            code: c(`
              type PostState = "draft" | "published" | "archived";

              function badge(state: PostState): string {
                switch (state) {
                  case "draft":
                    return "✏️ draft";
                  case "published":
                    return "✅ live";
                  default: {
                    const unhandled: never = state;   // error: "archived" isn't handled
                    return unhandled;
                  }
                }
              }

              console.log(badge("draft"));
            `),
            run: true,
            caption: "Errors on purpose. Add a `case \"archived\":` and run it again."
          }
        ]
      },
      {
        title: "Custom type guards",
        blocks: [
          "When a check is more involved than `typeof` or `in`, wrap it in a function whose return type is `value is Type`. That's a **type guard**: wherever it returns `true`, TypeScript narrows the value:",
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

              console.log(speak({ meow: () => "meow" }));
              console.log(speak({ bark: () => "woof" }));
            `),
            run: true
          },
          { warn: "TypeScript trusts a guard completely. If `isCat` returns `true` for something that isn't a cat, the types will lie to you. Keep guards simple and correct." }
        ]
      },
      {
        title: "Intersections",
        blocks: [
          "`A & B` is the opposite of a union: a value that is *both* an A and a B at once, so it has every property of each. It's handy for combining shapes:",
          {
            code: c(`
              type Timestamps = { createdAt: Date; updatedAt: Date };
              type Post = { id: number; title: string } & Timestamps;

              const post: Post = {
                id: 1,
                title: "Hello",
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              console.log(post.title, post.createdAt instanceof Date);
            `),
            run: true
          }
        ]
      }
    ],
    gotchas: [
      { text: "Using something that only exists on one member of a union without narrowing first." },
      { text: "Asserting instead of checking.", bad: "const user = users.find((u) => u.id === id)!;", good: 'const user = users.find((u) => u.id === id);\nif (!user) throw new Error("User not found");' },
      { text: "Modelling state as a bag of optional fields (`loading?`, `error?`, `data?`). That allows impossible combinations, like loading and failed at once. Use a discriminated union." },
      { text: "Mixing up `|` and `&`. A union only has the properties *every* member shares; an intersection has *all* properties of every member." }
    ]
  };

  // ==================================================================
  // 5. Classes
  // ==================================================================
  G.classes = {
    minutes: 8,
    summary: "TypeScript adds typed properties and access control to JavaScript classes. If you've used Java or C# it will look familiar, with one twist: it's all checked at compile time and erased at runtime.",
    glance: [
      ["count = 0;  label: string;", "typed properties (must be initialised under strict)"],
      ["public / protected / private", "access: anywhere / class + subclasses / class only"],
      ["constructor(private db: Db) {}", "parameter property: declare + assign in one"],
      ["readonly id: number", "set once, in declaration or constructor"],
      ["static count = 0", "belongs to the class, not instances"],
      ["get total() { … }", "getter: read like a property"],
      ["abstract class / abstract m()", "can't be created; subclasses must implement m"],
      ["class A implements I", "checks A matches interface I (adds no code)"],
      ["#balance", "JavaScript's real runtime-private field"]
    ],
    sections: [
      {
        title: "Typed properties and constructors",
        blocks: [
          "Declare a class's properties, with their types, at the top of the class body. Under strict mode, every property must get a value, either where it's declared or in the constructor:",
          {
            code: c(`
              class Counter {
                count = 0;          // inferred: number
                label: string;      // assigned in the constructor

                constructor(label: string) {
                  this.label = label;
                }

                increment(by = 1): number {
                  this.count += by;
                  return this.count;
                }
              }

              const clicks = new Counter("clicks");
              clicks.increment();
              console.log(clicks.label, clicks.increment(5));
            `),
            run: true
          },
          "A class is both a value (the constructor you call with `new`) and a type: `const c: Counter` means \"an instance of Counter\". Unlike an interface, which is erased completely, a class compiles to real JavaScript that exists at runtime."
        ]
      },
      {
        title: "public, private and protected",
        blocks: [
          "**Access modifiers** control where a member can be used from:",
          {
            list: [
              "`public` (the default): anywhere.",
              "`private`: only inside this class.",
              "`protected`: inside this class and its subclasses, but not from outside."
            ]
          },
          {
            code: c(`
              class BankAccount {
                private balance = 0;

                deposit(amount: number) {
                  if (amount > 0) this.balance += amount;
                }

                getBalance() {
                  return this.balance;
                }
              }

              const acct = new BankAccount();
              acct.deposit(50);
              console.log(acct.getBalance());
              // acct.balance = 1000000;   // error: 'balance' is private
            `),
            run: true
          },
          "This is **encapsulation**: outside code can only change the balance through `deposit`, so the rule \"amounts must be positive\" can't be bypassed.",
          "`protected` is like `private`, except subclasses can use it too:",
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
              // rex.petName;   // error: protected
            `),
            run: true
          },
          { warn: "TypeScript's `private` is compile-time only; in the emitted JavaScript it's an ordinary property. For real runtime privacy, use JavaScript's own `#balance` syntax, which TypeScript also supports." }
        ]
      },
      {
        title: "Parameter properties",
        blocks: [
          "Declaring a property, taking it as a constructor parameter and assigning it is so common that TypeScript has a shortcut. Put a modifier (`public`, `private`, `protected` or `readonly`) on the constructor parameter and it does all three:",
          {
            code: c(`
              // Longhand
              class OrderService {
                private db: Database;
                constructor(db: Database) {
                  this.db = db;
                }
              }

              // Shorthand: exactly the same
              class OrderService {
                constructor(private db: Database) {}
              }
            `)
          },
          { real: "You'll see this everywhere in Angular and NestJS, where services receive what they depend on through the constructor. That pattern is called dependency injection." }
        ]
      },
      {
        title: "readonly, static and getters",
        blocks: [
          "A `readonly` property can be set where it's declared or in the constructor, then never again. A `static` member belongs to the class itself rather than to each instance; it's useful for counters, caches and factory methods. A **getter** (`get`) is a method you read like a property:",
          {
            code: c(`
              class Ticket {
                static issued = 0;
                readonly id: number;

                constructor(private price: number) {
                  Ticket.issued++;
                  this.id = Ticket.issued;
                }

                get priceWithFee() {
                  return this.price + 1.5;
                }
              }

              const a = new Ticket(10);
              const b = new Ticket(20);
              console.log(a.id, b.id, Ticket.issued, b.priceWithFee);
              // a.id = 99;   // error: read-only
            `),
            run: true
          }
        ]
      },
      {
        title: "Inheritance and abstract classes",
        blocks: [
          "`extends` works as in JavaScript: the subclass gets everything from its parent and can override methods. In a subclass constructor, call `super(...)` before touching `this`.",
          "An **abstract** class is a partial blueprint. You can't create one with `new`, and it can declare **abstract methods** that every subclass must implement:",
          {
            code: c(`
              abstract class Shape {
                abstract area(): number;

                describe() {
                  return "Area: " + this.area().toFixed(1);
                }
              }

              class Circle extends Shape {
                constructor(private radius: number) { super(); }
                area() { return Math.PI * this.radius ** 2; }
              }

              class Rect extends Shape {
                constructor(private w: number, private h: number) { super(); }
                area() { return this.w * this.h; }
              }

              const shapes: Shape[] = [new Circle(1), new Rect(2, 3)];
              shapes.forEach((s) => console.log(s.describe()));
              // new Shape();   // error: can't create an abstract class
            `),
            run: true
          },
          "`describe()` is written once in `Shape` and works for every subclass, because each one is guaranteed to have an `area()`."
        ]
      },
      {
        title: "implements",
        blocks: [
          "`implements` checks that a class matches an interface. It doesn't add any code; it's a promise the compiler holds you to:",
          {
            code: c(`
              interface Logger {
                log(message: string): void;
              }

              class ConsoleLogger implements Logger {
                log(message: string) {
                  console.log("[app] " + message);
                }
              }

              class SilentLogger implements Logger {
                log(_message: string) {}
              }

              function start(logger: Logger) {
                logger.log("started");
              }

              start(new ConsoleLogger());
              start(new SilentLogger());
            `),
            run: true
          },
          { real: "Writing code against an interface (`Logger`) rather than a specific class makes it easy to test: in tests you pass in a fake that implements the same interface." }
        ]
      }
    ],
    gotchas: [
      { text: "Forgetting to initialise a property. Under strict mode, `label: string;` with no value and no constructor assignment is an error." },
      { text: "Thinking `private` hides data at runtime. It's a compile-time check only; use `#field` for real privacy." },
      { text: "Using `this` before `super()` in a subclass constructor. JavaScript forbids it, and TypeScript flags it." },
      { text: "Expecting `implements` to copy methods into the class. It only checks; you still write every method." }
    ]
  };

  // ==================================================================
  // 6. Generics
  // ==================================================================
  G.generics = {
    minutes: 8,
    summary: "Generics let you write one function, class or type that works with many types without losing track of which one you're using. They look intimidating, but they're the same idea as function parameters, just for types.",
    glance: [
      ["function f<T>(x: T): T", "T is filled in per call, usually inferred"],
      ["f<string>(…)", "pass the type explicitly (rarely needed)"],
      ["<A, B>", "several type parameters"],
      ["<T extends { id: number }>", "constraint: T must have a numeric id"],
      ["keyof T", "union of T's keys"],
      ["T[K]", "type of T's property K"],
      ["interface ApiResult<T> / class Stack<T>", "generic interfaces and classes"],
      ["Array<T>, Promise<T>, Map<K, V>", "built-in generics"]
    ],
    sections: [
      {
        title: "The problem generics solve",
        blocks: [
          "Say you want a function that returns the first item of an array. What type should it have? `(items: number[]) => number` only works for numbers. `(items: any[]) => any` works for everything, but throws the type away: the caller gets `any` back, with no autocomplete and no checking.",
          "A **generic** function gets the best of both. `<T>` declares a **type parameter**, a placeholder for a type that's filled in each time the function is called:",
          {
            code: c(`
              function firstAny(items: any[]): any {
                return items[0];
              }

              function first<T>(items: T[]): T | undefined {
                return items[0];
              }

              const a = firstAny(["x"]);   // any: anything goes
              const b = first(["x"]);      // string | undefined
              const n = first([10, 20]);   // number | undefined

              console.log(a, b?.toUpperCase(), n);
            `),
            run: true
          },
          "Read `first<T>(items: T[]): T | undefined` as: \"for some type T, take an array of T and return a T (or undefined)\". Calling it with strings makes T `string`; with numbers, T is `number`."
        ]
      },
      {
        title: "Type parameters are (usually) inferred",
        blocks: [
          "You rarely fill in a type parameter yourself. TypeScript infers it from the arguments, just as it infers a variable's type from its value. You *can* write it explicitly, as in `first<string>([])`, which helps when there's nothing to infer from, like an empty array.",
          "A function can have several type parameters, each inferred separately:",
          {
            code: c(`
              function pair<A, B>(a: A, b: B): [A, B] {
                return [a, b];
              }

              const p = pair("age", 36);   // [string, number]
              console.log(p[0], p[1] + 1);
            `),
            run: true
          },
          { tip: "`T` is just a convention (for \"Type\"). Descriptive names like `TItem` or `TKey` are fine, and clearer when there are several." }
        ]
      },
      {
        title: "Constraints with extends",
        blocks: [
          "Inside a generic function, TypeScript only lets you do things that are valid for *every* possible `T`, which is almost nothing. To use a property, **constrain** the type parameter with `extends`:",
          {
            code: c(`
              function findById<T extends { id: number }>(items: T[], id: number) {
                return items.find((item) => item.id === id);
              }

              const users = [
                { id: 1, email: "a@x.com" },
                { id: 2, email: "b@x.com" },
              ];

              const found = findById(users, 2);
              console.log(found?.email);   // found keeps the full user type
            `),
            run: true
          },
          "`T extends { id: number }` means \"T can be any type, as long as it has a numeric `id`\". The result is still the caller's full type, so `found?.email` works. A plain `{ id: number }` parameter would have lost the `email` property."
        ]
      },
      {
        title: "keyof and indexed access types",
        blocks: [
          "`keyof T` is the union of a type's property names, and `T[K]` is the type of the property at key `K`. Together with generics, they type property lookups exactly:",
          {
            code: c(`
              function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
                return obj[key];
              }

              const book = { title: "Dune", pages: 412 };
              const t = getProp(book, "title");   // string
              const p = getProp(book, "pages");   // number
              // getProp(book, "author");         // error: not a key of book

              console.log(t, p);
            `),
            run: true
          },
          "`K extends keyof T` means \"K must be one of T's keys\". That's what makes the bad key an error, and what lets the return type follow whichever key you passed."
        ]
      },
      {
        title: "Generic interfaces and classes",
        blocks: [
          "Interfaces, type aliases and classes can take type parameters too. You've already used several: `Array<T>`, `Map<K, V>` and `Record<K, V>` are all generic:",
          {
            code: c(`
              interface ApiResult<T> {
                ok: boolean;
                data: T;
              }

              class Stack<T> {
                private items: T[] = [];
                push(item: T) { this.items.push(item); }
                pop(): T | undefined { return this.items.pop(); }
                get size() { return this.items.length; }
              }

              const undo = new Stack<string>();
              undo.push("typed 'a'");
              undo.push("typed 'b'");
              console.log(undo.pop(), undo.size);

              const res: ApiResult<number[]> = { ok: true, data: [1, 2, 3] };
              console.log(res.data.length);
            `),
            run: true
          },
          { real: "Generic wrappers like `ApiResult<T>` are everywhere: one type for every API response, with `T` describing the data inside. Data-fetching libraries such as React Query and Axios are generic for the same reason, e.g. `useQuery<User[]>(...)`." }
        ]
      },
      {
        title: "Promise<T> and async functions",
        blocks: [
          "The generic you'll meet most is `Promise<T>`: a value of type `T` that arrives later. An `async` function always returns a promise, and `await` unwraps it back to `T`:",
          {
            code: c(`
              interface User { id: number; email: string }

              async function loadUser(id: number): Promise<User> {
                const res = await fetch("/api/users/" + id);
                return res.json();
              }

              async function showUser() {
                const user = await loadUser(7);   // user: User
                console.log(user.email);
              }
            `)
          },
          "Write `Promise<User>` as the return type, not `User`: the caller has to `await` it (or use `.then`) to get the value. Chapter 8 shows how to check that `res.json()` really is a `User`."
        ]
      }
    ],
    gotchas: [
      { text: "Using properties of an unconstrained `T`.", bad: "function len<T>(x: T) {\n  return x.length;   // error\n}", good: "function len<T extends { length: number }>(x: T) {\n  return x.length;\n}" },
      { text: "Using a generic where a plain type would do. If `T` appears only once in a signature, it isn't connecting anything: `function log<T>(x: T): void` is no better than `function log(x: unknown): void`." },
      { text: "Writing type arguments that would be inferred anyway. `first<number>([1, 2])` is the same as `first([1, 2])`." },
      { text: "Forgetting `await`. Without it you have a `Promise<User>`, not a `User`, and TypeScript will flag `user.email`." }
    ]
  };

  // ==================================================================
  // 7. Utility Types & Type Manipulation
  // ==================================================================
  G.utility = {
    minutes: 9,
    summary: "Once you have a type, you often need variations of it: the same user with every field optional for an update, or without the password. Instead of copying and editing, TypeScript lets you compute new types from existing ones, so they stay in sync.",
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
        title: "Types from values: typeof and keyof",
        blocks: [
          "In a type position, `typeof` takes the type of an existing variable. That's useful when a value is the source of truth and you don't want to write its type out twice. (In ordinary code, `typeof x` is still JavaScript's runtime operator returning a string like `\"object\"`.)",
          "`keyof` turns an object type's keys into a union of string literals. Combined, they describe \"one of this object's keys\":",
          {
            code: c(`
              const defaults = {
                port: 3000,
                host: "localhost",
                debug: false,
              };

              type Settings = typeof defaults;   // { port: number; host: string; debug: boolean }
              type SettingName = keyof Settings; // "port" | "host" | "debug"

              function describeSetting(key: SettingName) {
                return key + " = " + defaults[key];
              }

              console.log(describeSetting("port"));
              // describeSetting("colour");   // error: not a setting
            `),
            run: true
          },
          "`ReturnType<typeof fn>` works the same way for functions: it gives you whatever type `fn` returns, which is handy when a library returns a complicated object you want to pass around."
        ]
      },
      {
        title: "Reshaping every property: Partial, Required, Readonly",
        blocks: [
          "These take an object type and change all of its properties at once:",
          {
            list: [
              "`Partial<T>`: every property becomes optional.",
              "`Required<T>`: every property becomes required (removes the `?`s).",
              "`Readonly<T>`: every property becomes read-only."
            ]
          },
          {
            code: c(`
              interface User {
                id: number;
                fullName: string;
                email: string;
              }

              function updateUser(user: User, changes: Partial<User>): User {
                return { ...user, ...changes };
              }

              const u: User = { id: 1, fullName: "Ada Lovelace", email: "ada@x.com" };
              const frozen: Readonly<User> = u;
              // frozen.email = "x";   // error: read-only

              console.log(updateUser(u, { email: "ada@new.com" }));
            `),
            run: true
          },
          { real: "`Partial<T>` is the classic type for update requests and edit forms, where you only send the fields that changed." }
        ]
      },
      {
        title: "Choosing keys: Pick, Omit, Record",
        blocks: [
          {
            list: [
              "`Pick<T, K>`: keep only the keys in K.",
              "`Omit<T, K>`: keep everything except the keys in K.",
              "`Record<K, V>`: an object whose keys are K and whose values are V."
            ]
          },
          {
            code: c(`
              interface Account {
                id: number;
                email: string;
                passwordHash: string;
                createdAt: string;
              }

              type PublicAccount = Omit<Account, "passwordHash">;
              type AccountPreview = Pick<Account, "id" | "email">;
              type NewAccount = Omit<Account, "id" | "createdAt">;

              const preview: AccountPreview = { id: 7, email: "sam@x.com" };

              const roleLevel: Record<"admin" | "editor" | "viewer", number> = {
                admin: 3,
                editor: 2,
                viewer: 1,
              };

              console.log(preview, roleLevel.editor);
            `),
            run: true,
            caption: "Try deleting the `viewer` line."
          },
          "Because `PublicAccount` is derived from `Account`, adding a field to `Account` adds it everywhere automatically. With a union of literals as the key type, `Record` requires *every* key, so a lookup table can't silently miss a new role."
        ]
      },
      {
        title: "Filtering unions: Exclude, Extract, NonNullable",
        blocks: [
          {
            list: [
              "`Exclude<U, X>`: remove the members of union U that match X.",
              "`Extract<U, X>`: keep only the members that match X.",
              "`NonNullable<T>`: remove `null` and `undefined`."
            ]
          },
          {
            code: c(`
              type PostState = "draft" | "published" | "archived";

              type Live = Exclude<PostState, "archived">;   // "draft" | "published"
              type Gone = Extract<PostState, "archived">;   // "archived"
              type Text = NonNullable<string | null>;       // string
            `)
          },
          "The split to remember: `Pick` and `Omit` work on an **object's keys**; `Exclude` and `Extract` work on a **union's members**."
        ]
      },
      {
        title: "How they work: mapped types",
        blocks: [
          "None of these are special-cased in the compiler. They're written in TypeScript itself, using features you can use too. A **mapped type** loops over a type's keys and builds a new property for each one, a bit like `map` for types:",
          {
            code: c(`
              // This is (almost exactly) how Partial is defined:
              type MyPartial<T> = { [K in keyof T]?: T[K] };

              // Your own: every property may also be null
              type Nullable<T> = { [K in keyof T]: T[K] | null };

              interface Profile { bio: string; age: number }

              const draft: Nullable<Profile> = { bio: null, age: 30 };
              const patch: MyPartial<Profile> = { age: 31 };
              console.log(draft, patch);
            `),
            run: true
          },
          "Read `{ [K in keyof T]: T[K] | null }` as: \"for each key K of T, make a property K whose type is T's type at K, or null\"."
        ]
      },
      {
        title: "Conditional types",
        blocks: [
          "A **conditional type** chooses between two types, like a ternary: `T extends U ? X : Y` means \"if T fits U, then X, otherwise Y\".",
          {
            code: c(`
              type IsString<T> = T extends string ? "yes" : "no";

              type A = IsString<"hello">;   // "yes"
              type B = IsString<42>;        // "no"

              // How Exclude is defined:
              type MyExclude<T, U> = T extends U ? never : T;
            `)
          },
          "When `T` is a union, the condition runs on each member separately and the results are combined. That's how `Exclude` works: members that match become `never` and vanish from the union.",
          { tip: "You'll read conditional types in library code far more often than you'll write them. Being able to read them is the goal." }
        ]
      }
    ],
    gotchas: [
      { text: "Copy-pasting a type to make a variation. When the original changes, the copy silently falls out of date. Derive it with `Omit`, `Pick` or `Partial`." },
      { text: "`Partial<User>` makes `id` optional too.", bad: "type UserUpdate = Partial<User>;", good: 'type UserUpdate = Pick<User, "id"> & Partial<Omit<User, "id">>;' },
      { text: "Mixing up which tool works on what. `Pick`/`Omit` take object keys; `Exclude`/`Extract` take union members." },
      { text: "Expecting `Readonly<T>` to be deep. Like `readonly`, it only covers the top level." }
    ]
  };

  // ==================================================================
  // 8. TypeScript in Real Projects
  // ==================================================================
  G["real-world"] = {
    minutes: 10,
    summary: "Everything so far was the language. This chapter is about using it in an actual project: how TypeScript fits into the build, how to handle data and libraries that have no types, and which escape hatches to use and avoid.",
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
          "A typical project has three pieces: your `.ts`/`.tsx` source (usually in `src/`), a `tsconfig.json` with the compiler settings, and a build tool that turns TypeScript into JavaScript. That tool might be `tsc` itself, or a bundler like Vite, esbuild, webpack or Next.js.",
          "Here's the part that surprises people: most bundlers **strip types without checking them**, file by file, because it's fast. Your app will build and run even with type errors in it.",
          "So checking happens in two other places: your **editor**, which runs TypeScript as you type, and a separate `tsc --noEmit` step (check only, write no files) in your scripts and CI:",
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
          { real: "If CI doesn't run `tsc`, type errors can get merged. Checking for a typecheck step is one of the first things worth doing in a new codebase." }
        ]
      },
      {
        title: "tsconfig essentials",
        blocks: [
          {
            code: c(`
              {
                "compilerOptions": {
                  "target": "ES2022",     // JavaScript syntax to emit
                  "module": "ESNext",     // import/export style to emit
                  "strict": true,         // noImplicitAny, strictNullChecks, …
                  "outDir": "dist",       // where emitted files go
                  "skipLibCheck": true    // don't re-check libraries' .d.ts files
                },
                "include": ["src"]        // which files belong to the project
              }
            `)
          },
          "`strict` is the important one; turn it on for every new project. `skipLibCheck` is a common speed-up: it trusts the type files that come with your dependencies instead of re-checking them. The three Project Labs go deeper into these settings, using the real compiler."
        ]
      },
      {
        title: "Data from outside: unknown and validation",
        blocks: [
          "Types describe your code, but data from the outside world arrives at runtime, after the types are gone: API responses, `JSON.parse`, `localStorage`, form input, environment variables. `JSON.parse` and `res.json()` return `any`, so TypeScript will happily let you treat garbage as a `User`.",
          "The safe pattern: treat outside data as `unknown`, then **validate** it with a type guard before trusting it:",
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
          "Put together with `fetch`, a typed API call looks like this:",
          {
            code: c(`
              async function getUser(id: number): Promise<User> {
                const res = await fetch("/api/users/" + id);
                if (!res.ok) throw new Error("Request failed: " + res.status);

                const data: unknown = await res.json();
                if (!isUser(data)) throw new Error("Unexpected response shape");
                return data;   // narrowed to User by the guard
              }
            `)
          },
          { real: "Writing guards by hand gets tedious, so most projects use a validation library like **Zod**. You describe the shape once and get both the runtime check and the TypeScript type from it (`z.infer<typeof UserSchema>`)." }
        ]
      },
      {
        title: "as vs satisfies",
        blocks: [
          "A **type assertion**, `value as User`, tells the compiler \"trust me, it's a User\". It performs **no check at all**, at compile time or at runtime. If you're wrong, you find out later, as a crash somewhere else.",
          "**`satisfies`** is the safe alternative for values you write yourself. It checks the value against a type, but keeps the more precise type TypeScript inferred:",
          {
            code: c(`
              type Route = { path: string; auth: boolean };

              const routes = {
                home: { path: "/", auth: false },
                settings: { path: "/settings", auth: true },
              } satisfies Record<string, Route>;

              // Checked against Route, but TypeScript still knows the exact keys:
              console.log(routes.settings.path);
              // routes.profile;   // error: no such route

              const wrong = { path: 42 } as unknown as Route;   // compiles. It's a lie.
              console.log(typeof wrong.path);
            `),
            run: true
          },
          {
            list: [
              "Use `as` only when you genuinely know more than the compiler, like knowing a DOM element is an `<input>`.",
              "Use `satisfies` to check config objects and lookup tables you write by hand.",
              "Treat `as unknown as X` as a red flag: stop and ask why the types disagree."
            ]
          }
        ]
      },
      {
        title: "Libraries without types: .d.ts files",
        blocks: [
          "A **declaration file** (`.d.ts`) contains only types, no code. It describes JavaScript that lives somewhere else, and it's how TypeScript knows the types of plain-JavaScript libraries.",
          "If an import gives you *Could not find a declaration file for module 'x'*:",
          {
            list: [
              "Check whether a newer version of the package ships its own types. Many modern packages do.",
              "Otherwise install community types: `npm install -D @types/x`. The DefinitelyTyped project maintains these for thousands of packages.",
              "If none exist, write a small declaration yourself:"
            ]
          },
          {
            code: c(`
              // src/types/legacy-lib.d.ts
              declare module "legacy-lib" {
                export function slugify(input: string): string;
              }
            `)
          },
          "Lab 3 has you do exactly this, against the real compiler."
        ]
      },
      {
        title: "Type-only imports",
        blocks: [
          "When you import something only to use it as a type, say so with `import type`. It's guaranteed to be erased, so it never pulls the other module in at runtime. Build tools that compile one file at a time, like esbuild and Vite, rely on this to know what they can drop:",
          {
            code: c(`
              import type { User } from "./user";     // erased completely
              import { formatUser } from "./format";  // a real import, kept
            `)
          }
        ]
      },
      {
        title: "Type the boundaries",
        blocks: [
          "Experienced TypeScript developers put most of their effort into the **boundaries** of a program, like function signatures, API responses, component props and config, and let inference handle the inside. Good boundary types mean the rest of the code mostly types itself:",
          {
            list: [
              "Annotate exported functions' parameters and return types.",
              "Validate everything that comes from outside.",
              "Model states as discriminated unions.",
              "Derive related types (`Omit`, `Partial`, `typeof`) instead of duplicating them.",
              "Keep `any` out: turn on strict mode, and consider the typescript-eslint rules that flag it."
            ]
          }
        ]
      }
    ],
    gotchas: [
      { text: "Trusting API responses.", bad: "const user: User = await res.json();", good: 'const data: unknown = await res.json();\nif (!isUser(data)) throw new Error("Bad response");' },
      { text: "Assuming `vite build` catches type errors. It doesn't; run `tsc --noEmit`." },
      { text: "Using `as` to make an error go away. The error usually means the data or the type is wrong." },
      { text: "`declare module \"x\";` with no body makes every import from `x` an `any`. Fine as a stopgap, not a fix." }
    ]
  };

  // ==================================================================
  // Lab 1: Project setup
  // ==================================================================
  G["lab-1"] = {
    minutes: 5,
    summary: "So far you've written TypeScript one snippet at a time. Real projects are folders of files compiled together. This guide explains what the compiler does with a whole project and where its output goes, so the lab tasks make sense.",
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
          "Run `tsc` in a project folder and it:",
          {
            list: [
              "finds `tsconfig.json` and reads its settings,",
              "collects the files it covers (by default, every `.ts` file under that folder),",
              "type-checks them **together**, so a mistake in how `index.ts` calls `users.ts` is caught,",
              "then **emits** one `.js` file for each `.ts` file."
            ]
          },
          "If there are type errors, tsc reports them but still writes the JavaScript by default. The `noEmitOnError` setting changes that, which is useful when you never want broken output deployed."
        ]
      },
      {
        title: "Type erasure, in full",
        blocks: [
          "Emitting is mostly deletion. Interfaces, type aliases and annotations all disappear, and so does every other type-only feature you'll meet later. What's left is the JavaScript you'd have written by hand:",
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
          },
          "Only a handful of features generate code, such as `enum`. That's one reason many teams prefer literal unions."
        ]
      },
      {
        title: "tsconfig.json",
        blocks: [
          {
            code: c(`
              {
                "compilerOptions": {
                  "target": "ES2020",
                  "module": "ESNext",
                  "strict": true,
                  "rootDir": "src",
                  "outDir": "dist"
                },
                "include": ["src"]
              }
            `)
          },
          "`include` picks the input files. `compilerOptions` controls two things: **checking** (`strict` and friends) and **output** (`target`, `module`, `outDir`). Lab 2 covers `target` and `module`."
        ]
      },
      {
        title: "Where the output goes: outDir and rootDir",
        blocks: [
          "Without `outDir`, each `.js` file is written right next to its `.ts` file, mixing source and output together. With `\"outDir\": \"dist\"`, tsc writes into `dist/` instead, mirroring your folder structure:",
          {
            code: c(`
              src/index.ts        →  dist/index.js
              src/utils/math.ts   →  dist/utils/math.js
            `)
          },
          "`rootDir` says which folder is the top of that structure. Without it, tsc works the root out from the input files, so the output layout can shift unexpectedly when you add a file outside `src/`.",
          { real: "`dist/` (or `build/`) almost always goes in `.gitignore`. You commit the source; the output gets rebuilt." }
        ]
      },
      {
        title: "Turning on strict in an existing project",
        blocks: [
          "Switching on `\"strict\": true` in an older project usually produces a pile of errors. That's not the compiler being fussy: most of them are real places where a value can be `undefined` and the code doesn't handle it. Fix them one at a time, often with an early return or a default value:",
          {
            code: c(`
              const user = findUser(2);              // User | undefined under strict
              if (!user) throw new Error("No user 2");
              console.log(user.email);               // fine: narrowed to User
            `)
          }
        ]
      }
    ],
    gotchas: [
      { text: "Editing files in `dist/`. They're overwritten on the next build; always edit the `.ts` source." },
      { text: "Committing build output alongside source. Add `dist/` to `.gitignore`." }
    ]
  };

  // ==================================================================
  // Lab 2: tsconfig deep-dive
  // ==================================================================
  G["lab-2"] = {
    minutes: 6,
    summary: "Two settings decide what your emitted JavaScript looks like: `target` and `module`. Get them wrong and code that type-checks perfectly crashes when it runs. A third, `noUncheckedIndexedAccess`, closes a gap that strict mode leaves open.",
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
        title: "target: which JavaScript you get",
        blocks: [
          "`target` is the JavaScript version tsc writes. Syntax newer than the target gets **downlevelled**: rewritten into an older equivalent that does the same thing:",
          {
            code: c(`
              // You write:
              const port = config.port ?? 3000;

              // target ES2020 or later: unchanged
              const port = config.port ?? 3000;

              // target ES2017 (before ?? existed): rewritten
              const port = (_a = config.port) !== null && _a !== void 0 ? _a : 3000;
            `)
          },
          "Only syntax **newer than the target** is rewritten. The dates worth knowing:",
          {
            list: [
              "ES2015: arrow functions, `let`/`const`, classes, template literals",
              "ES2017: `async` / `await`",
              "ES2020: `??` and `?.`",
              "ES2022: class fields with `#private`, top-level `await`"
            ]
          },
          "So with `\"target\": \"ES2017\"`, `??` and `?.` get rewritten, while arrow functions and template literals are left alone.",
          "`target` only rewrites **syntax**. It doesn't add missing built-in functions, like `Array.prototype.at` in an old browser; that's what the `lib` setting describes and what polyfills provide.",
          { real: "For Node 18+ or current browsers, `ES2022` is a sensible target. If a bundler handles downlevelling for you, the tsconfig target matters less." }
        ]
      },
      {
        title: "module: how imports and exports are written",
        blocks: [
          "`module` decides the import/export syntax in the output:",
          {
            list: [
              "`CommonJS`: `require()` and `exports`, the classic Node style.",
              "`ESNext` / `ES2022`: `import` and `export`, kept as written. Used with bundlers and browsers.",
              "`NodeNext`: follows Node's own rules, deciding per file based on the `\"type\"` field in package.json."
            ]
          },
          {
            code: c(`
              // You write:
              import { greet } from "./greet.js";
              export const main = () => greet("world");

              // module: CommonJS emits
              const greet_js_1 = require("./greet.js");
              const main = () => (0, greet_js_1.greet)("world");
              exports.main = main;
            `)
          },
          "The output has to match how your code is actually loaded. If package.json says `\"type\": \"module\"`, Node treats `.js` files as ES modules, and CommonJS output crashes with *require is not defined in ES module scope*."
        ]
      },
      {
        title: "Why ES module imports end in .js",
        blocks: [
          "Under Node's ES modules, relative imports need the full file extension, like `import { greet } from \"./greet.js\"`. Node doesn't guess extensions.",
          "But the file you wrote is `greet.ts`! That's fine: tsc doesn't rewrite import paths, so you write the path that will be correct *after* compiling, when `greet.js` exists. With `\"module\": \"NodeNext\"`, TypeScript enforces this, and maps `./greet.js` back to `greet.ts` while type checking.",
          { tip: "Bundler projects (Vite, Next.js) don't need the extension, and use `\"moduleResolution\": \"bundler\"`. The `.js` rule is for code that Node runs directly." }
        ]
      },
      {
        title: "noUncheckedIndexedAccess",
        blocks: [
          "Even under strict mode, TypeScript assumes array and dictionary lookups succeed: `names[5]` is typed `string`, even if the array only has two items. That's a convenient lie.",
          "`noUncheckedIndexedAccess` makes it honest. Every index lookup gets `| undefined` added, so you have to handle a miss:",
          {
            code: c(`
              const names = ["Ada", "Grace"];

              // default:                    string
              // noUncheckedIndexedAccess:   string | undefined
              const third = names[2];

              console.log(third?.toUpperCase() ?? "nobody");
            `),
            run: true
          },
          "It isn't part of strict mode because it adds friction (even loops over indexes you know are valid need a check), but many teams turn it on because it catches real out-of-bounds bugs."
        ]
      }
    ],
    gotchas: [
      { text: "Expecting `target` to polyfill missing functions. It only rewrites syntax." },
      { text: "Emitting CommonJS for a package with `\"type\": \"module\"`, or the other way round. `module` has to match how Node loads the files." },
      { text: "Writing `./greet` or `./greet.ts` in an import Node will run as an ES module. Write `./greet.js`." }
    ]
  };

  // ==================================================================
  // Lab 3: Real-world project
  // ==================================================================
  G["lab-3"] = {
    minutes: 5,
    summary: "The last lab covers problems you hit in real codebases: a library with no types, knowing which imports end up in the output, and taming long relative import paths.",
    glance: [
      ['declare module "x" { export … }', "types for an untyped package (.d.ts)"],
      ['declare module "x";', "shorthand: every import is any"],
      ["import type { T } from …", "always erased from the output"],
      ['"verbatimModuleSyntax": true', "only type imports are removed; the rest kept as written"],
      ['"paths": { "@/*": ["./src/*"] }', "import alias for the type checker"]
    ],
    sections: [
      {
        title: "Declaring a module that has no types",
        blocks: [
          "When a plain JavaScript package ships no types and there's no `@types` package for it, describe it yourself in a `.d.ts` file anywhere the project's `include` covers:",
          {
            code: c(`
              // src/types/tiny-slug.d.ts
              declare module "tiny-slug" {
                export function slugify(input: string): string;
              }
            `)
          },
          "`declare` means \"this exists at runtime somewhere; here's its type\". Inside, you use normal `export` syntax. Only describe what you actually use; you don't have to type the whole library.",
          { warn: "The shorthand `declare module \"tiny-slug\";`, with no body, also silences the error, but it makes every import from that module `any`. Fine as a temporary unblock, not as a fix." }
        ]
      },
      {
        title: "Which imports survive compilation",
        blocks: [
          "Because types are erased, an import used *only* as a type has nothing to import at runtime, so tsc drops it from the output. By default it also drops imports that aren't used at all:",
          {
            code: c(`
              import type { User } from "./types";    // always erased
              import { formatUser } from "./format";  // kept: used as a value
              import { version } from "./version";    // dropped by default if unused
              import "./polyfills";                   // kept: side-effect import
            `)
          },
          "That matters when a module has **side effects** (it runs code when imported), and for tools like esbuild that compile each file on its own and can't tell whether an import was type-only. Marking type imports with `import type` removes the guesswork.",
          "`\"verbatimModuleSyntax\": true` makes the rule simple: imports marked `type` are removed, and everything else is kept exactly as written. It's the recommended setting for new projects."
        ]
      },
      {
        title: "Path aliases",
        blocks: [
          "Deep folder structures produce imports like `../../../lib/money`. **Path aliases** let you write `@/lib/money` instead:",
          {
            code: c(`
              {
                "compilerOptions": {
                  "paths": {
                    "@/*": ["./src/*"]
                  }
                }
              }
            `)
          },
          "`paths` only affects **type checking**: tsc doesn't rewrite `@/lib/money` in the output. Whatever runs your code needs the same alias: Vite's `resolve.alias`, Next.js (which reads tsconfig paths automatically), or a tool like `tsc-alias` for plain Node builds."
        ]
      },
      {
        title: "Putting it together",
        blocks: [
          {
            code: c(`
              my-app/
              ├── package.json        "type": "module", scripts
              ├── tsconfig.json       strict, paths, outDir
              ├── src/
              │   ├── index.ts
              │   ├── lib/money.ts
              │   └── types/
              │       └── tiny-slug.d.ts
              └── dist/               emitted JavaScript (git-ignored)
            `)
          },
          "Every setting from the labs shows up in real projects: `strict` for safety, `target` and `module` to match the runtime, `outDir` to keep output separate, `.d.ts` files to fill gaps in third-party types, and `paths` for tidy imports."
        ]
      }
    ],
    gotchas: [
      { text: "Adding `paths` and expecting it to work at runtime. The bundler or runtime needs the same alias." },
      { text: "Importing a type with a plain `import` in a project built by esbuild or with `isolatedModules`. Use `import type` so the import is guaranteed to be removed." }
    ]
  };

  window.TSW_LESSONS = G;
})();
