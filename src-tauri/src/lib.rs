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
pub struct ZoomPreviewData {
    pub image_data: String, // Base64 encoded PNG
    pub center_color: ColorInfo,
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
fn get_color_at_cursor() -> Result<ColorInfo, String> {
    color_picker::get_color_at_cursor()
}

#[tauri::command]
fn capture_zoom_preview(size: u32) -> Result<ZoomPreviewData, String> {
    color_picker::capture_zoom_preview(size)
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
fn start_pick_mode(app: tauri::AppHandle) -> Result<(), String> {
    PICK_MODE_ACTIVE.store(true, Ordering::SeqCst);

    // Hide the main window so user can see the screen
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }

    // Set custom cursor
    color_picker::set_pick_cursor();

    // Emit event to frontend
    let _ = app.emit("pick-mode-started", ());

    Ok(())
}

#[tauri::command]
fn stop_pick_mode(app: tauri::AppHandle) -> Result<(), String> {
    PICK_MODE_ACTIVE.store(false, Ordering::SeqCst);

    // Restore default cursor
    color_picker::restore_default_cursor();

    // Show the main window
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }

    // Emit event to frontend
    let _ = app.emit("pick-mode-stopped", ());

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
fn pick_color_now(app: tauri::AppHandle) -> Result<ColorInfo, String> {
    // Get the color at current cursor position
    let color = color_picker::get_color_at_cursor()?;

    // Stop pick mode
    PICK_MODE_ACTIVE.store(false, Ordering::SeqCst);

    // Restore default cursor
    color_picker::restore_default_cursor();

    // Show the main window
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }

    // Emit the picked color
    let _ = app.emit("color-picked", color.clone());

    Ok(color)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
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
                                PICK_MODE_ACTIVE.store(false, Ordering::SeqCst);
                                color_picker::restore_default_cursor();
                                let _ = app.emit("color-picked", color);
                                if let Some(window) = app.get_webview_window("main") {
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                        } else {
                            // Start pick mode
                            PICK_MODE_ACTIVE.store(true, Ordering::SeqCst);
                            let _ = app.emit("pick-mode-started", ());
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.hide();
                            }
                            color_picker::set_pick_cursor();
                        }
                    }

                    // Escape to cancel pick mode
                    let escape_shortcut = Shortcut::new(None, Code::Escape);
                    if shortcut == &escape_shortcut && PICK_MODE_ACTIVE.load(Ordering::SeqCst) {
                        PICK_MODE_ACTIVE.store(false, Ordering::SeqCst);
                        color_picker::restore_default_cursor();
                        let _ = app.emit("pick-mode-stopped", ());
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            // Restore cursor in case a previous instance was killed without cleanup
            color_picker::restore_default_cursor_force();

            // Try registering pick shortcut from candidates list
            let mut shortcut_label = String::new();
            for (shortcut, label) in pick_shortcut_candidates() {
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
                .icon(app.default_window_icon().expect("bundle icon missing").clone())
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
                        PICK_MODE_ACTIVE.store(true, Ordering::SeqCst);
                        let _ = app.emit("pick-mode-started", ());
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                        // Set custom cursor
                        color_picker::set_pick_cursor();
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
            capture_zoom_preview,
            save_color_history,
            load_color_history,
            start_pick_mode,
            stop_pick_mode,
            is_pick_mode_active,
            pick_color_now,
            get_active_shortcut,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
