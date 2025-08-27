"use client";
import { useEffect, useState } from "react";

const KEY = "animex:consent";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem(KEY);
      setVisible(!consent);
    }
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-[var(--background)]/90 border-t backdrop-blur p-4 flex items-center justify-between gap-4">
      <p className="text-sm">We use analytics to improve the app. You can opt-out anytime.</p>
      <div className="flex gap-2">
        <button className="px-3 py-1 border rounded" onClick={() => { localStorage.setItem(KEY, "denied"); setVisible(false); }}>Decline</button>
        <button className="px-3 py-1 border rounded" onClick={() => { localStorage.setItem(KEY, "granted"); setVisible(false); location.reload(); }}>Allow</button>
      </div>
    </div>
  );
}
