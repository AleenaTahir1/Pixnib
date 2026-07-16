<div align="center">

<img src="public/logo.svg" alt="Pixnib Logo" width="120" />

# Pixnib

**Screen color picker for Windows**

Pick any color from anywhere on your screen — not just browsers, not just apps.

[![Release](https://img.shields.io/github/v/release/AleenaTahir1/Pixnib)](https://github.com/AleenaTahir1/Pixnib/releases)
[![Build](https://img.shields.io/github/actions/workflow/status/AleenaTahir1/Pixnib/ci.yml)](https://github.com/AleenaTahir1/Pixnib/actions)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE.txt)

</div>

---

## Built for Designers

You work with colors all day. Matching a client's brand color from a PDF. Grabbing that exact blue from a competitor's website. Sampling a shade from an image in Photoshop. Finding the perfect accent from a Dribbble shot.

**The problem?** Browser extensions only work in browsers. Figma's eyedropper only works in Figma. Every tool is trapped in its own sandbox.

**Pixnib breaks that wall.**

Press `Win+Shift+C` and pick any color from anywhere — your desktop wallpaper, a video playing in VLC, a color in an email, a pixel in a game. Anywhere. The hex code is instantly copied to your clipboard.

No switching apps. No screenshots. No color conversion tools. Just point and pick.

---

<div align="center">
<img src="screenshots/app.png" alt="Pixnib App" width="380" />
</div>

---

## Features

- **Pick from anywhere** — Not limited to browsers or specific apps. Any pixel on your screen is fair game.
- **Magnifier loupe** — A zoomed pixel grid follows your cursor while picking, so you land on the exact pixel.
- **Average an area** — Drag a rectangle to get the average color of a region — great for noisy images and photos.
- **Instant hotkey** — Press `Win+Shift+C` from any app, anytime
- **Multiple formats** — Copy as HEX, RGB, or HSL with one click
- **Copy as code** — Grab the color as a CSS variable, Tailwind class, SwiftUI or Flutter `Color`.
- **Shades & tints** — See a full lightness scale of any color; click a step to copy it.
- **Contrast checker** — WCAG contrast ratio with AA/AAA pass badges for any text/background pair.
- **Named palettes** — Collect colors into palettes and export them as CSS, SCSS, or JSON.
- **Color history** — All picked colors are saved and browsable
- **Auto-copy** — Color values are copied to clipboard automatically
- **Settings** — Choose your shortcut, default copy format, and launch-at-startup.
- **Auto-updates** — Pixnib politely offers new versions as they ship.
- **System tray** — Runs quietly in the background, always ready
- **Dark theme** — Clean, minimal UI that stays out of your way
- **Hotkey fallback** — If `Win+Shift+C` is taken by another app, Pixnib automatically registers the next available shortcut (`Ctrl+Shift+C`, `Win+Shift+P`, …) and shows you which one is active

---

## How is this different from PowerToys Color Picker?

[PowerToys Color Picker](https://learn.microsoft.com/en-us/windows/powertoys/color-picker) is great — if you already run PowerToys, you may not need Pixnib. The honest differences:

- **Standalone** — Pixnib is a single small app. You don't have to install and keep the whole PowerToys suite running to get a color picker.
- **Focused UI** — One job, one window: pick, history, copy. No settings sprawl.
- **Automatic hotkey fallback** — If `Win+Shift+C` is already taken on your machine, Pixnib walks a list of candidate shortcuts until one registers, and tells you which one you got.

If you live in the full PowerToys suite already, stick with it. If you just want a color picker, Pixnib is the lighter option.

---

## Installation

Download the latest release from the [Releases](https://github.com/AleenaTahir1/Pixnib/releases) page:

- **`.msi`** — Standard Windows installer (recommended)
- **`.exe`** — NSIS installer

---

## How to Use

1. **Click "Pick a Color"** or press `Win+Shift+C`
2. **App hides** so you can see your full screen
3. **Move your cursor** to any color you want
4. **Press `Win+Shift+C` again** to capture the color
5. **Color is copied** to your clipboard automatically

Press `Esc` to cancel pick mode without capturing.

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Win+Shift+C` | Start pick mode / Capture color |
| `Esc` | Cancel pick mode |

### Color Formats

Right-click any color from history to copy in different formats:

- **HEX** — `#3B82F6`
- **RGB** — `rgb(59, 130, 246)`
- **HSL** — `hsl(217, 91%, 60%)`

---

## Development

### Requirements

- Node.js 18+
- Rust 1.70+
- Tauri 2 system dependencies

### Run Locally

```bash
git clone https://github.com/AleenaTahir1/Pixnib.git
cd Pixnib
npm install
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

### Project Structure

```
Pixnib/
├── src/                    # Frontend (React + TypeScript)
│   ├── components/         # UI components
│   ├── hooks/              # Custom hooks
│   ├── types/              # TypeScript types
│   └── utils/              # Color conversion utilities
├── src-tauri/              # Backend (Rust)
│   ├── src/
│   │   ├── lib.rs          # App setup, commands, tray
│   │   ├── color_picker.rs # Screen capture, pixel reading
│   │   └── storage.rs      # Color history persistence
│   └── capabilities/       # Tauri 2 permissions
└── package.json
```

---

## Tech Stack

- **Frontend** — React 18, TypeScript, Tailwind CSS
- **Backend** — Rust, Tauri 2
- **Screen Capture** — Windows GDI API, xcap
- **Build** — Vite

---

## Credits

The Theme palettes library bundles curated palettes from
[nice-color-palettes](https://github.com/Experience-Monks/nice-color-palettes) and
[dictionary-of-colour-combinations](https://github.com/mattdesl/dictionary-of-colour-combinations)
(Sanzo Wada), both MIT. See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

## License

Pixnib is open source under the [MIT License](LICENSE.txt). Use it, modify it, ship it — personal or commercial, no permission needed.

---

## Author

**Aleena Tahir**

- GitHub: [AleenaTahir1](https://github.com/AleenaTahir1)
