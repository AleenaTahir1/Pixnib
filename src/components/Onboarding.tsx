import { useEffect, useLayoutEffect, useState } from "react";

interface Step {
  sel: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  { sel: '[data-tour="pick"]', title: "Pick a color", body: "Click here or press your shortcut, then click any pixel on screen. A magnifier helps you land exactly." },
  { sel: '[data-tour="area"]', title: "Average an area", body: "Drag a rectangle to get the average color of a whole region — handy for photos and gradients." },
  { sel: '[data-tour="themes"]', title: "Theme palettes", body: "Browse ready-made designer palettes by mood, and copy or save the ones you like." },
  { sel: '[data-tour="palettes"]', title: "Your palettes", body: "Collect colors into named palettes and export them as CSS, SCSS, or JSON." },
  { sel: '[data-tour="theme"]', title: "Light or dark", body: "Switch the app between dark and light whenever you like." },
  { sel: '[data-tour="settings"]', title: "Settings", body: "Change your shortcut, default copy format, and launch-at-startup here." },
];

interface OnboardingProps {
  run: boolean;
  onDone: () => void;
}

/** First-run guided tour that spotlights each control with a short description. */
export function Onboarding({ run, onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!run) return;
    const measure = () => {
      const el = document.querySelector(STEPS[step].sel);
      if (el) setRect(el.getBoundingClientRect());
      else setRect(null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [run, step]);

  useEffect(() => {
    if (!run) setStep(0);
  }, [run]);

  if (!run) return null;

  const isLast = step === STEPS.length - 1;
  const finish = () => {
    setStep(0);
    onDone();
  };

  // Spotlight geometry (padded around the target)
  const pad = 6;
  const spot = rect
    ? {
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Place the tooltip below the target, or above if it would overflow
  const tipW = 250;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const below = rect ? rect.bottom + 150 < vh : true;
  const tipTop = rect ? (below ? rect.bottom + 12 : rect.top - 12) : vh / 2;
  const tipLeft = rect
    ? Math.min(Math.max(rect.left + rect.width / 2 - tipW / 2, 8), vw - tipW - 8)
    : vw / 2 - tipW / 2;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Dimmer with a cutout around the target via a huge box-shadow */}
      {spot ? (
        <div
          className="absolute rounded-lg pointer-events-none transition-all duration-200"
          style={{
            left: spot.left,
            top: spot.top,
            width: spot.width,
            height: spot.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
            outline: "2px solid var(--accent)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Tooltip card */}
      <div
        className="absolute w-[250px] bg-[var(--bg-elevated)] border border-[var(--border-hover)] rounded-xl shadow-xl shadow-black/40 p-3.5"
        style={{ left: tipLeft, top: tipTop, transform: below ? "none" : "translateY(-100%)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] font-semibold">{STEPS[step].title}</h3>
          <button
            onClick={finish}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-100 shrink-0 mt-0.5"
          >
            Skip
          </button>
        </div>
        <p className="text-[11.5px] text-[var(--text-secondary)] mt-1 leading-relaxed">{STEPS[step].body}</p>

        <div className="flex items-center justify-between mt-3">
          {/* Progress dots */}
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
                  i === step ? "bg-[var(--accent)]" : "bg-[var(--bg-hover)]"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors duration-100"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              className="px-3 py-1 rounded-lg bg-[var(--accent)] text-[var(--on-accent)] text-[11px] font-semibold hover:opacity-90 transition-opacity duration-100"
            >
              {isLast ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
