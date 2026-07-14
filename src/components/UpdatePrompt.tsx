import { useEffect, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

const SKIP_KEY = "pixnib-skipped-version";

export function UpdatePrompt() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Give the app a moment to settle before phoning home
    const timer = setTimeout(async () => {
      try {
        const found = await check();
        if (found && localStorage.getItem(SKIP_KEY) !== found.version) {
          setUpdate(found);
        }
      } catch {
        // No release manifest yet or offline — stay quiet
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!update) return null;

  const handleUpdate = async () => {
    setProgress(0);
    setError(false);
    try {
      let total = 0;
      let received = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          received += event.data.chunkLength;
          if (total > 0) setProgress(Math.min(99, Math.round((received / total) * 100)));
        } else if (event.event === "Finished") {
          setProgress(100);
        }
      });
      await relaunch();
    } catch (err) {
      console.error("Update failed:", err);
      setProgress(null);
      setError(true);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(SKIP_KEY, update.version);
    setUpdate(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-[var(--bg-elevated)] border border-[var(--accent-border)] rounded-xl shadow-lg shadow-black/30 p-4 animate-fade-in-up z-50">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l1.9 5.7a2 2 0 001.3 1.3L21 11l-5.8 2a2 2 0 00-1.3 1.3L12 20l-1.9-5.7a2 2 0 00-1.3-1.3L3 11l5.8-2a2 2 0 001.3-1.3L12 2z" />
          <circle cx="19" cy="4" r="1.4" />
          <circle cx="5" cy="19" r="1.1" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold">
            A fresh coat of paint is here!
          </p>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            {error
              ? "Hmm, that didn't work — check your connection and try again."
              : `Pixnib v${update.version} is ready with new goodies inside.`}
          </p>

          {progress !== null ? (
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                {progress < 100 ? `Mixing the colors… ${progress}%` : "Restarting with the new look…"}
              </p>
            </div>
          ) : (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdate}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-[#06302a] text-[12px] font-semibold hover:opacity-90 transition-opacity duration-100 active:scale-[0.97]"
              >
                {error ? "Try again" : "Update now"}
              </button>
              <button
                onClick={handleSkip}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors duration-100 active:scale-[0.97]"
              >
                Skip this one
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
