# Plox Monster Battle

A lightweight Pokémon-style browser game focused only on turn-based battles.

## Run locally

Because this is a static site, you can run it with any simple web server.

```bash
python -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

## Gameplay

- You and the CPU each get one random monster.
- Pick moves to attack or buff your attack stat.
- Type effectiveness (fire/water/grass) changes damage output.
- Win by reducing the enemy's HP to 0 before yours hits 0.
