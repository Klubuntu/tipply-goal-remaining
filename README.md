# Tipply Goal Remaining Widget

A simple web widget that displays the remaining amount to reach a Tipply goal, with automatic refresh.

[Wersja Polska](README_pl.md)

## Run

You can run Tipply Goal Remaining in two ways:

1. **Download Pre-built Executable**
   - Download the latest executable for your platform from [Releases](../../releases)
   - Extract the archive and navigate to the `tipply-gr` folder
   - Edit `config.json` with your goal URL and preferences
   - Run the executable:
     - macOS: `./tipply-gr-macos-x64` or `./tipply-gr-macos-arm64` (for Apple Silicon)
     - Linux: `./tipply-gr-linux-x64`
     - Windows: `tipply-gr-win-x64.exe`

2. **Build from Source**
   - Follow the instructions in the [Build](#build) section to compile a standalone executable for your platform
   - The compiled executable will be available in `app/dist/`

## Setup

1. Edit `config.json` to set your goal URL, refresh interval (in seconds), and theme
  - `goalUrl`: The Tipply widget URL (default: `""`; e.g., "https://widgets.tipply.pl/TIPS_GOAL/{user_id}/GOAL/{goal_id}")
   - `refreshIntervalSeconds`: How often to refresh data (default: 3 seconds)
   - `theme`: Theme name (default: "dark"). See [Themes](#themes) for available options

2. Run the server:
   - **Windows**: Double-click `start_WIN.bat` or run `start_WIN.bat [--debug]` in Command Prompt
   - **Linux/Mac**: Run `./start_Linux_macOS.sh [--debug]` in terminal

   Use `--debug` to enable detailed logging

3. Open http://localhost:3785 in your browser

> The server first tries port `3785`, then finally falls back to any free port if both are busy

## Project Structure

- `config.json`: User-editable configuration
- `app/`: Application code (do not modify)
- `public/`: Static web files (HTML, JS)
- `public/css/`: CSS files (colors.css for themes, goal.css for layout)
- `public/fonts/`: place custom font files here
- `start_WIN.bat` / `start_Linux_macOS.sh`: Cross-platform start scripts

Please only modify `config.json`

## Fonts

The widget imports `public/css/fonts.css` from `public/css/goal.css` by default. Add custom font files into `public/fonts/` and define them in `public/css/fonts.css` using `@font-face`.

Example font definition in `public/css/fonts.css`:

```css
@font-face {
  font-family: 'Tipply Sans';
  src: url('/fonts/TipplySans.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

body {
  font-family: 'Tipply Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
```

## Build

The app can be built as a standalone executable without Electron.

From the repository root, run:

- `pnpm run build:macos`
- `pnpm run build:macos-arm64`
- `pnpm run build:linux`
- `pnpm run build:windows`
- `pnpm run build:all`

These proxy scripts call the build commands inside the `app/` folder. Before building, install dependencies in `app/`:

- `cd app && pnpm install`

Then build directly from `app/` with:

- `cd app && pnpm run build:macos`
- `cd app && pnpm run build:macos-arm64`
- `cd app && pnpm run build:linux`
- `cd app && pnpm run build:windows`
- `cd app && pnpm run build:all`

Each build script produces a `dist/` output folder in `app/` containing the executable and a `tipply-gr` subfolder with `config.json`, `public/css/`, and `public/fonts/`.

## Optimize

Run `./optimize.sh` from the repository root to remove generated build output, lockfiles, `node_modules`, and reset `config.json` to its default values. The script stays in the root folder and is not part of the build.

## Themes

Available themes for the widget:

- **purple**: Purple gradient background with glass effect container
- **dark**: Dark gray gradient background
- **transparent**: Transparent background, glass effect container only
- **blue**: Blue gradient background
- **green**: Green gradient background
- **red**: Red gradient background
- **minimal**: Black minimal theme with Tipply-style white-green progress bar

:warning: Project is only for educational purposes. You can use at your own risk.
Created with #vibecoding