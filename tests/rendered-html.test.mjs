import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete controller", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Codex Micro Clicker<\/title>/i);
  assert.match(html, /data-controller="codex-micro"/);
  assert.match(html, /aria-label="Agent key 1"/);
  assert.match(html, /aria-label="Rotate knob"/);
  assert.match(html, /aria-label="Move jog"/);
  assert.match(html, /aria-label="Tap sensor"/);
  assert.match(html, /agent-cap\.webp/);
  assert.match(html, /agent-switch\.webp/);

  const controls = html.match(/data-control-id=/g) ?? [];
  assert.equal(controls.length, 15);
});
