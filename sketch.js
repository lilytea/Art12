let shapes = [];
let leftWeight = 0;
let rightWeight = 0;
let draggingShape = null;

// Dimensions for sections and inner rectangle
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

  let slotHeight = height / 20; // Divide left section height by 20 for each image slot
  let xMin = leftSectionWidth / 2; // Minimum x to keep images on the right half of the left section
  let xMax = leftSectionWidth - originalRectWidth; // Maximum x within the left section

  for (let i = 1; i <= 20; i++) {
    // Assign each image a specific slot along the right side of the left section
    let x = random(xMin, xMax); // Place within the right half of the left section
    let y = i * slotHeight - originalRectHeight / 2; // Calculate y based on slot position

    // Create the shape within bounds
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
  background(255);
  updateSectionDimensions();

 fill(245, 245, 250); // Very light blue for the left section
  rect(0, 0, leftSectionWidth, height); // Draw left section

  fill(250, 245, 245); // Very light pink for the middle section
  rect(leftSectionWidth, 0, middleSectionWidth, height); // Draw middle section

  fill(245, 250, 245); // Very light green for the right section
  rect(leftSectionWidth + middleSectionWidth, 0, rightSectionWidth, height);
  // Draw the inner rectangle within the middle section with beige color and 11:13 ratio

  fill(245, 245, 220); // Beige color for the inner rectangle
  
  
  let innerRectX = leftSectionWidth + (middleSectionWidth - innerRectWidth) / 2;
  let innerRectY = (height - innerRectHeight) / 2;
  rect(innerRectX, innerRectY, innerRectWidth, innerRectHeight);

  // Adjust scale factor for image resizing
 // Adjust scale factor in draw()
let scale = (innerRectHeight / originalRectHeight * 0.16) / window.devicePixelRatio;

  for (let shape of shapes) {
    shape.updateSize(scale);
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

function updateSectionDimensions() {
  leftSectionWidth = width / 4;
  middleSectionWidth = width / 2;
  rightSectionWidth = width / 4;
  innerRectWidth = middleSectionWidth * 0.8;
  innerRectHeight = innerRectWidth * (11 / 13);
}

function drawSeesaw() {
  // Scale dimensions by 1.5
  let scaleX = leftSectionWidth + middleSectionWidth + (rightSectionWidth - 150) / 2; // Adjust for larger width
  let scaleY = (height - 150) / 2; // Adjust for larger height
  let scaleWidth = 150; // 1.5 times the original width
  let baseHeight = 7.5; // 1.5 times the original base height
  let platformHeight = 30; // 1.5 times the original platform height

  // Draw the triangular base of the seesaw (scaled up)
  fill(120);
  noStroke();
  triangle(
    scaleX + scaleWidth / 2, scaleY + 90,            // Top of the triangle
    scaleX + scaleWidth / 2 - 45, scaleY + 150,      // Bottom left
    scaleX + scaleWidth / 2 + 45, scaleY + 150       // Bottom right
  );

  // Draw the pivot point (circle) at the top of the triangle
  fill(80);
  ellipse(scaleX + scaleWidth / 2, scaleY + 90, 18, 18); // 1.5 times the original pivot point size

  // Draw the base of the seesaw (static part)
  fill(100);
  rect(scaleX, scaleY + 90, scaleWidth, baseHeight); // 1.5 times the original width and base height

  // Calculate and constrain the tilt of the seesaw based on weight difference
  let maxWeightDifference = 200;
  let seesawTilt = map(rightWeight - leftWeight, -maxWeightDifference, maxWeightDifference, -30, 30);
  seesawTilt = constrain(seesawTilt / 2, -15, 15); // Halve the sensitivity

  // Draw the seesaw platform (tilting part)
  push();
  translate(scaleX + scaleWidth / 2, scaleY + 90); // Move to pivot point
  rotate(radians(seesawTilt));
  fill(150);
  rect(-scaleWidth / 2, -15, scaleWidth, platformHeight); // 1.5 times the original platform height

  // Draw plates directly on top of both ends of the platform
  fill(180);
  ellipse(-scaleWidth / 2, -platformHeight / 2 - 7.5, 60, 15); // Left plate (scaled up)
  ellipse(scaleWidth / 2, -platformHeight / 2 - 7.5, 60, 15);  // Right plate (scaled up)
  pop();

  // Display the left and right weights
  fill(0);
  textSize(16);
  textAlign(CENTER);
  text('Left Weight: ' + leftWeight, scaleX + scaleWidth / 2, scaleY + 180);
  text('Right Weight: ' + rightWeight, scaleX + scaleWidth / 2, scaleY + 200);
}




class DraggableShape {
  constructor(x, y, img) {
    this.x = x;
    this.y = y;
    this.img = img;
    this.originalWidth = img.width;
    this.originalHeight = img.height;
    this.width = img.width;
    this.height = img.height;
    this.weight = this.originalWidth * this.originalHeight * 0.1;
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
