const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
let image = document.getElementById("image");
const inputElement=document.getElementById("inputElement");
const rowInput=document.getElementById("rows");
const colorInput=document.getElementById("ColorRes");
const lightInput=document.getElementById("adjustLight");
const gridColorInput=document.getElementById("gridColor");
const gridStyleInput=document.getElementById("gridStyle");
const createButton=document.getElementById("createButton");



let width = canvas.clientWidth;
let height = canvas.clientHeight;
let rows;
let columns;
let columnWidth;
let rowHeight;
let numOfRows=80;
let level=3;
let quantumLevel;
let gridColor="darkgray";
let gridStyle="stitch";
let extraLight=20;

processImage();


function processImage(){

  setUpCanvas();
  fitImageOnCanvas();
  setQuantumLevel();
  pixelizeImage();
  drawGrid(gridColor, gridStyle);
}


/** sets up canvas based on the selected number of rows
 * @param {integer} numOfRows : number of rows on the grid
 *
 */
function setUpCanvas() {
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

  /*
  // get the top left position of the image
  // in order to center the image within the canvas
  let x = width / 2 - newWidth / 2;
  let y = height / 2 - newHeight / 2;
*/

  // resize canvas
  ctx.canvas.width=newWidth;
  ctx.canvas.height=newHeight;

  //adjust width and height for the row count
  width=newWidth;
  height=newHeight;

  // When drawing the image, we have to scale down the image
  // width and height in order to fit within the canvas
  ctx.drawImage(image, 0,0, newWidth, newHeight);
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

function setQuantumLevel(){
  level=9-level;
  quantumLevel=Math.pow(2,level)-1;
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
  let centralFactor = 3;

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
    ctx.fillStyle = "white";
  } else {
    {
      quantizeColor(red, green, blue);
    }
  }

  // fills up the selected tile with the chosen color
  ctx.fillRect(leftX, topY, columnWidth, rowHeight);
}

function quantizeColor(r,g,b){

  let red= Math.floor((r)/quantumLevel);
  red *=quantumLevel+extraLight;

  let green= Math.floor((g)/quantumLevel);
  green*=quantumLevel+extraLight;

  let blue=Math.floor((b)/quantumLevel);
  blue *=quantumLevel+extraLight;

  ctx.fillStyle = `rgb(${Math.floor(red)},${Math.floor(
    green
  )},${Math.floor(blue)})`;

}

function selectImage(e){
  
  let selectedFile=e.target.files[0];
  let fileReader = new FileReader();
  fileReader.readAsDataURL(selectedFile);

  fileReader.onload=function (){
    image.setAttribute('src',fileReader.result)
  }

  image.onload=function(){
    width=image.width;
    height=image.height;
    processImage();
  }

}
inputElement.addEventListener("change",e=>selectImage(e))


createButton.addEventListener("click",()=>{
  numOfRows=Number(rowInput.value);
  level=Number(colorInput.value);
  extraLight=Number(lightInput.value);
  gridColor=gridColorInput.value;
  gridStyle=gridStyleInput.value;
  processImage();
})

