let rocket, portal;
let darkPortals = [];
let nDP = 20;

let theme;
let themes = ["natural-space", "black-n-white", "bloody-hell", "purple"];

let nextLevelAnimTime = 1.2;
let nextLevelHappening = false;

function Start() {
  Init();
}

function Init() {
  CreateRocket();
  CreatePoral();
  CreateDarkPortals(nDP);
  ChangeTheme();
}

function CreateRocket() {
  if ($("rocket") != null) $("rocket").remove();
  if ($("ejectVelScaleContainer") != null) $("ejectVelScaleContainer").remove();
  if ($$$(".weight").length != 0) for (const weight of $$$(".weight")) weight.remove();

  const w = 30;
  const n = 100;
  const mShip = 100;
  const mWeight = 50;

  const margin = 3 * w;
  const middle = new Vector(innerWidth / 2, innerHeight / 2);
  const fromMiddle = innerHeight / 3;
  let x, y;
  do {
    x = Random(margin, innerWidth - margin);
    y = Random(margin, innerHeight - margin);
  } while (Dist(new Vector(x, y), middle) < fromMiddle);

  rocket = new Rocket(x, y, w, n, mShip, mWeight);

  document.documentElement.style.setProperty("--rocket-x", `${x}px`);
  document.documentElement.style.setProperty("--rocket-y", `${y}px`);
}

function CreatePoral() {
  if ($("portal") != null) setTimeout(() => $("portal").remove(), 1000 * nextLevelAnimTime);

  const r = 32;

  const margin = 3 * r;
  const fromRocket = innerWidth / 2;
  let x, y;
  do {
    x = Random(margin, innerWidth - margin);
    y = Random(margin, innerHeight - margin);
  } while (Dist(new Vector(x, y), rocket.pos) < fromRocket);

  portal = new Portal(x, y, r);
}

function CreateDarkPortals(n) {
  const dps = $$$(".dark-portal");
  for (const dp of dps) dp.remove();
  darkPortals = [];

  for (let i = 0; i < n; i++) {
    const r = Random(16, 64);
    let x, y;
    let i = 0;
    do {
      x = Random(2 * r, innerWidth - 2 * r);
      y = Random(2 * r, innerHeight - 2 * r);
      i++;
      if (i > 1000) return;
    } while (TooClose(new Vector(x, y), r));
    darkPortals.push(new DarkPortal(x, y, r));
  }
}

function TooClose(pos, r) {
  if (Dist(pos, portal.pos) - r < 200) return true;
  if (Dist(pos, rocket.pos) - r < 100) return true;
  for (const dp of darkPortals) if (Dist(pos, dp.pos) - r - dp.r < rocket.h) return true;
  return false;
}

function ChangeTheme() {
  if (theme == undefined) return (theme = new Theme(themes.random()));

  let newTheme;
  do {
    newTheme = themes.random();
  } while (newTheme == theme.theme);

  theme = new Theme(newTheme);
}

function Draw() {
  rocket.update();
}

function NextLevel() {
  nextLevelHappening = true;

  // 0s: portal starts expanding
  // 1s: portal fully expanded, rocket resets, theme changes, new portal
  // 2s: portal disappeared

  portal.old = portal.html;
  portal.old.classList.add("portal-next-level");

  setTimeout(() => {
    CreateRocket();
    CreatePoral();
    CreateDarkPortals(nDP);
    ChangeTheme();
    setTimeout(() => (nextLevelHappening = false), 1000 * nextLevelAnimTime);
  }, 1000 * nextLevelAnimTime);
}

