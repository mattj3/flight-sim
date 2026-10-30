// Pulls named top-level declarations out of the game's inline <script> without editing index.html.
//
// The game is one IIFE in index.html with nothing exported. This module parses that script with acorn, finds the
// declarations asked for by name inside the IIFE body, and evaluates just those, in source order, in a Node vm context
// that has the real three.js r128 (the same build the page loads from cdnjs). Nothing else in the script runs: no
// renderer, no DOM, no scene. If a name is renamed or removed in index.html, extraction fails loudly with that name.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import * as acorn from 'acorn';

const require = createRequire(import.meta.url);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));

export function gameScript() {
  const html = readFileSync(ROOT + 'index.html', 'utf8');
  // the game script is the inline <script> that follows the three.js <script src>
  const m = html.match(/<script src="[^"]*three[^"]*"><\/script>\s*<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('could not find the inline game <script> after the three.js tag in index.html');
  return m[1];
}

function iifeBody(src) {
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });
  for (const st of ast.body) {
    const call = st.type === 'ExpressionStatement' && st.expression.type === 'CallExpression' ? st.expression : null;
    const fn = call && call.callee;
    if (fn && (fn.type === 'ArrowFunctionExpression' || fn.type === 'FunctionExpression') && fn.body.type === 'BlockStatement') return fn.body.body;
  }
  throw new Error('the game script is no longer a single IIFE; update tests/lib/extract.mjs');
}

const declaredNames = st => {
  if (st.type === 'FunctionDeclaration') return [st.id.name];
  if (st.type === 'VariableDeclaration') return st.declarations.flatMap(d => (d.id.type === 'Identifier' ? [d.id.name] : []));
  return [];
};

/**
 * Evaluate the named declarations (plus any extra raw statements matched by `alsoMatch`) and return a context
 * from which each name can be read. `globals` seeds the context (stubs for things like `ac` or `onMoon`).
 */
export function load(names, { globals = {}, alsoMatch = [] } = {}) {
  const src = gameScript();
  const body = iifeBody(src);
  const want = new Set(names), found = new Set(), parts = [];
  for (const st of body) {
    const n = declaredNames(st);
    const hit = n.some(x => want.has(x));
    const raw = src.slice(st.start, st.end);
    if (hit) { n.forEach(x => found.add(x)); parts.push(raw.replace(/^(const|let) /, 'var ')); }
    else if (alsoMatch.some(re => re.test(raw))) parts.push(raw);
  }
  const missing = names.filter(x => !found.has(x));
  if (missing.length) throw new Error(`not found as top-level declarations in index.html: ${missing.join(', ')}`);
  const ctx = vm.createContext({ THREE: require('three'), Math, console, ...globals });
  vm.runInContext(parts.join('\n'), ctx, { filename: 'index.html#game-script' });
  return ctx;
}
