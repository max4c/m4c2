/* Only the active timer version is stored. No health data or pages are cached. */
function state(mode, operation) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("supermedium-rest", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("timer");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result,
        tx = db.transaction("timer", mode);
      const result = operation(tx.objectStore("timer"));
      tx.oncomplete = () => {
        resolve(result.result);
        db.close();
      };
      tx.onerror = () => {
        reject(tx.error);
        db.close();
      };
    };
  });
}
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("message", (event) => {
  if (event.data?.type !== "rest-version") return;
  event.waitUntil(
    (async () => {
      await state("readwrite", (store) =>
        store.put(event.data.version, "version"),
      );
      for (const n of await self.registration.getNotifications({
        tag: "supermedium-rest",
      }))
        n.close();
      event.ports[0]?.postMessage({ ok: true });
    })(),
  );
});
self.addEventListener("push", (event) => {
  let data;
  try {
    data = event.data.json();
  } catch {
    return;
  }
  if (!Number.isFinite(data.endsAt) || Date.now() - data.endsAt > 60000) return;
  event.waitUntil(
    (async () => {
      const current = await state("readonly", (store) => store.get("version"));
      if (!current || current !== data.version) return;
      await self.registration.showNotification("Rest complete", {
        body: "Ready for your next set.",
        tag: "supermedium-rest",
        renotify: true,
        icon: "/supermedium-icons/bonsai-192.png",
        badge: "/supermedium-icons/icon-32.png",
        vibrate: [200, 100, 200],
        data: { url: "/#today" },
      });
    })(),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clients) => {
        const open = clients.find(
          (c) => new URL(c.url).origin === self.location.origin,
        );
        if (open) {
          await open.navigate("/#today");
          return open.focus();
        }
        return self.clients.openWindow("/#today");
      }),
  );
});