class Rocket {
  constructor(x, y, w, n, mShip, mWeight) {
    this.pos = new Vector(x, y);
    this.vel = new Vector(0, 0);
    this.acc = new Vector(0, 0);

    this.a = -Math.PI / 2;
    this.aVel = 0;
    this.aAcc = 0.008;
    this.aVelMax = 0.25;
    this.aVelDamp = 0.93;

    this.w = w;
    this.h = this.w * 1.3;

    this.n = n;
    this.m = mShip;
    this.mWeight = mWeight;
    if (this.weights !== undefined)
      for (const weight of this.weights) weight.html.remove();
    this.weights = [];

    if (this.ejectVelScale == undefined)
      this.ejectVelScale = new EjectVelScale();
    this.ejectVelScale.reset();

    if (this.html == undefined) this.initHTML();
    this.updateHTML();
  }

  initHTML() {
    this.html = document.createElement("div");
    this.html.id = "rocket";
    cv.append(this.html);

    this.html.style.left = `${this.pos.x}px`;
    this.html.style.top = `${this.pos.y}px`;
    this.html.style.borderTopWidth = `${this.w / 2}px`;
    this.html.style.borderBottomWidth = `${this.w / 2}px`;
    this.html.style.borderLeftWidth = `${this.h}px`;
    this.html.style.rotate = `${this.a}rad`;
  }

  updateHTML() {
    this.html.style.rotate = `${this.a}rad`;
    this.html.style.left = `${this.pos.x - this.h / 3}px`;
    this.html.style.top = `${this.pos.y - this.w / 2}px`;
  }

  update() {
    for (const w of this.weights) w.update();
    if (nextLevelHappening) return;
    this.move();
    this.updateHTML();
    this.checkNextLevel();
  }

  move() {
    this.rotate();
    this.checkEjection();
    this.checkPortal();

    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }

  rotate() {
    if (KeyDown("ArrowLeft") || KeyDown("a")) this.aVel -= this.aAcc;
    if (KeyDown("ArrowRight") || KeyDown("d")) this.aVel += this.aAcc;
    if (this.aVel > this.aVelMax) this.aVel = this.aVelMax;
    if (this.aVel < -this.aVelMax) this.aVel = -this.aVelMax;

    this.aVel *= this.aVelDamp;
    this.a += this.aVel;
  }

  checkEjection() {
    if (KeyDown("w")) this.ejectVelScale.higher();
    if (KeyDown("s")) this.ejectVelScale.lower();
    if (KeyPressed(" ") && this.weights.length < this.n)
      this.eject(this.ejectVelScale.value);
  }

  checkPortal() {
    const d = Dist(this.pos, portal.pos);
    if (d < portal.attractionRadius + portal.r) {
      this.acc.add(Vector.polar(portal.force / (d * d), AngleBetween(this.pos, portal.pos)));
      this.vel.add(this.acc);
    }
  }

  eject(v) {
    const weight = new Weight(this.pos.copy(), this.vel.copy());
    this.weights.push(weight);

    let v1, v2, m1, m2;

    m1 = this.m;
    m2 = this.mWeight;

    v1 = Vector.polar((v * m2) / m1, this.a);
    v2 = Vector.polar(v, this.a + Math.PI);

    this.vel.add(v1);
    weight.vel.add(v2);
  }

  checkNextLevel() {
    if (nextLevelHappening) return;

    if (Dist(this.pos, portal.pos) < portal.r) NextLevel();

    if (
      this.pos.x + this.h < 0 ||
      this.pos.x - this.h > innerWidth ||
      this.pos.y + this.h < 0 ||
      this.pos.y - this.h > innerHeight
    )
      NextLevel();

    for (const dp of darkPortals) if (Dist(dp.pos, this.pos) < dp.r) NextLevel();
  }
}

class EjectVelScale {
  constructor() {
    this.default = 5;
    this.min = 1;
    this.max = 20;
    this.value = this.default;

    this.vel = 0.5; // how fast it changes the value when key is down

    this.margin = 12;
    this.w = 16;
    this.h = 144;
    this.bw = 4;
    this.padding = 4;

    this.initHTML();
  }

  reset() {
    this.value = this.default;
    this.html[1].style.height = `${this.height()}px`;
  }

