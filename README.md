# Warblock - Top Down Shooter

A browser-based top-down shooter game built with vanilla JavaScript and HTML5 Canvas. Features user authentication, a level-based progression system, an in-game upgrade shop, a puzzle mechanic to earn credits, and a global leaderboard — all powered by **Supabase** as the backend.

> **Current Version:** v1.2.0

🎮 **[Play Now](https://ashfaaqrifath.github.io/Warblock-Top-Down-Shooter/)**

---

## ✨ Features

### 🎯 Gameplay
- Top-down shooter on an 800×600 HTML5 Canvas
- Level-based progression — clear waves to advance
- HUD showing Level, Credits, Ammo, and Health in real time
- Ammo system with reload bar animation
- Enemy waves that scale with difficulty

### 🛒 Upgrade Shop
Between levels, spend earned Credits on upgrades:

| Upgrade | Effect | Cost |
|---------|--------|------|
| Extended Mag | +5 Magazine Size | 25 credits |
| High-Caliber Rounds | 25% more damage | 50 credits |
| Temporal Field | Slows enemies for 5s | 80 credits |
| HP Siphon Rounds | +5 HP per kill | 75 credits |
| Damage Immunity | No damage taken for 5s | 70 credits |
| Explosive | Kills enemies within blast radius | 5 credits |

### 🧩 Puzzle System
Solve a **Heart Game Puzzle** to earn bonus credits — a math/logic puzzle modal that rewards correct answers.

### 🏆 Leaderboard & Accounts
- User **registration and login** with email/password
- **Highscore tracking** (stored in levels cleared)
- **Global leaderboard** showing top players
- Logout functionality

---

## 📁 Project Structure

```
Warblock-Top-Down-Shooter/
├── index.html          # Login & registration page
├── warblock.html       # Main game page (Canvas + HUD + Shop)
├── css/
│   ├── login.css       # Auth page styles
│   └── styles.css      # Game UI styles
├── js/
│   ├── Auth.js         # Supabase auth — login, register, session
│   ├── Main.js         # Game entry point — initialises everything
│   └── ...             # Game engine modules (player, enemies, bullets, etc.)
├── mylogo3.png         # Favicon / logo
└── LICENSE
```

---

## 🚀 Play Online

Just visit the live demo — no install needed:

👉 **[ashfaaqrifath.github.io/Warblock-Top-Down-Shooter/](https://ashfaaqrifath.github.io/Warblock-Top-Down-Shooter/)**

1. Create an account or log in
2. Survive enemy waves
3. Earn credits and buy upgrades between levels
4. Solve puzzles for bonus credits
5. Climb the leaderboard!

---

## 🛠️ Run Locally

1. Clone the repo:
   ```bash
   git clone https://github.com/ashfaaqrifath/Warblock-Top-Down-Shooter.git
   cd Warblock-Top-Down-Shooter
   ```

2. Serve locally (required for ES modules):
   ```bash
   # Python
   python -m http.server 8000

   # Or use VS Code Live Server extension
   ```

3. Open `http://localhost:8000` in your browser

> ⚠️ Must be served over HTTP — opening `index.html` directly as a file won't work due to ES module restrictions.

---

## 🗄️ Backend — Supabase

The game uses **Supabase** for:
- User authentication (email/password)
- Storing highscores per user
- Global leaderboard data

To self-host, set up a Supabase project and update the Supabase URL and anon key in `js/Auth.js` (and any other files referencing the Supabase client).

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Game Engine | HTML5 Canvas + Vanilla JavaScript (ES Modules) |
| UI | HTML, CSS |
| Auth & Database | Supabase |
| Hosting | GitHub Pages |

---

## 📄 License

MIT — © Ashfaaq Rifath
