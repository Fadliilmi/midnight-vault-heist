// input.js — keyboard and mouse, the only two ways to play.
// WASD or arrows move, Shift sneaks, 1/2/3 spend a tool (1 aims with the
// mouse), P pauses, R restarts, M mutes. Clicking also starts the game
// from the title screen, so a mouse-only player can get in.

export function createInput(canvas) {
  const keys = {};
  const mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
  const pressed = new Set(); // keys pressed since last consume

  function keyOf(e) { return e.key.toLowerCase(); }

  window.addEventListener('keydown', (e) => {
    const k = keyOf(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (!keys[k]) pressed.add(k);
    keys[k] = true;
  });
  window.addEventListener('keyup', (e) => { keys[keyOf(e)] = false; });

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }
  canvas.addEventListener('mousemove', (e) => {
    const p = canvasPos(e);
    mouse.x = p.x; mouse.y = p.y;
  });
  canvas.addEventListener('click', (e) => {
    const p = canvasPos(e);
    mouse.x = p.x; mouse.y = p.y;
    mouse.clicked = true;
    mouse.clickX = p.x; mouse.clickY = p.y;
  });

  return {
    keys,
    mouse,
    // True once per physical press; the game loop consumes it.
    wasPressed(k) { return pressed.has(k); },
    consume(k) { pressed.delete(k); },
    consumeClick() {
      const c = mouse.clicked;
      mouse.clicked = false;
      return c;
    },
  };
}