  initHTML() {
    this.html = [];
    this.html[0] = document.createElement("div");
    this.html[0].id = "ejectVelScaleContainer";
    cv.append(this.html[0]);
    this.html[1] = document.createElement("div");
    this.html[1].id = "ejectVelScale";
    this.html[0].append(this.html[1]);

    this.html[0].style.left = `${this.margin}px`;
    this.html[0].style.bottom = `${this.margin}px`;
    this.html[0].style.width = `${this.w}px`;
    this.html[0].style.height = `${this.h}px`;
    this.html[0].style.border = `${this.bw}px solid #fff`;
    this.html[0].style.padding = `${this.padding}px`;

    this.html[1].style.left = `${this.padding}px`;
    this.html[1].style.bottom = `${this.padding}px`;
    this.html[1].style.width = `${this.w}px`;
    this.html[1].style.height = `${this.height()}px`;
  }

  height() {
    return (this.h * (this.value - this.min + 1)) / (this.max - this.min + 1);
  }

  higher() {
    this.value += this.vel;
    if (this.value > this.max) this.value = this.max;
    this.html[1].style.height = `${this.height()}px`;
  }
  lower() {
    this.value -= this.vel;
    if (this.value < this.min) this.value = this.min;
    this.html[1].style.height = `${this.height()}px`;
  }
}

class Weight {
  constructor(pos, vel) {
    this.pos = pos;
    this.vel = vel;
    this.r = 8;

    this.initHTML();
  }

  initHTML() {
    this.html = document.createElement("div");
    this.html.classList.add("weight");
    cv.append(this.html);

    this.html.style.left = `${this.pos.x}px`;
    this.html.style.top = `${this.pos.y}px`;
    this.html.style.width = `${2 * this.r}px`;
    this.html.style.height = `${2 * this.r}px`;
  }

  update() {
    this.pos.add(this.vel);
    this.html.style.left = `${this.pos.x}px`;
    this.html.style.top = `${this.pos.y}px`;

    if (
      this.pos.x + this.r < 0 ||
      this.pos.x - this.r > innerWidth ||
      this.pos.y + this.r < 0 ||
      this.pos.y - this.r > innerHeight
    )
      this.html.remove();
  }
}

class Portal {
  constructor(x, y, r) {
    this.pos = new Vector(x, y);
    this.r = r;
    this.minDist = 200;
    this.attractionRadius = 200;
    this.force = 2000;
    this.initHTML();
  }

  initHTML() {
    if (this.old !== undefined)
      setTimeout(() => this.old.remove(), 1000 * nextLevelAnimTime);

    this.html = document.createElement("div");
    this.html.id = "portal";
    cv.append(this.html);

    this.html.style.left = `${this.pos.x - this.r}px`;
    this.html.style.top = `${this.pos.y - this.r}px`;
    this.html.style.width = `${2 * this.r}px`;
    this.html.style.height = `${2 * this.r}px`;

    document.documentElement.style.setProperty("--portal-w", `${this.r}px`);
    document.documentElement.style.setProperty(
      "--portal-scale-factor",
      Math.sqrt((innerWidth * innerWidth + innerHeight * innerHeight) / 4) /
        this.r
    );
    document.documentElement.style.setProperty(
      "--anim-t",
      `${nextLevelAnimTime}s`
    );
  }
}

class DarkPortal {
  constructor(x, y, r) {
    this.pos = new Vector(x, y);
    this.r = r;
    this.initHTML();
  }

  initHTML() {
    this.html = document.createElement("div");
    this.html.classList.add("dark-portal");
    cv.append(this.html);

    this.html.style.left = `${this.pos.x}px`;
    this.html.style.top = `${this.pos.y}px`;
    this.html.style.width = `${2 * this.r}px`;
    this.html.style.height = `${2 * this.r}px`;
  }
}

/*

To do:
// - dark portals deflect rocket
// - design for portals
- portal gets smaller => time limit
- game over or sth instead of next level
- limited weights
- score, menu, ...

*/
