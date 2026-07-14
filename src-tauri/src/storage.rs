use crate::{ColorEntry, Palette};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

const HISTORY_FILE: &str = "color_history.json";
const SETTINGS_FILE: &str = "settings.json";
const PALETTES_FILE: &str = "palettes.json";

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AppSettings {
    /// Shortcut label the user chose in settings (tried first on startup)
    pub preferred_shortcut: Option<String>,
}

fn app_data_file(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Ensure directory exists
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    Ok(app_data_dir.join(name))
}

fn get_storage_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app_data_file(app, HISTORY_FILE)
}

pub fn save_settings(app: &tauri::AppHandle, settings: &AppSettings) -> Result<(), String> {
    let path = app_data_file(app, SETTINGS_FILE)?;
    let json = serde_json::to_string_pretty(settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    std::fs::write(&path, json).map_err(|e| format!("Failed to write settings file: {}", e))
}

pub fn load_settings(app: &tauri::AppHandle) -> AppSettings {
    app_data_file(app, SETTINGS_FILE)
        .ok()
        .filter(|path| path.exists())
        .and_then(|path| std::fs::read_to_string(path).ok())
        .and_then(|json| serde_json::from_str(&json).ok())
        .unwrap_or_default()
}

pub fn save_palettes(app: &tauri::AppHandle, palettes: &[Palette]) -> Result<(), String> {
    let path = app_data_file(app, PALETTES_FILE)?;
    let json = serde_json::to_string_pretty(palettes)
        .map_err(|e| format!("Failed to serialize palettes: {}", e))?;
    std::fs::write(&path, json).map_err(|e| format!("Failed to write palettes file: {}", e))
}

pub fn load_palettes(app: &tauri::AppHandle) -> Vec<Palette> {
    app_data_file(app, PALETTES_FILE)
        .ok()
        .filter(|path| path.exists())
        .and_then(|path| std::fs::read_to_string(path).ok())
        .and_then(|json| serde_json::from_str(&json).ok())
        .unwrap_or_default()
}

pub async fn save_color_history(
    app: &tauri::AppHandle,
    colors: &[ColorEntry],
) -> Result<(), String> {
    let path = get_storage_path(app)?;
    let json = serde_json::to_string_pretty(colors)
        .map_err(|e| format!("Failed to serialize colors: {}", e))?;

    std::fs::write(&path, json).map_err(|e| format!("Failed to write history file: {}", e))?;

    Ok(())
}

pub async fn load_color_history(app: &tauri::AppHandle) -> Result<Vec<ColorEntry>, String> {
    let path = get_storage_path(app)?;

    if !path.exists() {
        return Ok(Vec::new());
    }

    let json = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read history file: {}", e))?;

    let colors: Vec<ColorEntry> =
        serde_json::from_str(&json).map_err(|e| format!("Failed to parse history file: {}", e))?;

    Ok(colors)
}
