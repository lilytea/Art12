let shapes = [];
let leftWeight = 0;
let rightWeight = 0;
let draggingShape = null;

// Dimensions for sections and inner rectangle
let sectionWidth;
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
    console.log(`Initialized shape with weight: ${shape.weight}`);
  }
}

function calculateWeights() {
  leftWeight = 0;
  rightWeight = 0;

  for (let shape of shapes) {
    // Calculate the middle section bounds
    let leftBound = sectionWidth;
    let rightBound = 2 * sectionWidth;
    
    // Determine if shape is in the left, middle, or right section
    let shapeCenterX = shape.x + shape.img.width / 2;

    // If the shape is primarily in the left section
    if (shapeCenterX < leftBound) {
      leftWeight += shape.weight;
    }
    // If the shape is primarily in the right section
    else if (shapeCenterX > rightBound) {
      rightWeight += shape.weight;
    }
    // If the shape is in the middle section, divide its weight
    else {
      // Calculate overlap percentage with each side
      let overlapLeft = Math.max(0, leftBound - shape.x);
      let overlapRight = Math.max(0, shape.x + shape.img.width - rightBound);
      let overlapMiddle = shape.img.width - overlapLeft - overlapRight;

      // Weight based on overlap
      leftWeight += (shape.weight * (overlapLeft / shape.img.width));
      rightWeight += (shape.weight * (overlapRight / shape.img.width));
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

function updateSectionDimensions() {
  sectionWidth = width / 3;
  innerRectWidth = sectionWidth * 0.8;
  innerRectHeight = innerRectWidth * (11 / 13);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateSectionDimensions();
}

function mousePressed() {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].isMouseOver()) {
      draggingShape = shapes[i];
      console.log(`Started dragging shape at (${shapes[i].x.toFixed(1)}, ${shapes[i].y.toFixed(1)})`);
      shapes.push(shapes.splice(i, 1)[0]);
      break;
    }
  }
}

function mouseReleased() {
  if (draggingShape) {
    console.log(`Stopped dragging shape at (${draggingShape.x.toFixed(1)}, ${draggingShape.y.toFixed(1)})`);
    calculateWeights();
    draggingShape = null;
  }
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
  console.log("Seesaw Tilt:", seesawTilt);

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
