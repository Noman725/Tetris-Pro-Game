# 🎮 TETRIS PRO

![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-blue?logo=github)
![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)

A feature-rich, browser-based Tetris game built with **pure HTML, CSS, and JavaScript** — no frameworks, no build tools, no dependencies. Fully playable on desktop and mobile.

🔗 **Live Demo:** `https://YOUR-USERNAME.github.io/tetris-pro`

---

## 📋 Table of Contents

- [Deploy to GitHub Pages](#-deploy-to-github-pages)
- [Project Structure](#-project-structure)
- [Features](#-features)
- [Controls](#-controls)
- [Coin System & Shop](#-coin-system--shop)
- [Power-Up Cooldowns](#-power-up-cooldowns)
- [Puzzle Mode](#-puzzle-mode)
- [Browser Compatibility](#-browser-compatibility)
- [Customization](#-customization)

---

## 🚀 Deploy to GitHub Pages

Follow these steps — your game will be **live in under 5 minutes**.

---

### ✅ Step 1 — Install Git

If you don't have Git installed, download it from [git-scm.com](https://git-scm.com/downloads).

After installing, verify it works by opening a terminal and running:

```bash
git --version
# should print something like: git version 2.43.0
```

---

### ✅ Step 2 — Create a GitHub Account

Go to [github.com](https://github.com) and sign up for a free account if you don't have one already.

---

### ✅ Step 3 — Create a New Repository on GitHub

1. Log in to GitHub
2. Click the **`+`** icon (top right corner) → **New repository**
3. Fill in:
   - **Repository name:** `tetris-pro` (or any name you like)
   - **Visibility:** ✅ **Public** — required for free GitHub Pages
   - **DO NOT** tick "Add a README file" — you already have one
4. Click **Create repository**
5. Keep this page open — you'll need the URL shown on it

---

### ✅ Step 4 — Push Your Files to GitHub

Open a terminal (on Windows: Command Prompt or PowerShell; on Mac/Linux: Terminal).

**Navigate to your tetris project folder:**

```bash
cd path/to/your/tetris-pro
# Example on Windows:  cd C:\Users\YourName\Desktop\tetris-pro
# Example on Mac/Linux: cd ~/Desktop/tetris-pro
```

**Run these commands one by one:**

```bash
# 1. Initialize Git in this folder
git init

# 2. Stage all 4 files
git add index.html style.css game.js README.md

# 3. Create your first commit
git commit -m "🎮 Initial commit — Tetris Pro"

# 4. Connect to your GitHub repo
#    ⚠️ Replace YOUR-USERNAME and tetris-pro with your actual values
git remote add origin https://github.com/YOUR-USERNAME/tetris-pro.git

# 5. Rename branch to main (GitHub default)
git branch -M main

# 6. Push to GitHub
git push -u origin main
```

> **⚠️ First-time push asks for login?**
>
> GitHub no longer accepts your account password here.
> You need a **Personal Access Token (PAT)**:
>
> 1. Go to GitHub → click your avatar (top right) → **Settings**
> 2. Scroll down → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
> 3. Click **Generate new token (classic)**
> 4. Give it a name, set expiration, tick the **`repo`** checkbox
> 5. Click **Generate token** — copy the token immediately (you won't see it again)
> 6. When Git asks for your password, **paste the token** instead

After a successful push you'll see your files at:
`https://github.com/YOUR-USERNAME/tetris-pro`

---

### ✅ Step 5 — Enable GitHub Pages

1. On your repository page, click **Settings** (top tab)
2. In the left sidebar, click **Pages**
3. Under **Build and deployment → Source**, select **Deploy from a branch**
4. Set **Branch** → `main` and **Folder** → `/ (root)`
5. Click **Save**

⏳ Wait about **60 seconds**, then refresh the page.

Your live game URL will appear at the top of the Pages section:

```
https://YOUR-USERNAME.github.io/tetris-pro
```

**That's it — share this link with anyone. It works on all phones, tablets, and computers.** 🎉

---

### 🔄 Updating the Game Later

Every time you change any file, push the update with:

```bash
git add .
git commit -m "describe your change here"
git push
```

GitHub Pages redeploys automatically within ~30 seconds.

---

## 📁 Project Structure

```
tetris-pro/
├── index.html    ← Game layout, UI panels, overlay screens
├── style.css     ← Dark retro theme, fully responsive
├── game.js       ← All game logic, rendering, power-ups
└── README.md     ← This file
```

> No `node_modules`. No `package.json`. No build step. Just 3 files.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔨 **Hammer** | Break any single locked block on the board |
| 💣 **Bomb** | Click a block to blast a full 3×3 area |
| 🌈 **Rainbow Block** | Wildcard piece — fits anywhere, cycles through colors |
| 🐢 **Slow Motion** | Halves fall speed for 10 seconds |
| ❤️ **Extra Life** | Saves you when the board fills up |
| 🎁 **Mystery Box** | Randomly awards a surprise power-up |
| ⛏ **Stone Blocks** | Appear from Level 3 — only Hammer or Bomb destroys them |
| 🔥 **Combo System** | Chain clears for bonus score + animated popup |
| 🪙 **Coin Economy** | Earn coins in-game → buy power-ups from the shop |
| 🧩 **Puzzle Mode** | Procedurally generated boards, clear in limited moves |
| 📱 **Responsive** | Mobile touch controls + scales to any screen |
| 💾 **Persistent** | Best score and coin balance saved via `localStorage` |

---

## 🎮 Controls

### ⌨️ Keyboard — Desktop

| Key | Action |
|---|---|
| `← →` | Move piece left / right |
| `↑` | Rotate piece |
| `↓` | Soft drop |
| `Space` | Hard drop |
| `C` | Hold piece |
| `H` | Activate Hammer |
| `B` | Activate Bomb |
| `R` | Activate Rainbow piece |
| `M` | Open Mystery Box |
| `P` | Pause / Resume |
| `Esc` | Cancel active tool |
| `Enter` | Restart (on Game Over screen) |

### 📱 Touch — Mobile

Touch buttons appear automatically on screens under 700px wide:

| Button | Action |
|---|---|
| `◀` `▶` | Move left / right |
| `⟳ ROTATE` | Rotate piece |
| `▼` | Soft drop |
| `▼▼ HARD DROP` | Hard drop |
| `HOLD` | Hold piece |
| `⏸` | Pause / Resume |

---

## 🪙 Coin System & Shop

Coins persist across all sessions in your browser's `localStorage`.

**Earning Coins:**

| Action | Reward |
|---|---|
| Clear 1 line | +10 🪙 |
| Clear 2 lines | +20 🪙 |
| Clear 3 lines | +30 🪙 |
| Clear 4 lines (Tetris!) | +40 🪙 |
| Combo bonus | +5 × combo count 🪙 |
| Hammer a block | +5 🪙 |
| Bomb (per block cleared) | +3 🪙 |
| End of game | `score÷100 + lines×2 + level×5` 🪙 |

**Shop Prices:**

| Item | Price |
|---|---|
| 🔨 Hammer | 50 🪙 |
| 🌈 Rainbow | 60 🪙 |
| 💣 Bomb | 80 🪙 |
| 🐢 Slow Motion | 40 🪙 |
| ❤️ Extra Life | 120 🪙 |

---

## ⏱ Power-Up Cooldowns

Power-ups are **auto-granted on a countdown timer** during gameplay.  
**Pausing the game fully freezes all timers** — no time is lost.

| Power-Up | Auto-Grant Every | Max Stored |
|---|---|---|
| 🔨 Hammer | 45 seconds | 2 |
| 💣 Bomb | 60 seconds | 2 |
| 🌈 Rainbow | 75 seconds | 2 |
| 🎁 Mystery Box | 40 seconds | Unlimited |
| 🐢 Slow Motion | Shop / Mystery only | 2 |
| ❤️ Extra Life | Shop / Mystery only | 3 |

---

## 🧩 Puzzle Mode

Click **PUZZLE** in the mode toggle at the top of the left panel.

- The board starts pre-filled with blocks and strategic gaps
- **Goal:** clear the required number of lines within the move limit
- Every puzzle is **procedurally generated** — no two are the same
- Difficulty scales each round: more filled rows, fewer gaps, fewer allowed moves
- Clearing a puzzle awards bonus score + coins

---

## 🌐 Browser Compatibility

| Browser | Status |
|---|---|
| Chrome 80+ | ✅ Full support |
| Firefox 75+ | ✅ Full support |
| Safari 14+ | ✅ Full support |
| Edge 80+ | ✅ Full support |
| Mobile Chrome (Android) | ✅ Touch controls |
| Mobile Safari (iOS) | ✅ Touch controls |

---

## 🛠 Customization

All tunable values are at the top of `game.js`:

```js
// Board size
var COLS = 10, ROWS = 20;

// Starting fall speed in milliseconds (lower = faster)
var dropSpeed = 800;

// Shop prices
var SHOP_PRICES = { hammer:50, bomb:80, rainbow:60, slow:40, life:120 };

// Auto-grant cooldowns in seconds
var PU_CD = { hammer:45, bomb:60, rainbow:75, mystery:40 };

// Max inventory per power-up type
var PU_MAX = { hammer:2, bomb:2, rainbow:2, slow:2, life:3 };
```

To change piece colors, edit the `DEFS` object:

```js
var DEFS = {
  I: { color:'#11eeff', hi:'#aaffff', sh:'#007a88', ... },
  O: { color:'#ffe033', hi:'#fff099', sh:'#887000', ... },
  // T, S, Z, J, L ...
};
```

---

## 📄 License

Free to use, modify, and deploy for personal or commercial projects.

---

*Built with vanilla HTML5 Canvas, CSS3, and JavaScript. No libraries. No frameworks. No build tools.*
