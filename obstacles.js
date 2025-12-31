// This file handles obstacle creation and collision detection.

// persistent obstacles stored as arrays: [x, y, w, h]
let obstacles = [];

const level1Layout = [

  [180, 187, 30, 225],  
  [180, 488, 30, 225],  
  [420, 187, 30, 225],  
  [420, 488, 30, 225],  
  [300, 90, 120, 30]    
];


const level2Layout = [

  [225, 210, 300, 30],  
  [375, 390, 300, 30],  
  [525, 150, 70, 70],
  [75,  450, 70, 70],   
  [75,  150, 30, 150]
];


const level3Layout = [

  [150, 150, 50, 50],  
  [450, 150, 50, 50],  
  [150, 450, 50, 50], 
  [450, 450, 50, 50],  
  [300, 240, 140, 20],  
  [240, 310, 20, 140], 
  [360, 310, 20, 140]
];

const levelLayouts = {
  1: level1Layout,
  2: level2Layout,
  3: level3Layout
}

// drawObs creates the barriers that block player movement.
// spawnRandomObs will pick whole-number random values and call drawObs.

// returns true if array-obstacle [x,y,w,h] overlaps rectObj {x,y,w,h}
function isRectOverlap(arr, rectObj) {
  const ax = arr[0], ay = arr[1], aw = arr[2], ah = arr[3];
  
  const aLeft = ax - aw/2
  const aRight = aLeft + aw;
  const aTop = ay - ah/2
  const aBottom = aTop + ah;

  const bLeft = rectObj.x - rectObj.w/2
  const bRight = bLeft + rectObj.w;
  const bTop = rectObj.y - rectObj.h/2
  const bBottom = bTop + rectObj.h;

  return !(aRight <= bLeft || aLeft >= bRight || aBottom <= bTop || aTop >= bBottom);
}


// No longer used function for random obstacle spawning, preserved for possible future use.
/*
function spawnRandomObs(count = 1, margin = 50, fixedW = 50, fixedH = 50) {

  const rock = { x: width/2, y: height/2, w: 100, h: 100 };

  for (let i = 0; i < count; i++) {

    const x = floor(random(margin, worldWidth - margin));
    const y = floor(random(margin, worldHeight - margin));

    const tempObject = [x, y, fixedW, fixedH];

    if (!isRectOverlap(tempObject, rock)) {
      obstacles.push(tempObject);
    } else {
      i--; // try again
    }
  }
}
  */


function drawObs(obsArr) {
  const [obsX, obsY, obsW, obsH] = obsArr;
  rect(obsX, obsY, obsW, obsH);
}


// This function is currently treating the player as a rectangle for collision purposes.
function handlePlayerCollisions() {

    // Define player rectangle
  let playerRect = {
    x: playerX,
    y: playerY,
    w: playerSize, 
    h: playerSize  
  };

  // Loop through every obstacle
  for (let obs of obstacles) {
    if (isRectOverlap(obs, playerRect)) {
      
      // Check for X-axis collision
      let playerXCheck = { 
        x: playerX, 
        y: prevPlayerY, 
        w: playerSize, 
        h: playerSize 
      };
      if (isRectOverlap(obs, playerXCheck)) {
        playerX = prevPlayerX; // Hit a wall, reset global playerX
      }
      
      // Check for Y-axis collision
      let playerYCheck = { 
        x: prevPlayerX, 
        y: playerY, 
        w: playerSize, 
        h: playerSize 
      };
      if (isRectOverlap(obs, playerYCheck)) {
        playerY = prevPlayerY; // Hit a ceiling/floor, reset global playerY
      }

      playerRect.x = playerX;
      playerRect.y = playerY;
    }
  }
}