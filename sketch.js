let shapes = [];
let leftWeight = 0;
let rightWeight = 0;
let draggingShape = null;

let leftSectionWidth;
let middleSectionWidth;
let rightSectionWidth;
let innerRectWidth;
let innerRectHeight;

let images = [];
let originalRectHeight = 220;
let originalRectWidth = originalRectHeight * (13 / 11);

function preload() {
  for (let i = 1; i <= 20; i++) {
    images[i] = loadImage('https://raw.githubusercontent.com/lilytea/Art12/main/img' + i + '.png');
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  updateSectionDimensions();

  let positions = [];
  for (let i = 1; i <= 20; i++) {
    let x, y;
    let overlapping;
    let attempts = 0;

    do {
      overlapping = false;
      x = random(0, leftSectionWidth - originalRectWidth);
      y = random(0, height - originalRectHeight);

      for (let pos of positions) {
        if (dist(x, y, pos.x, pos.y) < originalRectWidth * 0.8) {
          overlapping = true;
          break;
        }
      }
      attempts++;
    } while (overlapping && attempts < 100);

    positions.push({ x: x, y: y });

    let shape = new DraggableShape(x, y, images[i]);
    shapes.push(shape);
  }
}

function calculateWeights() {
  leftWeight = 0;
  rightWeight = 0;

  let innerRectX = leftSectionWidth + (middleSectionWidth - innerRectWidth) / 2;
  let sectionWidthInner = innerRectWidth / 6;

  for (let shape of shapes) {
    let shapeCenterX = shape.x + shape.width / 2;

    if (shapeCenterX > innerRectX && shapeCenterX < innerRectX + innerRectWidth) {
      let relativeX = shapeCenterX - innerRectX;
      let sectionIndex = Math.floor(relativeX / sectionWidthInner) + 1;

      let multiplier;
      if (sectionIndex === 1 || sectionIndex === 6) {
        multiplier = 3;
      } else if (sectionIndex === 2 || sectionIndex === 5) {
        multiplier = 2;
      } else {
        multiplier = 1;
      }

      let weightedContribution = shape.weight * multiplier;

      if (relativeX < innerRectWidth / 2) {
        leftWeight += weightedContribution;
      } else {
        rightWeight += weightedContribution;
      }
    }
  }

  console.log("Left Weight:", leftWeight, "Right Weight:", rightWeight);
}

function draw() {
  background(240);
  updateSectionDimensions();

  fill(255, 200, 200);
  rect(0, 0, leftSectionWidth, height);

  fill(200, 255, 200);
  rect(leftSectionWidth, 0, middleSectionWidth, height);

  fill(200, 200, 255);
  rect(leftSectionWidth + middleSectionWidth, 0, rightSectionWidth, height);

  fill(150, 150, 200, 100);
  let innerRectX = leftSectionWidth + (middleSectionWidth - innerRectWidth) / 2;
  let innerRectY = (height - innerRectHeight) / 2;
  rect(innerRectX, innerRectY, innerRectWidth, innerRectHeight);

  // Calculate dynamic scale based on the current inner rectangle height
  let scale = innerRectHeight / originalRectHeight*0.09;

  for (let shape of shapes) {
    shape.updateSize(scale);  // Dynamically resize based on rectangle scale
    shape.show();
    shape.update();
  }

  drawSeesaw();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateSectionDimensions();
}

function mousePressed() {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].isMouseOver()) {
      draggingShape = shapes[i];
      shapes.push(shapes.splice(i, 1)[0]);
      break;
    }
  }
}

function mouseReleased() {
  if (draggingShape) {
    calculateWeights();
    draggingShape = null;
  }
}

function updateSectionDimensions() {
  leftSectionWidth = width / 4;
  middleSectionWidth = width / 2;
  rightSectionWidth = width / 4;
  innerRectWidth = middleSectionWidth * 0.8;
  innerRectHeight = innerRectWidth * (11 / 13);
}

function drawSeesaw() {
  let scaleX = leftSectionWidth + middleSectionWidth + (rightSectionWidth - 100) / 2;
  let scaleY = (height - 100) / 2;
  let scaleWidth = 100;
  let baseHeight = 5;
  let platformHeight = 20;

  fill(120);
  noStroke();
  triangle(
    scaleX + scaleWidth / 2, scaleY + 60,
    scaleX + scaleWidth / 2 - 30, scaleY + 100,
    scaleX + scaleWidth / 2 + 30, scaleY + 100
  );

  fill(80);
  ellipse(scaleX + scaleWidth / 2, scaleY + 60, 12, 12);

  fill(100);
  rect(scaleX, scaleY + 60, scaleWidth, baseHeight);

  let maxWeightDifference = 200;
  let seesawTilt = map(rightWeight - leftWeight, -maxWeightDifference, maxWeightDifference, -30, 30);
  seesawTilt = constrain(seesawTilt / 2, -15, 15);

  push();
  translate(scaleX + scaleWidth / 2, scaleY + 60);
  rotate(radians(seesawTilt));
  fill(150);
  rect(-scaleWidth / 2, -10, scaleWidth, platformHeight);

  fill(180);
  ellipse(-scaleWidth / 2, -platformHeight / 2 - 5, 40, 10);
  ellipse(scaleWidth / 2, -platformHeight / 2 - 5, 40, 10);
  pop();

  fill(0);
  textSize(16);
  textAlign(CENTER);
  text('Left Weight: ' + leftWeight, scaleX + scaleWidth / 2, scaleY + 120);
  text('Right Weight: ' + rightWeight, scaleX + scaleWidth / 2, scaleY + 140);
}

// DraggableShape class with dynamic resizing
class DraggableShape {
  constructor(x, y, img) {
    this.x = x;
    this.y = y;
    this.img = img;
    this.originalWidth = img.width;
    this.originalHeight = img.height;
    this.width = img.width;
    this.height = img.height;
    this.weight = this.originalWidth * this.originalHeight * 0.1; // Sample weight based on area
  }

  updateSize(scale) {
    this.width = this.originalWidth * scale;
    this.height = this.originalHeight * scale;
  }

  show() {
    image(this.img, this.x, this.y, this.width, this.height);
  }

  update() {
    if (draggingShape === this) {
      this.x = mouseX - this.width / 2;
      this.y = mouseY - this.height / 2;
    }
  }

  isMouseOver() {
    return mouseX > this.x && mouseX < this.x + this.width &&
           mouseY > this.y && mouseY < this.y + this.height;
  }

  onCanvas() {
    return this.x + this.width > 0 && this.x < width &&
           this.y + this.height > 0 && this.y < height;
  }
}
