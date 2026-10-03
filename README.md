# hjkl

hjkl is a browser app for learning vim through short drills. Each drill gives you a tiny buffer, a goal, and a keystroke par to beat, and you solve it in a real vim editor.

I'm building it for my husband. He uses VS Code every day, and he's tried to learn vim a few times, but it always ends the same way: too many commands to remember, and everything feels slow and awkward compared to what his hands already know. So instead of one long tutorial, hjkl teaches two or three commands at a time, shows the VS Code habit each one replaces, and lets you practice until it sticks.

## What's in it right now

- 10 lessons and 74 hand-written drills, covering movement, insert mode, word and line jumps, delete, change, copy and paste, dot-repeat, `f`/`t` finds, search, and visual mode
- A real vim editor in the browser (CodeMirror 6 with `@replit/codemirror-vim`)
- Two kinds of drills: move the cursor to a highlighted character, or edit the buffer until it matches the goal
- A live keystroke counter with every key you press, graded against par
- The reference solution after each drill, so you can see the shorter path
- A cheat sheet for the current lesson with the closest VS Code shortcut for each command
- A Review list at the top of the sidebar with every drill you've solved but not at par yet, worst first. Hit par and it drops off.
- Progress saved in your browser, so you pick up where you left off

Every drill's reference solution is run through the real vim engine in the test suite, so par is always something you can actually hit.

## The AI coach

The coach is optional and off by default. Turn it on from the sidebar and it downloads a Gemma model once, then runs it on your GPU right in the browser through WebGPU. The model files come from Hugging Face, but your keystrokes and the coach's prompts never leave your browser.

- **Gemma 4 E2B** is the default. It's about 3.1 GB, or 3.6 GB if your browser doesn't support fp16 shaders.
- **Gemma 3 1B** is the lighter option at under 1 GB. It's faster (about 10 tokens a second vs 6 to 7 on my machine), but its explanations are a lot shakier. It sometimes describes commands wrong.

Pick one before you hit **Enable**. If the coach is already on, choose the other model and hit **Switch**.

Once it's loaded:

- If you solve a drill over par, it explains what the shorter answer does differently.
- The **Hint** button gives you a nudge toward the right command without spelling out the full answer.

After the first download, the model comes from the browser cache, so turning it back on is a lot quicker. On my machine (an NVIDIA Ada Lovelace GPU, using the `q4` weights), Gemma 4 E2B writes about 6 to 7 tokens a second, so a reply takes a few seconds.

The coach needs a browser with WebGPU, like a recent Chrome or Edge. On Linux, you may need to launch Chrome with WebGPU enabled.

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

## License

Apache 2.0. See [LICENSE](LICENSE).

Made with 💖 by [Pink Pixel](https://pinkpixel.dev)
