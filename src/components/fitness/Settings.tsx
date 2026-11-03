"use client";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import PageHeader from "./PageHeader";
import { clearRestNotifications, RestAlerts } from "./RestTimer";
import type { SleepData } from "../../../shared/sleep";

export default function Settings({ sleep }: { sleep?: SleepData }) {
  return (
    <div className="settings-page">
      <PageHeader title="Settings" />
      <div className="settings-list">
        <a href="#goals">
          Goals <ChevronRightIcon aria-hidden="true" />
        </a>
        <a href="#routine">
          Routine <ChevronRightIcon aria-hidden="true" />
        </a>
        <RestAlerts />
        <details className="disclosure settings-connection">
          <summary>Garmin</summary>
          <p>
            {!sleep
              ? "Checking connection…"
              : sleep.status === "connected"
                ? "Connected"
                : sleep.status === "unavailable"
                  ? "Unavailable. Try again later."
                  : "Not connected"}
          </p>
          {sleep?.status === "connected" && (
            <p>
              Sync your watch with Garmin Connect. Sleep updates when you open
              Supermedium; syncing can take up to 15 minutes.
            </p>
          )}
        </details>
        <button
          className="forget-device"
          onClick={async () => {
            await clearRestNotifications().catch(() => {});
            const response = await fetch("/fitness/api/logout", {
              method: "POST",
            });
            if (response.ok) location.replace(location.pathname);
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
