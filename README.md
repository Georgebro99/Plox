# Plox Monster Battle

A lightweight 2D Pokémon-style browser game focused on **encountering, battling, and capturing** monsters (no world exploration).

## Run locally

Because this is a static site, run any simple web server:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Flow

1. Choose a starter from the start menu.
2. From the hub, click **Search for Wild Battle** to encounter a random wild monster.
3. Battle with turn-based moves (with timing, delays, and hit animations).
4. Try to capture using **Throw Capture Orb** (easier when enemy HP is low).
5. Return to hub and keep collecting monsters.
