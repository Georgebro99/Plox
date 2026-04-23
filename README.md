# Ploxmon Frontier

A static browser game focused on account-based progression with Ploxmon.

## Run locally

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Features

- Account create/sign-in flow (saved in browser localStorage).
- Start with 1 starter + 20 Regular Ploxballs.
- Main sections: Trainer Hub, Crafting, Wild, Settings, Battle.
- Turn-based move combat in Wild encounters with a 4-button battle menu (Attack, Switch, Item, Leave) and 4 moves per Ploxmon.
- Capture loop: weaken wild Ploxmon in battle, then throw regular/great Ploxballs.
- Trainer Hub supports healing and assigning worker Ploxmon that generate crafting items.
- Crafting converts materials into balls and recovery items.
- Battle tab now uses manual, user-controlled turns (not auto-sim) against ghost opponents while real online PvP remains backend-dependent.

- Leveling system: Ploxmon gain XP from fights, stats improve on level-up, and new abilities unlock at milestone levels.

- Move usage limits (PP): each move has limited uses until that Ploxmon is healed, which restores all move uses.

- Trainer level rewards: level-ups grant item bundles and unlock higher worker capacity milestones (Lv 5, 8, 12).
