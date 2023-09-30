let intarray = [];

function recursivePrintTile(arr, start, end) {

    let middle = Math.floor((start + end) / 2);
  
    if (start >= end) {
      arr[start].paintSquare();
      return false;
    } else {
        console.log(end-start);
        recursivePrintTile(arr, start, middle);
        recursivePrintTile(arr, middle + 1, end);
    }
  }
  