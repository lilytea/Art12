let shapes = [];
let leftWeight = 0;
let rightWeight = 0;
let draggingShape = null;

// Middle section and inner rectangle dimensions
let middleSectionWidth;
let middleSectionHeight;
let sideSectionWidth;
let innerRectWidth;
let innerRectHeight;

let images = [];
let scaleFactor = 0.09;

function preload() {
  for (let i = 1; i <= 20; i++) {
    images[i] = loadImage('https://raw.githubusercontent.com/lilytea/Art12/main/img' + i + '.png', img => {
      img.resize(img.width * scaleFactor, img.height * scaleFactor);
    });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  updateSectionDimensions(); // Calculate dimensions based on window size

  let positions = [];
  for (let i = 1; i <= 20; i++) {
    let x, y;
    let overlapping;
    let attempts = 0;

    do {
      overlapping = false;
      x = random(0, sideSectionWidth - images[i].width);
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

function draw() {
  background(240);

  // Draw the middle section with updated dimensions
  fill(200, 200, 255, 150);
  stroke(0);
  let middleSectionX = (width - middleSectionWidth) / 2;
  let middleSectionY = (height - middleSectionHeight) / 2;
  rect(middleSectionX, middleSectionY, middleSectionWidth, middleSectionHeight);

  // Draw the inner rectangle inside the middle section
  fill(150, 150, 200, 100);
  let innerRectX = middleSectionX + (middleSectionWidth - innerRectWidth) / 2;
  let innerRectY = middleSectionY + (middleSectionHeight - innerRectHeight) / 2;
  rect(innerRectX, innerRectY, innerRectWidth, innerRectHeight);

  // Draw all shapes
  for (let shape of shapes) {
    shape.show();
    shape.update();
  }

  // Draw the seesaw scale in the rightmost section
  drawSeesaw();
}

// Calculate dimensions for the middle section and the inner rectangle
function updateSectionDimensions() {
  // Calculate middle section dimensions based on the 11:13 aspect ratio
  if (windowWidth / windowHeight > 11 / 13) {
    middleSectionHeight = windowHeight * 0.7;  // 70% of window height
    middleSectionWidth = middleSectionHeight * (11 / 13);
  } else {
    middleSectionWidth = windowWidth * 0.7;    // 70% of window width
    middleSectionHeight = middleSectionWidth * (13 / 11);
  }

  sideSectionWidth = middleSectionWidth / 2;

  // Inner rectangle dimensions as a proportion of the middle section
  innerRectWidth = middleSectionWidth * 0.9;
  innerRectHeight = middleSectionHeight * 0.9;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateSectionDimensions(); // Recalculate dimensions when the window is resized
}

function mousePressed() {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].isMouseOver()) {
      draggingShape = shapes[i];
      console.log(`Clicked shape at (${shapes[i].x.toFixed(1)}, ${shapes[i].y.toFixed(1)}) - Weight: ${shapes[i].weight.toFixed(2)}`);
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

function drawSeesaw() {
  let scaleX = sideSectionWidth + middleSectionWidth + (sideSectionWidth - 100) / 2;
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
