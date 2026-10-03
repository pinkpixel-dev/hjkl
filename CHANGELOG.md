# Changelog

## 0.2.0 - October 3, 2026

### 🤖 AI coach

- Optional coach that runs Gemma 4 E2B (or Gemma 3 1B) locally in the browser on WebGPU, in a Web Worker
- When you solve a drill over par, the coach explains what the shorter answer does differently
- Hint button asks the coach for a nudge without giving away the whole answer
- Download progress, model picker, and tokens per second in the sidebar
- The coach turns itself back on next visit and loads from the browser cache

### 🧪 Tests

- Key grouping tests so prompts describe `cw`, `ci"`, `2dd` and typed text the way vim reads them

### 🏷️ Versioning

- Bumped to 0.2.0

## 0.1.0 - October 3, 2026

### 🎉 First version

- Real vim editor in the browser with keystroke tracking and par grading
- 8 lessons and 41 hand-written drills, each with a reference solution
- Cursor drills (land on the highlighted character) and edit drills (match the goal buffer)
- Lesson cheat sheet with VS Code equivalents
- Progress and last position saved in localStorage

### 🧪 Tests

- Every drill's reference solution runs through the real vim engine to prove par is reachable
