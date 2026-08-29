# Angular 22.1.4: routed component host created in the SVG namespace

Minimal reproduction for an Angular regression introduced in **22.1.4**
(works correctly in 22.1.3).

## The bug

When a `<router-outlet>` is inside an `@if` block and **any `<svg>` appears
earlier in the same template**, the routed component's host element is created in
the **SVG namespace**. The `<svg>` is closed and is only a preceding sibling —
the outlet is not nested inside it.

An SVG-namespaced element gets no CSS box in HTML layout, so the routed view
computes to `0x0`. The markup is fully present and correct in the DOM, every
computed style resolves, and **no error or warning is logged**. The page is just
blank.

## Run it

```bash
npm install
npm start
```

The page prints its own measurement:

```
<router-outlet> ns : HTML
<app-child> host ns: SVG        <-- HTML on 22.1.3
<app-child> size   : 0x0        <-- no CSS box, nothing paints

BUG: routed host created in the SVG namespace -> no CSS box -> blank
```

## Confirm it is a regression

Change every `@angular/*` version in `package.json` to `22.1.3`, reinstall, and
run again — same code, correct result:

```
<app-child> host ns: HTML
<app-child> size   : 1184x66
OK: routed host created in the HTML namespace
```

## Conditions

The `@if` is required. The `<svg>` alone is harmless:

| `<svg>` earlier in template | outlet inside `@if` | host namespace | result  |
| --------------------------- | ------------------- | -------------- | ------- |
| yes                         | no                  | HTML           | renders |
| yes                         | **yes**             | **SVG**        | **blank** |

Nesting the `<svg>` in another element (e.g. a `<button>`) makes no difference.
Wrapping the outlet in any HTML element *inside* the `@if` restores the HTML
namespace and works around it.

Angular 21 is **not** affected — `hostElementNamespace` does not exist in
21.2.22. The change is 22-only.

## Bisect

Bisected to `2ab5ff5` ("fix(core): preserve namespace for dynamic component
hosts"), which changed `createHostElement()`:

```js
// 22.1.3
const namespace = tagName === 'svg' ? SVG_NAMESPACE : tagName === 'math' ? MATH_ML_NAMESPACE : null;
// 22.1.4
const namespace = tagName === 'svg' ? SVG_NAMESPACE : tagName === 'math' ? MATH_ML_NAMESPACE : hostElementNamespace;
```

Is this the intended consequence of that change? The outlet is not nested inside
the `<svg>` — the element is closed before the `@if` block begins.

The whole reproduction is a single file: [`src/main.ts`](src/main.ts).
