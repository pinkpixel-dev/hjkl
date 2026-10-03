# hjkl

hjkl is a browser app for learning vim through short drills. Each drill gives you a tiny buffer, a goal, and a keystroke par to beat, and you solve it in a real vim editor.

I'm building it for my husband. He uses VS Code every day, and he's tried to learn vim a few times, but it always ends the same way: too many commands to remember, and everything feels slow and awkward compared to what his hands already know. So instead of one long tutorial, hjkl teaches two or three commands at a time, shows the VS Code habit each one replaces, and lets you practice until it sticks.

## What's in it right now

- 8 lessons and 41 hand-written drills, covering movement, insert mode, word and line jumps, delete, change, copy and paste, dot-repeat, and `f`/`t` finds
- A real vim editor in the browser (CodeMirror 6 with `@replit/codemirror-vim`)
- Two kinds of drills: move the cursor to a highlighted character, or edit the buffer until it matches the goal
- A live keystroke counter with every key you press, graded against par
- The reference solution after each drill, so you can see the shorter path
- A cheat sheet for the current lesson with the closest VS Code shortcut for each command
- Progress saved in your browser, so you pick up where you left off

Every drill's reference solution is run through the real vim engine in the test suite, so par is always something you can actually hit.

An optional AI coach that runs Gemma locally in your browser is next on the list. See [DOCS/ROADMAP.md](DOCS/ROADMAP.md).

## Running it

You need Node.js (I'm using v22) and a desktop browser. A physical keyboard is pretty much required, since vim on a phone keyboard is not fun.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Other scripts:

```bash
npm test          # runs every drill solution through real vim
npm run build     # typecheck and production build into dist/
npm run preview   # serve the production build
```

## How to use it

Click into the buffer and use vim keys. The goal pane on the right shows what you're aiming for: a highlighted character for movement drills, or the changed lines for edit drills.

Edit drills only count as solved once you're back in normal mode, so finish with `<Esc>` like you would in real vim. When you solve one, press Enter to move to the next drill. **Reset** starts the drill over, and **Answer** shows the reference keys if you're stuck.

## Known quirks

- `dd` on the last line followed by `P` leaves an extra blank line. That's a bug in the vim plugin, not in your keystrokes. Real vim doesn't do this. None of the drills depend on it.
- Search (`/`) works in the editor, but no drills use it yet.

## License

Apache 2.0. See [LICENSE](LICENSE).

Made with 💖 by [Pink Pixel](https://pinkpixel.dev)
