export const pickerUri = "ui://wardrobe/image-picker-v4.html";
export const widgetMime = "text/html;profile=mcp-app";

export const pickerHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{font:16px/1.45 system-ui,sans-serif;color-scheme:light dark}
body{margin:0;padding:12px}p{margin:0 0 8px}button,input{font:inherit}
button{padding:6px 12px;border:1px solid currentColor;border-radius:6px;color:inherit;background:transparent;cursor:pointer}
[hidden]{display:none}
</style></head><body>
<p id="status" role="status"></p>
<div id="actions" hidden>
<button id="use" type="button" hidden>Save attached image</button>
<button id="choose" type="button" hidden>Choose an image from ChatGPT</button>
<label id="local" hidden>Choose an image from your device <input type="file" accept="image/png,image/jpeg,image/webp"></label>
</div>
<script>
const statusEl = document.getElementById("status");
const actions = document.getElementById("actions");
const use = document.getElementById("use");
const choose = document.getElementById("choose");
const local = document.getElementById("local");
const input = local.querySelector("input");
let pending, saved = false, busy = false, attemptedId = "";
function receive(result) {
  if (!result) return;
  if (result.status === "saved" || result.status === "already_saved") {
    saved = true; pending = null; actions.hidden = true;
    statusEl.textContent = "Saved in " + result.closet + "’s closet. Item ID: " + result.itemId;
    return;
  }
  if (saved || result.status !== "needs_image") return;
  if (pending && !actions.hidden && result.fileId === pending.fileId) return;
  const host = window.openai;
  pending = result;
  statusEl.textContent = "Select the photo for " + result.fields.name + " in " + result.closet + "’s closet.";
  actions.hidden = !host?.getFileDownloadUrl || !host?.callTool;
  use.hidden = !result.fileId || result.fileId === attemptedId;
  choose.hidden = typeof host?.selectFiles !== "function";
  local.hidden = typeof host?.uploadFile !== "function";
  if (!actions.hidden && !use.hidden && !busy) { attemptedId = result.fileId; void saveImage("use"); }
  if (actions.hidden || (use.hidden && choose.hidden && local.hidden))
    statusEl.textContent = "Retry the save with the existing conversation photo selected.";
}
async function saveImage(method) {
  if (!pending || busy) return;
  const host = window.openai;
  const {fields, fileId} = pending;
  busy = true; use.disabled = choose.disabled = input.disabled = true;
  try {
    let id = fileId;
    if (method === "choose") {
      const files = await host.selectFiles();
      if (!files?.length) throw Error("ChatGPT returned no image. Choose an image file from your library.");
      if (files.length !== 1) throw Error("Choose one image for this item.");
      id = files[0].fileId;
    }
    if (method === "upload") {
      if (!input.files.length) return;
      id = (await host.uploadFile(input.files[0])).fileId;
    }
    if (!id) throw Error("The selected entry has no image file ID. Choose the original photo.");
    let downloadUrl;
    try { ({downloadUrl} = await host.getFileDownloadUrl({fileId:id})); }
    catch { if (method === "use") { attemptedId = id; use.hidden = true; } }
    if (!downloadUrl) throw Error("Choose the existing photo from ChatGPT to grant access.");
    statusEl.textContent = "Saving the selected photo…";
    const result = await host.callTool("save_selected_wardrobe_photo", {...fields,downloadUrl});
    const envelope = result?.result && typeof result.result === "object" ? result.result : result;
    let receipt = envelope?.structuredContent ?? (envelope?.status ? envelope : null);
    const text = envelope?.content?.find(v=>v.type === "text")?.text ?? result?.result;
    if (receipt?.error?.message) throw Error(receipt.error.message);
    if (envelope?.isError) throw Error(typeof text === "string" ? text : "Couldn’t save the image.");
    if (!receipt && typeof text === "string") { try { receipt = JSON.parse(text); } catch {} }
    if (!pending) return; // The host already delivered the final receipt.
    if (receipt?.status !== "saved" && receipt?.status !== "already_saved") throw Error("Save unconfirmed. Retry with the same image.");
    receive(receipt);
  } catch (error) {
    statusEl.textContent = error.message || "Couldn’t save the image. Please try again.";
  } finally { busy = false; use.disabled = choose.disabled = input.disabled = false; input.value = ""; }
}
use.onclick = () => saveImage("use");
choose.onclick = () => saveImage("choose");
input.onchange = () => saveImage("upload");
// ChatGPT waits for the MCP Apps handshake before displaying the card.
const initId = "outfits-picker-init";
function post(message) {
  window.parent.postMessage({jsonrpc:"2.0", ...message}, "*");
}
window.addEventListener("message", ({source,data}) => {
  if (source !== window.parent || data?.jsonrpc !== "2.0") return;
  if (data.id === initId && data.result) {
    post({method:"ui/notifications/initialized",params:{}});
    receive(window.openai?.toolOutput);
  } else if (data.method === "ui/notifications/tool-result") {
    receive(data.params?.structuredContent);
  } else if (data.id !== undefined && (data.method === "ping" || data.method === "ui/resource-teardown")) {
    post({id:data.id,result:{}});
  }
});
post({id:initId,method:"ui/initialize",params:{
  appInfo:{name:"outfits-image-picker",version:"1.3.2"},
  appCapabilities:{availableDisplayModes:["inline"]},protocolVersion:"2026-01-26"
}});
window.addEventListener("openai:set_globals", e => receive(e.detail?.globals?.toolOutput ?? window.openai?.toolOutput));
receive(window.openai?.toolOutput);
</script></body></html>`;
