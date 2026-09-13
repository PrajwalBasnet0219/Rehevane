# REHEVANE — Forest of Foreign Skies

> *Thou art my fortress. Thou art where I am safe.*

A story-first open-world action RPG in the browser — no build step, no dependencies. Fall from Tokyo into a world that obeys grief too literally, earn your name in the Guardian's Oath, and teach it to love without breaking.

![Rehevane](Rehevane.png)

## Play it

Just open `index.html` in any modern browser (Chrome / Edge / Firefox).
For the smoothest run (saves + audio), serve the folder:

```bash
cd Rehevane
python3 -m http.server 8000
# → http://localhost:8000
```

Click **New Game** (or **Continue** with a save), tap once to begin — browsers require one tap before any audio plays.

## What it is

- **13 hand-built realms** across three acts: Greenwood Outpost → Whispering Forest → Corrupted Hollow → Hidden Grotto → Silverwall Gate → Ashen Approach → Spire Capital → Sky-Node → Verdant Plains → Mistveil Marsh → Silverwall City → Holy Starlia → Altar Depths.
- **Six heroines + two hidden souls**: Rosalind the tsundere captain, Belladonna the devoted knight, Ruby the himedere princess, Nyx the teasing wolf-girl, Minerva the quiet witch, Daisy the sunshine saint — plus Lyra, the bound-heart in your chest, and Aegis, her teal warden-light.
- **No ending picker.** Harem, devotion, pairs, solos, solitude — the game watches your bonds and jealousies and decides. The King's Decree shows your fate *live* as you play.
- **Full Japanese voice dub** (350+ lines, English text): every heroine voiced to personality, Lyra commenting on nearly everything you touch.
- **Lyra within**: soul-voice counsel, Raphael-style battle census, idle manifestations, and an emergency takeover when death takes you at low HP.
- **Session Chronicle** (`L`): everything said and quested, kept for the session only.
- **Quest compass**: screen edges glow red (main) / yellow (side); hidden quests stay dark.
- **Saves**: manual Slots 1–2 with real timestamps + a silent auto-scroll that never touches them.

## Controls

| Key | Action |
|---|---|
| WASD / Arrows | Move (Shift = sprint) |
| E / Enter / Space | Talk · advance · loot (automatic) |
| Space | Attack · Q skill · T Aegis counsel · F Soulbloom |
| 1–4 | Quick-use items |
| I / C / J / R / M | Inventory · Character · Journal · Relationships · World map |
| L | Session chronicle |
| Esc | System menu (save / load / settings) |

## Story (spoiler-light)

Acts I–III take you from a cracked sky over Tokyo to the pit beneath Starlia, where love itself is the final boss mechanic. Full bible: [`story.txt`](story.txt). Ending guide: `guide.pdf`.

<details>
<summary>Spoiler zone — mechanics that matter</summary>

- The falls west of the forest part only at **full-moon midnight** (Day 3, then every 8th, 00:00–01:00).
- Slay not the Hollow's Stag before waking what sleeps behind the water.
- Vows need bond 20+ with trust, respect and loyalty 5+ each.
- At 3+ jealousy (Belladonna 2+) heroines compete for you. Dates soothe.
- Death respawns you at the outpost at half gold — unless Lyra takes the reins (10-day recovery).

</details>

## Project layout

```
index.html          title, HUD, dialogue, panels
css/style.css       all styling
js/data.js          world data: classes, items, heroines, quests, dialogue trees
js/engine.js        maps, input, sprites, render helpers
js/game.js          player, combat, romance, fate, UI, main loop
js/audio.js         BGM / SFX / voice channels + settings
assets/bgm/         music (MP3/WAV, loopable)
assets/voice/       350+ voiced lines, per girl (+ Rehevane.mp3 title sting)
assets/img/portraits/  original SVG portraits
story.txt           full story bible (canon)
guide.pdf           ending guide
```

## Make your own voices

Lines are pre-generated files, so the game needs no API keys:

- `assets/voice/<girl>/<set>_NN.mp3` for barks/talks/gifts (`girlVoice()` in `game.js`)
- `assets/voice/<girl>/dlg_<tree>_<node>.mp3` auto-played per dialogue node
- Missing file = silent skip, always safe

Bring your own TTS (Fish Audio works great with emotion tags), drop files in with matching names, done.

## Settings

Title → Settings: master sound, music volume, voices on/off, text speed — all persisted. Spoiler-free by design.

---
*v1.0 — the threads remember.*
