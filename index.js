const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const image = document.getElementById("image");
const realWidth = canvas.clientWidth;
const realHeight = canvas.clientHeight;
let width = canvas.clientWidth;
let height = canvas.clientHeight;
let rows;
let columns;
let columnWidth;
let rowHeight;
let palette;

const COLOR_PALETTE_RETRO = [
  [0, 0, 0], // black
  [255, 255, 255], // white
  [192, 192, 192], // gray
  [255, 99, 71], // tomato red
  [255, 0, 0], // red
  [128, 0, 0], // dark red
  [154, 205, 50], // yellow green
  [0, 128, 0], // green
  [0, 100, 0], // dark green
  [0, 255, 255], // aqua
  [0, 0, 255], // blue
  [30, 144, 255], // dodger blue
  [255, 165, 0], // orange
  [205, 133, 63], // peru (light brown)
  [139, 69, 19], // saddlebrown (brown)
  [238, 130, 238], //violet
  [148, 0, 211], // dark violet
  [73, 0, 130], // indigo
  [255, 255, 0], // yellow
  [255, 222, 173], // navajowhite (sand)
  [210, 180, 140], // tan
];

setUpCanvas(80);
fitImageOnCanvas();
setPalette(COLOR_PALETTE_RETRO);
pixelizeImage();
drawGrid("darkgray", "stitch");

/** sets up canvas based on the selected number of rows
 * @param {integer} numOfRows : number of rows on the grid
 *
 */
function setUpCanvas(numOfRows) {
  rows = numOfRows;
  canvas.width = width;
  canvas.height = height;

  // calculates the columns so that they are proportional to the rows
  let ratio = width / height;
  columns = Math.floor(rows * ratio);

  // adjusts column width and row height
  columnWidth = width / columns;
  rowHeight = height / rows;
}

/** adjusts image to fit canvas
 * credits: https://livefiredev.com/html5-how-to-scale-image-to-fit-a-canvas-with-demos/
 */
function fitImageOnCanvas() {
  // the min of the 2 ratios, depends if image is landscape or portait
  let ratio = Math.min(width / image.width, height / image.height);

  // adjust width and height
  let newWidth = image.width * ratio;
  let newHeight = image.height * ratio;

  // get the top left position of the image
  // in order to center the image within the canvas
  let x = width / 2 - newWidth / 2;
  let y = height / 2 - newHeight / 2;

  // When drawing the image, we have to scale down the image
  // width and height in order to fit within the canvas
  ctx.drawImage(image, x, y, newWidth, newHeight);
}

/** draws a grid on the image
 *
 * @param {string} gridColor : color name of the grid lines
 * @param {string} style : "stitch" or "solid"
 */
function drawGrid(gridColor, style) {
  let width = canvas.width;
  let height = canvas.height;
  let columnWidth = width / columns;
  let rowHeight = height / rows;

  for (let i = 0; i < rows; i++) {
    ctx.moveTo(0, i * rowHeight);
    ctx.lineTo(width, i * rowHeight);
  }

  for (let i = 0; i < columns; i++) {
    ctx.moveTo(i * columnWidth, 0);
    ctx.lineTo(i * columnWidth, height);
  }

  ctx.strokeStyle = `${gridColor}`;

  switch (style) {
    case "stitch":
      ctx.setLineDash([1, 5]);
      break;
    case "solid":
      ctx.setLineDash([]);
      break;
  }

  ctx.lineWidth = 1;
  ctx.stroke();
}

/** pixelizes all tiles of the image
 *
 */
function pixelizeImage() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      avgTileColor(j * columnWidth, i * rowHeight);
    }
  }
}

/** sets up the color palette */
function setPalette(paletteChoice) {
  palette = paletteChoice;
}

/** sets the average color of a given tile by getting the value of 5 points
 * @params:Integer tlx,Integer tly
 */
// credits: https://www.geeksforgeeks.org/how-to-get-pixel-from-html-canvas/
function avgTileColor(leftX, topY) {
  let red = 0;
  let green = 0;
  let blue = 0;
  let alpha = 1;

  // leftmost X is on the first from the left quarter of the image
  leftX = leftX + Math.floor(columnWidth * 0.25);
  // topmost Y is on the first from the top quarter of the image
  topY = topY + Math.floor(rowHeight * 0.25);
  // rightmost X is on the last from the left quarter of the image
  let rightX = leftX + Math.floor(columnWidth * 0.75);
  //bottommost Y is on the last from the top quarter of the image
  let bottomY = topY + Math.floor(rowHeight * 0.75);
  // central point is in the middle of the image
  let centerX = leftX + columnWidth / 2;
  let centerY = topY + rowHeight / 2;

  // central point is a bit more important that the rest
  let centralFactor = 3;

  // extract pixel colors:
  // top left
  let ImageData = ctx.getImageData(leftX + 1, topY + 1, 1, 1);
  red += ImageData.data[0];
  green += ImageData.data[1];
  blue += ImageData.data[2];
  alpha += ImageData.data[3];
  // top right
  ImageData = ctx.getImageData(rightX, topY, 1, 1);
  red += ImageData.data[0];
  green += ImageData.data[1];
  blue += ImageData.data[2];
  alpha += ImageData.data[3];
  // bottom left
  ImageData = ctx.getImageData(leftX, bottomY, 1, 1);
  red += ImageData.data[0];
  green += ImageData.data[1];
  blue += ImageData.data[2];
  alpha += ImageData.data[3];
  // bottom right
  ImageData = ctx.getImageData(rightX, bottomY, 1, 1);
  red += ImageData.data[0];
  green += ImageData.data[1];
  blue += ImageData.data[2];
  alpha += ImageData.data[3];
  // center
  ImageData = ctx.getImageData(centerX, centerY, 1, 1);
  red += centralFactor * ImageData.data[0];
  green += centralFactor * ImageData.data[1];
  blue += centralFactor * ImageData.data[2];
  alpha += ImageData.data[3];
  // we average the colors. except for center pixel, the rest have a factor of 1
  red /= 4 + centralFactor;
  green /= 4 + centralFactor;
  blue /= 4 + centralFactor;
  alpha /= 4 + centralFactor;

  if (alpha < 100) {
    ctx.fillStyle = "white";
  } else {
    // if we choose not to have a palette, then the image is just going to be pixelized
    if (palette === undefined || palette === null) {
      ctx.fillStyle = `rgb(${Math.floor(red)},${Math.floor(green)},${Math.floor(
        blue
      )})`;
    } else {
      reduceColorsToPalette(red, green, blue, COLOR_PALETTE_RETRO);
    }
  }

  // fills up the selected tile with the chosen color
  ctx.fillRect(leftX, topY, columnWidth, rowHeight);
}

function reduceColorsToPalette(r, g, b) {
  let distance;
  let closestIndex;
  let tmpDist;

  for (let i = 0; i < palette.length; i++) {
    tmpDist = Math.pow(palette[i][0] - r, 2);
    tmpDist += Math.pow(palette[i][1] - g, 2);
    tmpDist += Math.pow(palette[i][2] - b, 2);
    tmpDist = Math.sqrt(tmpDist);

    if (distance === undefined || tmpDist < distance) {
      distance = tmpDist;
      closestIndex = i;
    }
  }

  let matchedR = palette[closestIndex][0];
  let matchedG = palette[closestIndex][1];
  let matchedB = palette[closestIndex][2];

  ctx.fillStyle = `rgb(${Math.floor(matchedR)},${Math.floor(
    matchedG
  )},${Math.floor(matchedB)})`;
}
