// Headless smoke test: run all four inline scripts from the built artifact in a
// DOM stub, exercising the full render path (boot example + every click handler).
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import vm from "vm";
const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "jyotish.html"), "utf8");

const listeners = [];
function makeEl(id) {
  const el = {
    _id: id || "anon", _html: "", listeners: [],
    style: {}, dataset: {}, value: "", checked: false, disabled: false,
    width: 760, height: 760, offsetWidth: 100, textContent: "",
    classList: { add() {}, remove() {} },
    cells: null,
    setAttribute() {}, getAttribute() { return null; },
    appendChild() {}, contains() { return false; }, scrollIntoView() {}, click() {
      el.listeners.filter(l => l[0] === "click").forEach(l => l[1]({ preventDefault() {}, target: makeEl() }));
    },
    addEventListener(type, fn) { el.listeners.push([type, fn]); listeners.push([el, type, fn]); },
    querySelector() { return makeEl(); },
    getContext() {
      return new Proxy({}, { get: (t, k) => (typeof k === "string" && k !== "canvas" ? () => {} : t[k]), set: () => true });
    },
  };
  el.cells = [el, { get innerHTML() { return ""; }, set innerHTML(v) {} }, {}, {}, {}, {}];
  Object.defineProperty(el, "innerHTML", {
    get() { return this._html; },
    set(v) {
      this._html = v;
      if (/undefined|NaN|\[object Object\]/.test(v)) {
        console.error(`  [WARN] suspicious content in #${this._id}: ` + v.match(/.{0,40}(undefined|NaN|\[object Object\]).{0,20}/)[0]);
        problems++;
      }
    },
  });
  return el;
}

let problems = 0;
const registry = {};
const documentStub = {
  getElementById(id) { return registry[id] || (registry[id] = makeEl(id)); },
  createElement(tag) { return makeEl("created-" + tag); },
  addEventListener(type, fn) { listeners.push([null, type, fn]); },
};
const sandbox = { document: documentStub, console, Date, Math, JSON, Proxy, Object };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
console.log(`Found ${scripts.length} inline scripts`);
try {
  for (const [i, src] of scripts.entries()) {
    vm.runInContext(src, sandbox, { filename: `inline-${i}.js` });
  }
  console.log("Boot OK: example chart computed and rendered.");
} catch (e) {
  console.error("BOOT FAILURE:", e.stack);
  process.exit(1);
}

// sanity: key panels actually rendered content
for (const id of ["facts", "planet-table", "panchanga", "dasha-top", "dasha-table", "strength", "namecard", "reading", "appendix", "chart-d1", "chart-d9"]) {
  const el = registry[id];
  if (!el || el._html.length < 50) { console.error(`  [FAIL] #${id} empty after boot`); problems++; }
}

// fire every registered click/submit/input/keydown handler
let fired = 0, errors = 0;
for (const [el, type, fn] of [...listeners]) {
  if (!["click", "submit", "input", "keydown", "change"].includes(type)) continue;
  try {
    fn.call(el || documentStub, { preventDefault() {}, target: makeEl(), key: "x" });
    fired++;
  } catch (e) {
    errors++;
    console.error(`  [FAIL] ${type} handler on #${el ? el._id : "document"}: ${e.message}`);
  }
}
console.log(`Fired ${fired} event handlers, ${errors} errors, ${problems} content problems.`);
if (errors || problems) process.exit(1);
console.log("SMOKE PASS");
