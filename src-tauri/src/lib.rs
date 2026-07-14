mod color_picker;
mod storage;

use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

// Global state for pick mode
static PICK_MODE_ACTIVE: AtomicBool = AtomicBool::new(false);

// Stores the registered pick shortcut and its display label
static ACTIVE_SHORTCUT: Mutex<Option<(Shortcut, String)>> = Mutex::new(None);

/// Candidate shortcuts to try in order of preference (all work on Win 10 & 11)
fn pick_shortcut_candidates() -> Vec<(Shortcut, &'static str)> {
    vec![
        (
            Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyC),
            "Win+Shift+C",
        ),
        (
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyC),
            "Ctrl+Shift+C",
        ),
        (
            Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyP),
            "Win+Shift+P",
        ),
        (
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyC),
            "Ctrl+Alt+C",
        ),
        (
            Shortcut::new(Some(Modifiers::SUPER | Modifiers::ALT), Code::KeyC),
            "Win+Alt+C",
        ),
    ]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColorInfo {
    pub hex: String,
    pub rgb: [u8; 3],
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColorEntry {
    pub id: String,
    pub hex: String,
    pub rgb: [u8; 3],
    pub timestamp: u64,
    pub label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Palette {
    pub id: String,
    pub name: String,
    pub colors: Vec<String>, // hex values
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoupeData {
    pub colors: Vec<String>, // grid×grid hex values, row-major
    pub hex: String,         // center pixel
    pub x: i32,
    pub y: i32,
}

/// Put the app into pick mode: hide the main window, show the loupe,
/// swap the cursor and notify the frontend.
fn enter_pick_mode(app: &tauri::AppHandle) {
    PICK_MODE_ACTIVE.store(true, Ordering::SeqCst);
    let _ = app.emit("pick-mode-started", ());
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
    if let Some(loupe) = app.get_webview_window("loupe") {
        let _ = loupe.show();
    }
    color_picker::set_pick_cursor();
}

/// Leave pick mode, restoring the cursor and windows. Emits `color-picked`
/// when a color was captured, `pick-mode-stopped` otherwise.
fn exit_pick_mode(app: &tauri::AppHandle, picked: Option<ColorInfo>) {
    PICK_MODE_ACTIVE.store(false, Ordering::SeqCst);
    color_picker::restore_default_cursor();
    if let Some(loupe) = app.get_webview_window("loupe") {
        let _ = loupe.hide();
    }
    match picked {
        Some(color) => {
            let _ = app.emit("color-picked", color);
        }
        None => {
            let _ = app.emit("pick-mode-stopped", ());
        }
    }
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[tauri::command]
fn get_color_at_cursor() -> Result<ColorInfo, String> {
    color_picker::get_color_at_cursor()
}

#[tauri::command]
fn capture_loupe(app: tauri::AppHandle, grid: u32) -> Result<LoupeData, String> {
    let data = color_picker::capture_loupe_grid(grid)?;

    // Follow the cursor, flipping to the other side near screen edges
    if let Some(loupe) = app.get_webview_window("loupe") {
        const GAP: i32 = 24;
        let size = loupe
            .outer_size()
            .unwrap_or_else(|_| tauri::PhysicalSize::new(160, 190));
        let (mut nx, mut ny) = (data.x + GAP, data.y + GAP);
        if let Ok(Some(monitor)) = app.monitor_from_point(data.x as f64, data.y as f64) {
            let (mpos, msize) = (monitor.position(), monitor.size());
            if nx + size.width as i32 > mpos.x + msize.width as i32 {
                nx = data.x - GAP - size.width as i32;
            }
            if ny + size.height as i32 > mpos.y + msize.height as i32 {
                ny = data.y - GAP - size.height as i32;
            }
        }
        let _ = loupe.set_position(tauri::PhysicalPosition::new(nx, ny));
    }

    Ok(data)
}

#[tauri::command]
async fn save_color_history(app: tauri::AppHandle, colors: Vec<ColorEntry>) -> Result<(), String> {
    storage::save_color_history(&app, &colors).await
}

#[tauri::command]
async fn load_color_history(app: tauri::AppHandle) -> Result<Vec<ColorEntry>, String> {
    storage::load_color_history(&app).await
}

#[tauri::command]
async fn save_palettes(app: tauri::AppHandle, palettes: Vec<Palette>) -> Result<(), String> {
    storage::save_palettes(&app, &palettes)
}

#[tauri::command]
async fn load_palettes(app: tauri::AppHandle) -> Result<Vec<Palette>, String> {
    Ok(storage::load_palettes(&app))
}

#[tauri::command]
fn start_pick_mode(app: tauri::AppHandle) -> Result<(), String> {
    enter_pick_mode(&app);
    Ok(())
}

#[tauri::command]
fn stop_pick_mode(app: tauri::AppHandle) -> Result<(), String> {
    exit_pick_mode(&app, None);
    Ok(())
}

#[tauri::command]
fn is_pick_mode_active() -> bool {
    PICK_MODE_ACTIVE.load(Ordering::SeqCst)
}

#[tauri::command]
fn get_active_shortcut() -> String {
    ACTIVE_SHORTCUT
        .lock()
        .ok()
        .and_then(|guard| guard.as_ref().map(|(_, label)| label.clone()))
        .unwrap_or_default()
}

#[tauri::command]
fn list_shortcut_options() -> Vec<String> {
    pick_shortcut_candidates()
        .into_iter()
        .map(|(_, label)| label.to_string())
        .collect()
}

/// Switch the global pick shortcut, persisting the choice. Rolls back to the
/// previous shortcut if the requested one cannot be registered.
#[tauri::command]
fn set_pick_shortcut(app: tauri::AppHandle, label: String) -> Result<String, String> {
    let (shortcut, name) = pick_shortcut_candidates()
        .into_iter()
        .find(|(_, l)| *l == label)
        .ok_or_else(|| format!("Unknown shortcut: {label}"))?;

    let previous = ACTIVE_SHORTCUT.lock().unwrap().clone();
    if let Some((old, _)) = &previous {
        let _ = app.global_shortcut().unregister(*old);
    }

    match app.global_shortcut().register(shortcut) {
        Ok(_) => {
            *ACTIVE_SHORTCUT.lock().unwrap() = Some((shortcut, name.to_string()));
            let _ = storage::save_settings(
                &app,
                &storage::AppSettings {
                    preferred_shortcut: Some(name.to_string()),
                },
            );
            Ok(name.to_string())
        }
        Err(e) => {
            if let Some((old, old_label)) = previous {
                if app.global_shortcut().register(old).is_ok() {
                    *ACTIVE_SHORTCUT.lock().unwrap() = Some((old, old_label));
                }
            }
            Err(format!("{name} is unavailable: {e}"))
        }
    }
}

#[tauri::command]
fn pick_color_now(app: tauri::AppHandle) -> Result<ColorInfo, String> {
    let color = color_picker::get_color_at_cursor()?;
    exit_pick_mode(&app, Some(color.clone()));
    Ok(color)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state != ShortcutState::Pressed {
                        return;
                    }

                    // Check if this is the active pick shortcut
                    let is_pick = ACTIVE_SHORTCUT
                        .lock()
                        .ok()
                        .and_then(|guard| guard.as_ref().map(|(s, _)| shortcut == s))
                        .unwrap_or(false);

                    if is_pick {
                        if PICK_MODE_ACTIVE.load(Ordering::SeqCst) {
                            // If already in pick mode, pick the color
                            if let Ok(color) = color_picker::get_color_at_cursor() {
                                exit_pick_mode(app, Some(color));
                            }
                        } else {
                            enter_pick_mode(app);
                        }
                    }

                    // Escape to cancel pick mode
                    let escape_shortcut = Shortcut::new(None, Code::Escape);
                    if shortcut == &escape_shortcut && PICK_MODE_ACTIVE.load(Ordering::SeqCst) {
                        exit_pick_mode(app, None);
                    }
                })
                .build(),
        )
        .setup(|app| {
            // Restore cursor in case a previous instance was killed without cleanup
            color_picker::restore_default_cursor_force();

            // Try registering pick shortcut from candidates, preferred one first
            let mut candidates = pick_shortcut_candidates();
            if let Some(pref) = storage::load_settings(app.handle()).preferred_shortcut {
                if let Some(pos) = candidates.iter().position(|(_, l)| *l == pref) {
                    let preferred = candidates.remove(pos);
                    candidates.insert(0, preferred);
                }
            }
            let mut shortcut_label = String::new();
            for (shortcut, label) in candidates {
                let _ = app.global_shortcut().unregister(shortcut);
                match app.global_shortcut().register(shortcut) {
                    Ok(_) => {
                        println!("Pick shortcut registered: {label}");
                        shortcut_label = label.to_string();
                        *ACTIVE_SHORTCUT.lock().unwrap() = Some((shortcut, label.to_string()));
                        break;
                    }
                    Err(e) => {
                        eprintln!("Shortcut {label} unavailable: {e}, trying next...");
                    }
                }
            }

            if shortcut_label.is_empty() {
                eprintln!(
                    "No pick shortcut could be registered. Use the tray menu to pick colors."
                );
            }

            // Register escape shortcut for cancelling pick mode
            let escape_shortcut = Shortcut::new(None, Code::Escape);
            let _ = app.global_shortcut().unregister(escape_shortcut);
            match app.global_shortcut().register(escape_shortcut) {
                Ok(_) => println!("Escape shortcut registered"),
                Err(e) => eprintln!("Failed to register Escape shortcut: {e}"),
            }

            // Frameless always-on-top loupe window; hidden until pick mode
            let loupe = tauri::WebviewWindowBuilder::new(
                app,
                "loupe",
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("Pixnib Loupe")
            .inner_size(148.0, 178.0)
            .decorations(false)
            .resizable(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .visible(false)
            .focused(false)
            .shadow(false)
            .transparent(true)
            .build()?;
            let _ = loupe.set_ignore_cursor_events(true);

            // Setup system tray
            let tray_shortcut_text = if shortcut_label.is_empty() {
                String::new()
            } else {
                format!(" ({shortcut_label})")
            };
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let pick_item = MenuItem::with_id(
                app,
                "pick",
                format!("Pick Color{tray_shortcut_text}"),
                true,
                None::<&str>,
            )?;
            let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&pick_item, &show_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(
                    app.default_window_icon()
                        .expect("bundle icon missing")
                        .clone(),
                )
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip(format!(
                    "Pixnib{}",
                    if shortcut_label.is_empty() {
                        String::new()
                    } else {
                        format!(" - {} to pick color", shortcut_label)
                    }
                ))
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        // Restore cursor before quitting
                        color_picker::restore_default_cursor();
                        app.exit(0);
                    }
                    "pick" => {
                        enter_pick_mode(app);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_color_at_cursor,
            capture_loupe,
            save_color_history,
            load_color_history,
            save_palettes,
            load_palettes,
            start_pick_mode,
            stop_pick_mode,
            is_pick_mode_active,
            pick_color_now,
            get_active_shortcut,
            list_shortcut_options,
            set_pick_shortcut,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
