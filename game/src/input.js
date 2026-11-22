// Shadow Vault — keyboard and mouse.
// One job: turn keys and clicks into "where the player wants to go" and
// whether they are sneaking. Nothing here knows about the game rules.

export function createInput(canvas) {
  const keys = new Set();
  let clickTarget = null;
  let interactPressed = false;

  function keyOf(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }

  window.addEventListener('keydown', (e) => {
    const k = keyOf(e);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    keys.add(k);
    if (k === ' ' || k === 'Enter') interactPressed = true;
  });
  window.addEventListener('keyup', (e) => keys.delete(keyOf(e)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    clickTarget = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  });

  return {
    /** Normalised movement vector from WASD / arrow keys, or null. */
    keyVector() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('d') || keys.has('ArrowRight')) x += 1;
      if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('s') || keys.has('ArrowDown')) y += 1;
      if (x === 0 && y === 0) return null;
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    sneaking() {
      return keys.has('Shift');
    },
    /** The last click-to-move target, cleared once read. */
    takeClickTarget() {
      const t = clickTarget;
      clickTarget = null;
      return t;
    },
    /** True once when Space / Enter was pressed since the last read. */
    takeInteract() {
      const v = interactPressed;
      interactPressed = false;
      return v;
    },
    anyKey() {
      return keys.size > 0;
    },
    /** For tests: press and release a key programmatically. */
    testPress(key) {
      keys.add(key.toLowerCase());
    },
    testRelease(key) {
      keys.delete(key.toLowerCase());
    },
  };
}
