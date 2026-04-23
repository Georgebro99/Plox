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
- Turn-based move combat in Wild encounters with a 4-button battle menu (Attack, Switch, Item, Leave).
- Capture loop: weaken wild Ploxmon in battle, then throw regular/great Ploxballs.
- Trainer Hub supports healing and assigning worker Ploxmon that generate crafting items.
- Crafting converts materials into balls and recovery items.
- Battle tab includes a polished ghost-arena match board while real online PvP remains backend-dependent.
