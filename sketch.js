

let shapes = [];
let leftWeight = 0;
let rightWeight = 0;
let draggingShape = null;

// Canvas section setup
let middleSectionWidth = 314;
let sideSectionWidth = middleSectionWidth / 2;

// Rectangle with an 11:13 aspect ratio (horizontal orientation)
let rectHeight = 220;
let rectWidth = rectHeight * (13 / 11);
let images = [];
let scaleFactor = 0.09;

function preload() {
  for (let i = 1; i <= 20; i++) {
    images[i] = loadImage('https://raw.githubusercontent.com/lilytea/Art12/main/img' + i + '.png', img => {
      img.resize(img.width * scaleFactor, img.height * scaleFactor); // Scale down proportionally
    });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  let positions = [];  // Track positions to avoid overlap

  // Scatter shapes in the left section with minimal overlap
  for (let i = 1; i <= 20; i++) {
    let x, y;
    let overlapping;
    let attempts = 0;

    do {
      overlapping = false;
      x = random(0, sideSectionWidth - images[i].width);
      y = random(0, height - images[i].height);

      // Check for overlap with existing shapes
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

    // Save the position and dimensions to avoid overlap
    positions.push({ x: x, y: y, width: images[i].width, height: images[i].height });

    // Create the shape, analyze it for area and density, and add it to shapes array
    let shape = new DraggableShape(x, y, images[i]);
    shape.analyzeShape();  // Determine area, density, and color darkness
    shapes.push(shape);
  }
}

function draw() {
 background(240);

  // Draw the 11:13 rectangle in the middle section
  drawWeightDetectionRectangle();

  // Draw all shapes
  for (let shape of shapes) {
    shape.show();
    shape.update();
  }

  // Draw the seesaw scale in the rightmost section
  drawSeesaw();
}
function windowResized() {
  // Resize the canvas to fit the new window dimensions
  resizeCanvas(windowWidth, windowHeight);
}
  // }
function mousePressed() {
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].isMouseOver()) {
      draggingShape = shapes[i];
      // Log the weight of the clicked shape
      console.log(`Clicked shape at (${shapes[i].x.toFixed(1)}, ${shapes[i].y.toFixed(1)}) - Weight: ${shapes[i].weight.toFixed(2)}`);
      // Bring the selected shape to the front by moving it to the end of the array
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

// Draw a horizontal rectangle with an 11:13 aspect ratio in the middle section
function drawWeightDetectionRectangle() {
  fill(200, 200, 255, 150);
  stroke(0);

  let rectX = sideSectionWidth + (middleSectionWidth - rectWidth) / 2;
  let rectY = (height - rectHeight) / 2;

  rect(rectX, rectY, rectWidth, rectHeight);
  drawDottedLineInRectangle(rectX, rectY, rectWidth, rectHeight);
}

// Draw a dashed line inside the rectangle
function drawDottedLineInRectangle(rectX, rectY, rectWidth, rectHeight) {
  stroke(200);
  strokeWeight(2);
  for (let y = rectY; y < rectY + rectHeight; y += 10) {
    line(rectX + rectWidth / 2, y, rectX + rectWidth / 2, y + 5);
  }
}

// Calculate weight distribution: left vs. right inside the 11:13 rectangle
function calculateWeights() {
  leftWeight = 0;
  rightWeight = 0;

  let rectX = sideSectionWidth + (middleSectionWidth - rectWidth) / 2;
  let sectionWidth = rectWidth / 6;

  for (let shape of shapes) {
    if (shape.onCanvas()) {
      // Calculate the overlap of the shape in each section
      let overlapSections = calculateSectionOverlap(shape, rectX, sectionWidth);

      // For each section the shape overlaps, apply a weighted contribution based on overlap percentage
      for (let section of overlapSections) {
        let weightedContribution = shape.weight * section.percentage;
        let positionMultiplier = (section.index === 1 || section.index === 6) ? 3 : (section.index === 2 || section.index === 5) ? 2 : 1;
        let adjustedWeight = weightedContribution * positionMultiplier;

        // Assign weight to left or right based on section
        if (section.index <= 3) {
          leftWeight += adjustedWeight;
        } else {
          rightWeight += adjustedWeight;
        }
      }
    }
  }
}

// Helper function to calculate section overlap percentages for each shape
function calculateSectionOverlap(shape, rectX, sectionWidth) {
  let overlapSections = [];

  shape.img.loadPixels();
  let totalOpaquePixels = 0;
  let sectionOpaqueCounts = Array(6).fill(0); // Track opaque pixel counts per section

  for (let i = 0; i < shape.img.pixels.length; i += 4) {
    let alpha = shape.img.pixels[i + 3];
    if (alpha > 128) {  // Consider opaque pixel
      let pixelX = shape.x + (i / 4 % shape.img.width);
      let distanceFromRectX = pixelX - rectX;
      let section = Math.floor(distanceFromRectX / sectionWidth);

      if (section >= 0 && section < 6) {
        sectionOpaqueCounts[section]++;
        totalOpaquePixels++;
      }
    }
  }

  // Calculate overlap percentages for each section
  for (let i = 0; i < 6; i++) {
    if (sectionOpaqueCounts[i] > 0) {
      overlapSections.push({
        index: i + 1, // Section index (1-6)
        percentage: sectionOpaqueCounts[i] / totalOpaquePixels
      });
    }
  }

  return overlapSections;
}




// Draw the seesaw scale in the rightmost section
function drawSeesaw() {
  // Set basic dimensions and positions
  let scaleX = sideSectionWidth + middleSectionWidth + (sideSectionWidth - 100) / 2;
  let scaleY = (height - 100) / 2;
  let scaleWidth = 100;
  let baseHeight = 5;
  let platformHeight = 20;

  // Draw the triangular base of the scale
  fill(120);
  noStroke();
  triangle(
    scaleX + scaleWidth / 2, scaleY + 60,  // Top of the triangle
    scaleX + scaleWidth / 2 - 30, scaleY + 100, // Bottom left
    scaleX + scaleWidth / 2 + 30, scaleY + 100  // Bottom right
  );

  // Draw the pivot point (circle) at the top of the triangle
  fill(80);
  ellipse(scaleX + scaleWidth / 2, scaleY + 60, 12, 12);

  // Draw the base of the scale (static part)
  fill(100);
  rect(scaleX, scaleY + 60, scaleWidth, baseHeight);

  // Calculate and constrain the tilt of the seesaw based on weight difference
  let maxWeightDifference = 200;
  let seesawTilt = map(rightWeight - leftWeight, -maxWeightDifference, maxWeightDifference, -30, 30);
  seesawTilt = constrain(seesawTilt / 2, -15, 15); // Halve the sensitivity

  // Draw the seesaw platform (tilting part)
  push();
  translate(scaleX + scaleWidth / 2, scaleY + 60); // Move to pivot point
  rotate(radians(seesawTilt)); // Rotate based on weight difference
  fill(150);
  rect(-scaleWidth / 2, -10, scaleWidth, platformHeight);

  // Draw plates directly on top of both ends of the platform
  fill(180);
  ellipse(-scaleWidth / 2, -platformHeight / 2 - 5, 40, 10); // Left plate (just above left end)
  ellipse(scaleWidth / 2, -platformHeight / 2 - 5, 40, 10);  // Right plate (just above right end)
  pop();

  // Display the left and right weights
  fill(0);
  textSize(16);
  textAlign(CENTER);
  text('Left Weight: ' + leftWeight, scaleX + scaleWidth / 2, scaleY + 120);
  text('Right Weight: ' + rightWeight, scaleX + scaleWidth / 2, scaleY + 140);
}






// DraggableShape class with area, density, and darkness calculations
class DraggableShape {
  constructor(x, y, img) {
    this.x = x;
    this.y = y;
    this.img = img;
    this.area = 0;
    this.density = 'solid';
    this.weight = 0;
  }

  // Analyze the shape to determine area, density, and darkness
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
