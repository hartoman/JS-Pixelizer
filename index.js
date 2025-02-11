const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
let image = document.getElementById("image");
const uploadPic = document.getElementById("uploadPic");
const rowInput = document.getElementById("rows");
const colorInput = document.getElementById("ColorRes");
const lightInput = document.getElementById("adjustLight");
const gridColorInput = document.getElementById("gridColor");
const gridStyleInput = document.getElementById("gridStyle");
const createButton = document.getElementById("createButton");
// the initial canvas dimensions
let canvasWidth = canvas.clientWidth;
let canvasHeight = canvas.clientHeight;
// rows, columns and their dimensions
let numOfRows;
let numOfColumns;
let columnWidth;
let rowHeight;
let level; // user-defined variable to be used in the calc of the quantumLevel
let quantumLevel; // the level of the color quantization (higher = more colors)
let extraLight; // optional extra lighting
let gridColor;
let gridStyle;
// the array of the tiles
let tiles = [];

// TODO
let colorMap = new Map();

// basic tile class
class Tile {
  red = 0;
  green = 0;
  blue = 0;

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  // sets the color values of the tile
  setColors(r, g, b) {
    this.red = Math.floor(r);
    this.green = Math.floor(g);
    this.blue = Math.floor(b);
  }
  // draws the tile on the canvas
  paintSquare() {
    let tileColor = `rgb(${this.red},${this.green},${this.blue})`;
    ctx.fillStyle = tileColor;
    ctx.fillRect(this.x * columnWidth, this.y * rowHeight, columnWidth, rowHeight);
  }
  // todo: remove at the end
  printTile() {
    console.log(this.x, this.y);
  }
}




function processImage() {
  // initializes variables
  initialSetup();
  // adjusts image on the canvas
  fitImageOnCanvas();
  // calculates the rgb values of each tile and saves them in the array
  calcTilesRGBValues();
  // paints all the tiles
  paintTiles();
  // draws the grid
  drawGrid(gridColor, gridStyle);
  console.log(colorMap)

}

// prepares all the necessary variables for the calculations
function initialSetup() {
  initParameters(); // initializes parameters (columns, rows, dimensions etc)
  initCanvas(); // prepares canvas
  initTilesArray(); // initializes the array of tiles
  initQuantumLevel(); // sets the level of color quantization

  // sets up canvas based on the selected number of rows
  function initCanvas() {
    //  numOfRows = numOfRows;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    // calculates the columns so that they are proportional to the rows
    let ratio = canvasWidth / canvasHeight;
    numOfColumns = Math.floor(numOfRows * ratio);
    // adjusts column width and row height
    columnWidth = canvasWidth / numOfColumns;
    rowHeight = canvasHeight / numOfRows;
  }
  // initializes the array of tiles
  function initTilesArray() {
    tiles = [];
    for (let i = 0; i < numOfRows; i++) {
      for (let j = 0; j < numOfColumns; j++) {
        tiles.push(new Tile(j, i));
      }
    }
  }
  // sets the quantization level
  function initQuantumLevel() {
    level = 9 - level;
    quantumLevel = Math.pow(2, level) - 1;
  }
  // initializes parameters
  function initParameters() {
    numOfRows = Number(rowInput.value);
    level = Number(colorInput.value);
    extraLight = Number(lightInput.value);
    gridColor = gridColorInput.value;
    gridStyle = gridStyleInput.value;
  }
}

/** adjusts image to fit canvas
 * credits: https://livefiredev.com/html5-how-to-scale-image-to-fit-a-canvas-with-demos/
 */
function fitImageOnCanvas() {
  // the min of the 2 ratios, depends if image is landscape or portait
  let ratio = Math.min(canvasWidth / image.width, canvasHeight / image.height);
  // adjust width and height
  let newWidth = image.width * ratio;
  let newHeight = image.height * ratio;
  // resize canvas
  ctx.canvas.width = newWidth;
  ctx.canvas.height = newHeight;
  //adjust width and height for the row count
  canvasWidth = newWidth;
  canvasHeight = newHeight;
  // When drawing the image, we have to scale down the image
  // width and height in order to fit within the canvas
  ctx.drawImage(image, 0, 0, newWidth, newHeight);
}

/** draws a grid on the image
 *
 * @param {string} gridColor : color name of the grid lines
 * @param {string} style : "stitch" or "solid"
 */
