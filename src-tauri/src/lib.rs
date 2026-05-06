use serde::Serialize;
use std::{
  fs,
  path::{Path, PathBuf},
  process::Command,
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

/// Fixed workspace under OS temp; cleared before each compile so aux/log/pdf do not pile up.
fn workspace_dir() -> PathBuf {
  std::env::temp_dir().join("tikz-drawer").join("workspace")
}

fn clear_workspace(dir: &Path) -> Result<(), String> {
  if dir.exists() {
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
      let path = entry.map_err(|e| e.to_string())?.path();
      if path.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| e.to_string())?;
      } else {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
      }
    }
  } else {
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
  }
  Ok(())
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
  let dir = workspace_dir();
  clear_workspace(&dir)?;

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

#[tauri::command(rename_all = "camelCase")]
fn copy_path(source: String, destination: String) -> Result<(), String> {
  if let Some(parent) = Path::new(&destination).parent() {
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
  }
  fs::copy(&source, &destination).map_err(|e| e.to_string())?;
  Ok(())
}

fn pdftocairo_candidates() -> [&'static str; 4] {
  [
    "pdftocairo",
    "/opt/homebrew/bin/pdftocairo",
    "/usr/local/bin/pdftocairo",
    "/Library/TeX/texbin/pdftocairo",
  ]
}

fn try_pdftocairo(pdf: &Path, png_out: &Path) -> bool {
  let parent = pdf.parent().unwrap_or_else(|| Path::new("."));
  let tmp_base = parent.join("_tikz_drawer_raster");
  let tmp_png_path = parent.join("_tikz_drawer_raster.png");

  let _ = fs::remove_file(&tmp_png_path);

  for bin in pdftocairo_candidates() {
    let ok = Command::new(bin)
      .args(["-png", "-singlefile", "-r", "200"])
      .arg(pdf)
      .arg(&tmp_base)
      .status()
      .map(|s| s.success())
      .unwrap_or(false);
    if ok && tmp_png_path.exists() {
      let _ = fs::rename(&tmp_png_path, png_out);
      return png_out.exists();
    }
    let _ = fs::remove_file(&tmp_png_path);
  }
  false
}

fn try_magick(pdf: &Path, png_out: &Path) -> bool {
  let src = format!("{}[0]", pdf.display());
  let dest = png_out.display().to_string();

  for bin in ["magick", "convert"] {
    let mut cmd = if bin == "magick" {
      let mut c = Command::new("magick");
      c.arg("convert");
      c
    } else {
      Command::new(bin)
    };
    let ok = cmd
      .args(["-density", "200", &src, &dest])
      .status()
      .map(|s| s.success())
      .unwrap_or(false);
    if ok && png_out.exists() {
      return true;
    }
    let _ = fs::remove_file(png_out);
  }
  false
}

fn try_gs(pdf: &Path, png_out: &Path) -> bool {
  let out = format!("{}", png_out.display());
  for gs in ["gs", "gswin64c"] {
    let ok = Command::new(gs)
      .args([
        "-dNOPAUSE",
        "-dBATCH",
        "-sDEVICE=pngalpha",
        "-r200",
        &format!("-sOutputFile={out}"),
      ])
      .arg(pdf)
      .status()
      .map(|s| s.success())
      .unwrap_or(false);
    if ok && png_out.exists() {
      return true;
    }
    let _ = fs::remove_file(png_out);
  }
  false
}

/// Rasterize first PDF page to PNG next to the PDF (`drawing.png` in the same folder).
#[tauri::command(rename_all = "camelCase")]
fn rasterize_pdf_first_page(pdf_path: String) -> Result<String, String> {
  let pdf = PathBuf::from(&pdf_path);
  if !pdf.is_file() {
    return Err("PDF 不存在".into());
  }
  let png_path = pdf.with_file_name("drawing.png");
  let _ = fs::remove_file(&png_path);

  if try_pdftocairo(&pdf, &png_path) {
    return Ok(png_path.to_string_lossy().to_string());
  }
  if try_magick(&pdf, &png_path) {
    return Ok(png_path.to_string_lossy().to_string());
  }
  if try_gs(&pdf, &png_path) {
    return Ok(png_path.to_string_lossy().to_string());
  }

  Err(
    "无法生成 PNG：请安装 Poppler（pdftocairo）、ImageMagick（magick）或 Ghostscript（gs）之一。"
      .into(),
  )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      use tauri::menu::{MenuBuilder, SubmenuBuilder, MenuItemBuilder};
      use tauri::Emitter;

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Build macOS native menu bar
      let file_menu = SubmenuBuilder::new(app, "File")
        .item(&MenuItemBuilder::with_id("new_canvas", "New Canvas").accelerator("CmdOrCtrl+N").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("export_pdf", "Export PDF...").accelerator("CmdOrCtrl+Shift+E").build(app)?)
        .item(&MenuItemBuilder::with_id("export_png", "Export PNG...").build(app)?)
        .separator()
        .quit()
        .build()?;

      let compile_menu = SubmenuBuilder::new(app, "Compile")
        .item(&MenuItemBuilder::with_id("compile", "Compile").accelerator("CmdOrCtrl+R").build(app)?)
        .item(&MenuItemBuilder::with_id("copy_code", "Copy TikZ Code").accelerator("CmdOrCtrl+Shift+C").build(app)?)
        .item(&MenuItemBuilder::with_id("open_pdf", "Open PDF").build(app)?)
        .build()?;

      let menu = MenuBuilder::new(app)
        .item(&file_menu)
        .item(&compile_menu)
        .build()?;

      app.set_menu(menu)?;

      // Handle menu events and forward to frontend
      let handle = app.handle().clone();
      app.on_menu_event(move |_app, event| {
        let id = event.id().0.as_str();
        match id {
          "new_canvas" => { let _ = handle.emit("menu-new-canvas", ()); }
          "export_pdf" => { let _ = handle.emit("menu-export-pdf", ()); }
          "export_png" => { let _ = handle.emit("menu-export-png", ()); }
          "compile" => { let _ = handle.emit("menu-compile", ()); }
          "copy_code" => { let _ = handle.emit("menu-copy-code", ()); }
          "open_pdf" => { let _ = handle.emit("menu-open-pdf", ()); }
          _ => {}
        }
      });

      Ok(())
    })
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![
      compile_tikz,
      copy_path,
      rasterize_pdf_first_page,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
