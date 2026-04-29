use serde::Serialize;
use std::{
  fs,
  path::PathBuf,
  process::Command,
  time::{SystemTime, UNIX_EPOCH},
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CompileResult {
  success: bool,
  log: String,
  pdf_path: Option<String>,
}

fn latex_document(tikz_code: &str) -> String {
  format!(
    "\\documentclass[tikz,border=6pt]{{standalone}}
\\usepackage{{tikz}}
\\usetikzlibrary{{arrows.meta,calc,decorations.pathreplacing,positioning}}

\\begin{{document}}
{}
\\end{{document}}
",
    tikz_code
  )
}

fn output_dir() -> Result<PathBuf, String> {
  let millis = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map_err(|error| error.to_string())?
    .as_millis();
  let dir = std::env::temp_dir().join("tikz-drawer").join(millis.to_string());
  fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
  Ok(dir)
}

fn run_pdflatex(dir: &PathBuf) -> Result<std::process::Output, String> {
  let args = ["-interaction=nonstopmode", "-halt-on-error", "drawing.tex"];
  let primary = Command::new("pdflatex").args(args).current_dir(dir).output();

  match primary {
    Ok(output) => Ok(output),
    Err(_) => Command::new("/Library/TeX/texbin/pdflatex")
      .args(args)
      .current_dir(dir)
      .output()
      .map_err(|error| error.to_string()),
  }
}

#[tauri::command(rename_all = "camelCase")]
fn compile_tikz(tikz_code: String) -> Result<CompileResult, String> {
  let dir = output_dir()?;
  let tex_path = dir.join("drawing.tex");
  fs::write(&tex_path, latex_document(&tikz_code)).map_err(|error| error.to_string())?;

  let output = run_pdflatex(&dir)?;
  let mut log = String::new();
  log.push_str(&String::from_utf8_lossy(&output.stdout));
  log.push_str(&String::from_utf8_lossy(&output.stderr));

  let pdf_path = dir.join("drawing.pdf");
  Ok(CompileResult {
    success: output.status.success(),
    log,
    pdf_path: output
      .status
      .success()
      .then(|| pdf_path.to_string_lossy().to_string()),
  })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![compile_tikz])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