function drawGrid(gridColor, style) {
  let width = canvas.width;
  let height = canvas.height;
  let columnWidth = width / numOfColumns;
  let rowHeight = height / numOfRows;

  for (let i = 0; i < numOfRows; i++) {
    ctx.moveTo(0, i * rowHeight);
    ctx.lineTo(width, i * rowHeight);
  }

  for (let i = 0; i < numOfColumns; i++) {
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

// calculates the rgb values of each tile and saves them in the array
function calcTilesRGBValues() {
  // clear the colormap from previous entries
  colorMap.clear();
  tiles.map((tile) => {
    avgTileColor(tile);
    addToColorMap(tile);
  });
  // sorts the map by descending color frequency
  colorMap = new Map([...colorMap.entries()].sort((a, b) => b[1] - a[1]));
}

// paints all the tiles
function paintTiles() {
  tiles.map((tile) => {
    // fills up the selected tile with the chosen color
    ctx.fillStyle = `rgb(${tile.red},${tile.green},${tile.blue})`;
    ctx.fillRect(tile.x * columnWidth, tile.y * rowHeight, columnWidth, rowHeight);
  });
}

/** sets the average color of a given tile by getting the value of 5 points
 * @params:Integer tlx,Integer tly
 */
// credits: https://www.geeksforgeeks.org/how-to-get-pixel-from-html-canvas/
function avgTileColor(tile) {
  let leftX = tile.x * columnWidth;
  let topY = tile.y * rowHeight;
  let red = 0;
  let green = 0;
  let blue = 0;
  let alpha = 1;

  // leftmost X is on the first from the left quarter of the image
  let innerleftX = leftX + Math.floor(columnWidth * 0.25);
  // topmost Y is on the first from the top quarter of the image
  let innertopY = topY + Math.floor(rowHeight * 0.25);
  // rightmost X is on the last from the left quarter of the image
  let rightX = leftX + Math.floor(columnWidth * 0.75);
  //bottommost Y is on the last from the top quarter of the image
  let bottomY = topY + Math.floor(rowHeight * 0.75);
  // central point is in the middle of the image
  let centerX = leftX + columnWidth / 2;
  let centerY = topY + rowHeight / 2;

  // central point is a bit more important that the rest
  const centralFactor = 3;

  // extract pixel colors:
  // top left
  let ImageData = ctx.getImageData(innerleftX, innertopY, 1, 1);
  red += ImageData.data[0];
  green += ImageData.data[1];
  blue += ImageData.data[2];
  alpha += ImageData.data[3];
  // top right
  ImageData = ctx.getImageData(rightX, innertopY, 1, 1);
  red += ImageData.data[0];
  green += ImageData.data[1];
  blue += ImageData.data[2];
  alpha += ImageData.data[3];
  // bottom left
  ImageData = ctx.getImageData(innerleftX, bottomY, 1, 1);
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
    // for transparent portions of an image
    const defaultColor = [255, 255, 255];
    tile.setColors(...defaultColor);
  } else {
    {
      [red, green, blue] = quantizeColor(red, green, blue);
      tile.setColors(red, green, blue);
    }
  }

  // quantizes the colors by the calculated level and optionally adds extra light factor
  function quantizeColor(r, g, b) {
    let red = Math.floor(r / quantumLevel);
    red *= quantumLevel + extraLight;
    let green = Math.floor(g / quantumLevel);
    green *= quantumLevel + extraLight;
    let blue = Math.floor(b / quantumLevel);
    blue *= quantumLevel + extraLight;
    // remove decimals
    red = Math.floor(red);
    green = Math.floor(green);
    blue = Math.floor(blue);
    // return rgb array
    return [red, green, blue];
  }
}

function addToColorMap(tile) {
  let colorCode = `${tile.red}-${tile.green}-${tile.blue}`;
  if (!colorMap.has(colorCode))
    colorMap.set(colorCode, 1);
  else {
    let colorCount = colorMap.get(colorCode);
    colorMap.set(colorCode, colorCount+1);
  }
}
// event Listener to upload choose and load an image
uploadPic.addEventListener("change", (e) => {
  let selectedFile = e.target.files[0];
  let fileReader = new FileReader();
  fileReader.readAsDataURL(selectedFile);
  // once the fileReader loads, the image source is set
  fileReader.onload = function () {
    image.setAttribute("src", fileReader.result);
  };
  // once the image loads, we get the variables
  image.onload = function () {
    canvasWidth = image.width;
    canvasHeight = image.height;
        // TODO: TIDY UP
    const params1 = document.getElementById('params1');
    params1.style.display = "block";
    params1.scrollIntoView({behavior: "smooth"});
  };

});

createButton.addEventListener("click", () => {
  if (image.getAttribute("src") != "") {
    processImage();
    // TODO: TIDY UP
    canvas.style.display = "block";
    const params2 = document.getElementById('params2');
    params2.style.display = "block";
    const colorMapContents = document.getElementById('colorMapContents');
    
    params2.scrollIntoView({behavior: "smooth"});
  } else {
    alert("no image selected");
  }
});
