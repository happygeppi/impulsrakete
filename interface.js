const cv = document.getElementById("canvas");
let drawInterval;
let keysDown = [];
let keysPressed = [];

function BackgroundStart() {
  Start();
  BackgroundDraw();
}

function BackgroundDraw() {
  Draw();
  keysPressed = [];
  drawInterval = requestAnimationFrame(BackgroundDraw);
}

const $ = (id) => document.getElementById(id);
const $$ = (q) => document.querySelector(q);
const $$$ = (q) => document.querySelectorAll(q);

const Random = (a, b) => Math.random() * (b - a) + a;
const Dist = (a, b) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
const AngleBetween = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const KeyDown = (key) => keysDown.includes(key);
const KeyPressed = (key) => keysPressed.includes(key);

Array.prototype.random = function() {
  return this[Math.floor(Math.random() * this.length)];
}

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static polar = (r, a) => new Vector(Math.cos(a) * r, Math.sin(a) * r);

  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
  }
  set(x, y) {
    this.x = x;
    this.y = y;
  }

  copy = () => new Vector(this.x, this.y);
}

document.addEventListener("keydown", (e) => {
  if (!keysDown.includes(e.key)) keysDown.push(e.key);
});
document.addEventListener("keyup", (e) => {
  keysDown.splice(keysDown.indexOf(e.key));
  keysPressed.push(e.key);
});

BackgroundStart();
