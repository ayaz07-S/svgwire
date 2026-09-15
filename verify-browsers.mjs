/**
 * CDP browser driver to verify both bug fixes in the real app.
 * Uses Node's built-in WebSocket client + system Chrome headless.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = 9333;
const BASE = 'http://localhost:4321';
const OUT = 'verify-shots';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const profile = mkdtempSync(join(tmpdir(), 'chrome-verify-'));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1440,900',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(300);
  }
  throw new Error('Chrome CDP never came up');
}

let msgId = 0;
const pending = new Map();
let ws;

function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

function handle(msg) {
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
}

async function evalJs(expression, awaitPromise = false) {
  const r = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise,
  });
  if (r.exceptionDetails) throw new Error('JS error: ' + JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
  return r.result?.value;
}

async function navigate(url) {
  await send('Page.enable');
  await send('Page.navigate', { url });
  // wait for load + hydration
  await sleep(2500);
}

async function screenshot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(OUT, name), Buffer.from(r.data, 'base64'));
  console.log(`📸 ${name}`);
}

async function main() {
  const wsUrl = await getWsUrl();
  ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (e) => handle(JSON.parse(e.data));
  await send('Page.enable');
  await send('Runtime.enable');

  const CURRENT_COLOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`;

  // ─── TEST 1: Preview color — light app theme + dark preview bg ───
  console.log('\n=== TEST 1: Light app + dark preview ===');
  await navigate(`${BASE}/`);
  await evalJs(`localStorage.setItem('theme','light'); localStorage.setItem('svgwire-preview-bg','dark'); 'ok'`);
  await navigate(`${BASE}/`);
  // paste currentColor SVG into the textarea (React controlled — use native setter + input event)
  await evalJs(`(() => {
    const ta = document.getElementById('svg-input-textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, ${JSON.stringify(CURRENT_COLOR_SVG)});
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return 'set';
  })()`);
  await sleep(800);
  const darkResult = await evalJs(`(() => {
    const holder = document.querySelector('#preview-sandbox [style*="color"]');
    const svg = document.querySelector('#preview-sandbox svg');
    const cs = holder ? getComputedStyle(holder).color : 'NO HOLDER';
    return { holderColor: cs, svgStroke: svg ? svg.getAttribute('stroke') : 'no svg' };
  })()`);
  console.log('Holder computed color:', darkResult);
  await screenshot('01-light-theme-dark-preview.png');

  // ─── TEST 2: Light app + light preview bg ───
  console.log('\n=== TEST 2: Light app + light preview ===');
  await evalJs(`localStorage.setItem('svgwire-preview-bg','light'); 'ok'`);
  await navigate(`${BASE}/`);
  await evalJs(`(() => {
    const ta = document.getElementById('svg-input-textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, ${JSON.stringify(CURRENT_COLOR_SVG)});
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    return 'set';
  })()`);
  await sleep(800);
  await screenshot('02-light-theme-light-preview.png');

  // ─── TEST 3: Framework persistence — Vue → /batch ───
  console.log('\n=== TEST 3: Vue -> /batch ===');
  await navigate(`${BASE}/svg-to-vue`);
  await sleep(500);
  const storedAfterVue = await evalJs(`sessionStorage.getItem('svgwire-framework')`);
  console.log('sessionStorage after visiting /svg-to-vue:', storedAfterVue);
  await navigate(`${BASE}/batch`);
  const batchActive = await evalJs(`(() => {
    const tabs = [...document.querySelectorAll('nav[aria-label="Framework selector"] button')];
    return tabs.find(t => t.getAttribute('aria-current') === 'page')?.textContent?.trim();
  })()`);
  console.log('Active tab on /batch:', batchActive);
  await screenshot('03-batch-after-vue.png');

  // ─── TEST 4: Fresh session direct /batch = React ───
  console.log('\n=== TEST 4: Fresh direct /batch ===');
  await evalJs(`sessionStorage.clear(); localStorage.removeItem('theme'); 'ok'`);
  await navigate(`${BASE}/batch`);
  const freshBatch = await evalJs(`(() => {
    const tabs = [...document.querySelectorAll('nav[aria-label="Framework selector"] button')];
    return tabs.find(t => t.getAttribute('aria-current') === 'page')?.textContent?.trim();
  })()`);
  console.log('Fresh /batch active tab:', freshBatch);
  await screenshot('04-fresh-batch.png');

  // ─── TEST 5: Svelte in single → /sprite ───
  console.log('\n=== TEST 5: Svelte -> /sprite ===');
  await navigate(`${BASE}/svg-to-svelte`);
  await sleep(500);
  await navigate(`${BASE}/sprite`);
  const spriteActive = await evalJs(`(() => {
    const tabs = [...document.querySelectorAll('nav[aria-label="Framework selector"] button')];
    return tabs.find(t => t.getAttribute('aria-current') === 'page')?.textContent?.trim();
  })()`);
  console.log('Active tab on /sprite:', spriteActive);

  // ─── TEST 6: console errors ───
  const errors = await evalJs(`window.__errs || []`);
  console.log('\nConsole errors captured:', JSON.stringify(errors));

  console.log('\nDONE');
  chrome.kill();
  process.exit(0);
}

main().catch(e => { console.error('FAILED:', e); chrome.kill(); process.exit(1); });
