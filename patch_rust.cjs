const fs = require('fs');

let skillsRs = fs.readFileSync('src-tauri/src/skills.rs', 'utf-8');
skillsRs = skillsRs.replace(
  'pub fn delete_skill(path: String) -> Result<(), String> {',
  `pub fn delete_skill(path: String) -> Result<(), String> {
    println!("Deleting skill at path: {}", path);
    let p = std::path::PathBuf::from(&path);
    if !p.exists() {
        println!("Path does not exist, skipping deletion.");
        return Ok(());
    }`
);
fs.writeFileSync('src-tauri/src/skills.rs', skillsRs);
console.log("Rust Patched");
