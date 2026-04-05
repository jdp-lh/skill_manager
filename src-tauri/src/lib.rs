pub mod config;
pub mod linker;
pub mod marketplace;
pub mod skills;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Get the main window and maximize it
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.maximize();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            config::get_config,
            config::save_config,
            linker::toggle_link,
            linker::sync_all,
            skills::list_skills,
            skills::read_skill_file,
            skills::write_skill_file,
            skills::delete_skill,
            skills::test_agent_skill,
            marketplace::get_marketplace_listings,
            marketplace::get_marketplace_categories,
            marketplace::get_marketplace_listing_detail,
            marketplace::download_marketplace_skill,
            marketplace::get_featured_marketplace_listings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
