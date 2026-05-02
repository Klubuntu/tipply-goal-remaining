# Tipply Goal Remaining Widget

Prosty widget WWW pokazujący, ile brakuje do osiągnięcia celu Tipply, z automatycznym odświeżaniem.

## Konfiguracja

1. Edytuj `config.json`, aby ustawić URL celu, interwał odświeżania i motyw.
   - `goalUrl`: URL widgetu Tipply (domyślnie `""`; np. "https://widgets.tipply.pl/TIPS_GOAL/{user_id}/GOAL/{goal_id}")
   - `refreshIntervalSeconds`: Jak często odświeżać dane (domyślnie: 3 sekundy)
   - `theme`: Nazwa motywu (domyślnie: `"dark"`). Dostępne opcje są opisane w sekcji [Motywy](#motywy)

2. Uruchom serwer:
   - **Windows**: Kliknij dwukrotnie `start_WIN.bat` albo uruchom `start_WIN.bat [--debug]` w Command Prompt
   - **Linux/Mac**: Uruchom `./start_Linux_macOS.sh [--debug]` w terminalu

   Użyj `--debug`, aby włączyć szczegółowe logi

3. Otwórz http://localhost:3785 w przeglądarce

> Serwer najpierw próbuje portu `3785`, potem wybiera dowolny wolny port.

## Struktura projektu

- `config.json`: Konfiguracja użytkownika
- `app/`: Kod aplikacji
- `public/`: Statyczne pliki WWW (HTML, JS)
- `public/css/`: Pliki CSS
- `public/fonts/`: Własne pliki fontów
- `start_WIN.bat` / `start_Linux_macOS.sh`: Skrypty startowe

## Czcionki

Domyślnie widget ładuje `public/css/fonts.css` z `public/css/goal.css`. Własne pliki fontów dodaj do `public/fonts/` i opisz w `public/css/fonts.css` za pomocą `@font-face`.

## Build

Aplikację można zbudować jako samodzielny plik wykonywalny bez Electron.

Z katalogu głównego uruchom:

- `pnpm run build:macos`
- `pnpm run build:macos-arm64`
- `pnpm run build:linux`
- `pnpm run build:windows`
- `pnpm run build:all`

Każdy build tworzy katalog `dist/` w `app/`, z plikiem wykonywalnym oraz folderem `tipply-gr`, który zawiera `config.json`, `public/css/` i `public/fonts/`.

HTML widgetu i skrypt klienta są wbudowane w plik wykonywalny, więc `index.html` oraz `script.js` nie są już rozpakowywane do outputu builda.

## Optimize

Uruchom `./optimize.sh` z katalogu głównego, aby usunąć wygenerowany build, locki, `node_modules` i przywrócić `config.json` do domyślnych wartości. Skrypt zostaje w root i nie trafia do builda.

## Motywy

- **purple**: Fioletowe gradientowe tło z efektem szkła
- **dark**: Ciemnoszare gradientowe tło
- **transparent**: Przezroczyste tło, tylko kontener ze szkłem
- **blue**: Niebieskie gradientowe tło
- **green**: Zielone gradientowe tło
- **red**: Czerwone gradientowe tło
- **minimal**: Ciemny minimalistyczny motyw z biało-zielonym paskiem postępu

:warning: Projekt jest wyłącznie do celów edukacyjnych. Używasz go na własną odpowiedzialność.