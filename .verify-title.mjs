const CDP_BASE = "http://127.0.0.1:9224";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function createPage(url) {
  const res = await fetch(`${CDP_BASE}/json/new?${encodeURIComponent(url)}`, {
    method: "PUT",
  });
  return res.json();
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    ws.onopen = () =>
      resolve({
        ws,
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const msgId = ++id;
            pending.set(msgId, { res, rej });
            ws.send(JSON.stringify({ id: msgId, method, params }));
          });
        },
      });
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) rej(new Error(JSON.stringify(msg.error)));
        else res(msg.result);
      }
    };
    ws.onerror = (e) => reject(e);
  });
}

const page = await createPage("http://127.0.0.1:5173");
const cdp = await connect(page.webSocketDebuggerUrl);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");

for (let i = 0; i < 40; i++) {
  const r = await cdp.send("Runtime.evaluate", {
    expression: "document.readyState",
    returnByValue: true,
  });
  if (r.result.value === "complete") break;
  await sleep(500);
}
await sleep(2000);

async function evalJs(expr) {
  const r = await cdp.send("Runtime.evaluate", {
    expression: expr,
    returnByValue: true,
  });
  if (r.exceptionDetails) {
    throw new Error(JSON.stringify(r.exceptionDetails));
  }
  return r.result.value;
}

async function move(x, y) {
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x,
    y,
  });
}

async function shadowState() {
  return evalJs(`(() => {
    const divs = [...document.querySelectorAll('div')].filter(
      (d) => d.style.height && d.style.width,
    );
    return divs.map((d) => {
      const r = d.getBoundingClientRect();
      const cs = getComputedStyle(d);
      return {
        x: +r.left.toFixed(2),
        y: +r.top.toFixed(2),
        w: +r.width.toFixed(2),
        h: +r.height.toFixed(2),
        transform: cs.transform,
      };
    });
  })()`);
}

const titleRect = await evalJs(`(() => {
  const h = [...document.querySelectorAll('h1')].find((el) =>
    el.textContent.includes('Tiewu Chat'),
  );
  if (!h) return null;
  const r = h.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
})()`);
console.log("title rect:", JSON.stringify(titleRect));
if (!titleRect) {
  console.log("PAGE LOAD FAILED");
  process.exit(1);
}

const cx = titleRect.x + titleRect.w / 2;
const cy = titleRect.y + titleRect.h / 2;

await move(cx, cy);
await sleep(2600);
const enter1 = await shadowState();
console.log("enter1:", JSON.stringify(enter1));

await move(8, 900);
await sleep(1600);
const leave = await shadowState();
console.log(
  "leave:",
  JSON.stringify(leave.map((s) => ({ x: s.x, y: s.y, w: s.w, transform: s.transform }))),
);

await move(cx, cy);
await sleep(2600);
const enter2 = await shadowState();
console.log("enter2:", JSON.stringify(enter2));

const diff = enter1.map((a, i) => {
  const b = enter2[i];
  if (!b) return { i, missing: true };
  return {
    i,
    dx: +(a.x - b.x).toFixed(2),
    dy: +(a.y - b.y).toFixed(2),
    dw: +(a.w - b.w).toFixed(2),
    dh: +(a.h - b.h).toFixed(2),
  };
});
console.log("diff enter1-vs-enter2:", JSON.stringify(diff));

process.exit(0);
