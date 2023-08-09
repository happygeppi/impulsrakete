class Theme {
  constructor(t) {
    this.theme = t;
    this.initHTML();
  }

  initHTML() {
    this.updateCanvasClass();
    this.deleteThings();
    this.createThings();
  }
  
  updateCanvasClass() {
    for (const cls of cv.classList) cv.classList.remove(cls);
    cv.classList.add(this.theme);
  }

  deleteThings() {
    const containers = $$$(".thing-container");
    for (const cont of containers) cont.remove();
    const things = $$$(".thing");
    for (const thing of things) thing.remove();
  }

  createThings() {
    const numThings = [500, 0, 0];

    for (let thingN = 0; thingN <= 2; thingN++) {
      const container = document.createElement("div");
      container.classList.add("thing-container");
      cv.append(container);

      for (let i = 0; i < numThings[thingN]; i++) {
        const thing = document.createElement("div");
        thing.classList.add("thing");
        thing.classList.add(this.theme);
        thing.classList.add(`thing${thingN}`);
        container.append(thing);

        thing.style.left = `${Math.random() * innerWidth}px`;
        thing.style.top = `${Math.random() * innerHeight}px`;
      }
    }
  }
}

/*

3 things for every theme:

theme | thing0 | thing1 | thing2
------|--------|--------|-------
n-s   |stars   |planets |aster.s
b-w   |stars   |shadows |aster.s
b-h   |stars   |plants  |UFOs
purp  |stars   |plants  |nebulas
------|--------|--------|-------
#num  |500     |10      |3

*/
