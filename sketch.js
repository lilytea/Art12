let shapes = [];
let leftWeight = 0;
let rightWeight = 0;
let draggingShape = null;

let sectionWidth;
let innerRectWidth;
let innerRectHeight;

let images = [];
let scaleFactor = 0.09;

class DraggableShape {
  constructor(x, y, img) {
    this.x = x;
    this.y = y;
    this.img = img;
    this.area = 0;
    this.density = 'solid';
    this.weight = 0;
  }

  analyzeShape() {
    let opaquePixels = 0;
    let totalPixels = this.img.width * this.img.height;
    let totalBrightness = 0;

    this.img.loadPixels();
    for (let i = 0; i < this.img.pixels.length; i += 4) {
      let r = this.img.pixels[i];
      let g = this.img.pixels[i + 1];
      let b = this.img.pixels[i + 2];
      let alpha = this.img.pixels[i + 3];

      let brightness = (r + g + b) / 3;
      totalBrightness += brightness;

      if (alpha > 128) opaquePixels++;
    }

    this.area = opaquePixels;
    let averageBrightness = totalBrightness / totalPixels;
    let darknessFactor = 1 + (255 - averageBrightness) / 255;

    this.density = opaquePixels / totalPixels > 0.7 ? 'solid' : 'hollow';
    let densityMultiplier = this.density === 'solid' ? 1.5 : 1.0;

    this.weight = this.area * densityMultiplier * darknessFactor;
  }

  show() {
    image(this.img, this.x, this.y);
  }

  update() {
    if (draggingShape === this) {
      this.x = mouseX - this.img.width / 2;
      this.y = mouseY - this.img.height / 2;
    }
  }

  isMouseOver() {
    return mouseX > this.x && mouseX < this.x + this.img.width &&
           mouseY > this.y && mouseY < this.y + this.img.height;
  }

  onCanvas() {
    return this.x + this.img.width > 0 && this.x < width &&
           this.y + this.img.height > 0 && this.y < height;
  }
}

function preload() {
  for (let i = 1; i <= 20; i++) {
    images[i] = loadImage('https://raw.githubusercontent.com/lilytea/Art12/main/img' + i + '.png', img => {
      img.resize(img.width * scaleFactor, img.height * scaleFactor);
    });
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
      x = random(0, sectionWidth - images[i].width);
      y = random(0, height - images[i].height);

      for (let pos of positions) {
        let w = images[i].width;
        let h = images[i].height;
        if (dist(x + w / 2, y + h / 2, pos.x + pos.width / 2, pos.y + pos.height / 2) < w * 0.8) {
          overlapping = true;
          break;
        }
      }
      attempts++;
    } while (overlapping && attempts < 100);

    positions.push({ x: x, y: y, width: images[i].width, height: images[i].height });

    let shape = new DraggableShape(x, y, images[i]);
    shape.analyzeShape();
    shapes.push(shape);
  }
}

function calculateWeights() {
  leftWeight = 0;
  rightWeight = 0;

  // Define boundaries of the inner rectangle
  let innerRectX = sectionWidth + (sectionWidth - innerRectWidth) / 2;
  let innerRectY = (height - innerRectHeight) / 2;
  let sectionWidthInner = innerRectWidth / 6;

  for (let shape of shapes) {
    let shapeCenterX = shape.x + shape.img.width / 2;
    let shapeCenterY = shape.y + shape.img.height / 2;

    // Only consider shapes that are inside the inner rectangle
    if (shapeCenterX > innerRectX && shapeCenterX < innerRectX + innerRectWidth &&
        shapeCenterY > innerRectY && shapeCenterY < innerRectY + innerRectHeight) {
      
      let relativeX = shapeCenterX - innerRectX;
      let sectionIndex = Math.floor(relativeX / sectionWidthInner) + 1;

      // Weight multipliers for sections (1 and 6 are heaviest, 3 and 4 are lightest)
      let multiplier;
      if (sectionIndex === 1 || sectionIndex === 6) {
        multiplier = 3;
      } else if (sectionIndex === 2 || sectionIndex === 5) {
        multiplier = 2;
      } else {
        multiplier = 1;
      }

      let weightedContribution = shape.weight * multiplier;

      // Add to left or right weight based on the position of the section within the inner rectangle
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
  sectionWidth = width / 3;

  fill(255, 200, 200);
  rect(0, 0, sectionWidth, height);

  fill(200, 255, 200);
  rect(sectionWidth, 0, sectionWidth, height);

  fill(200, 200, 255);
  rect(2 * sectionWidth, 0, sectionWidth, height);

  fill(150, 150, 200, 100);
  innerRectWidth = sectionWidth * 0.8;
  innerRectHeight = innerRectWidth * (11 / 13);
  let innerRectX = sectionWidth + (sectionWidth - innerRectWidth) / 2;
  let innerRectY = (height - innerRectHeight) / 2;
  rect(innerRectX, innerRectY, innerRectWidth, innerRectHeight);

  for (let shape of shapes) {
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
  sectionWidth = width / 3;
  innerRectWidth = sectionWidth * 0.8;
  innerRectHeight = innerRectWidth * (11 / 13);
}

function drawSeesaw() {
  let scaleX = 2 * sectionWidth + (sectionWidth - 100) / 2;
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
