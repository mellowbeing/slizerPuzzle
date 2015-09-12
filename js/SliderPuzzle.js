/*
  Written by Jennifer Refat 
  9/2013
  
This challenge was to create the classic "Slider Puzzle" game which I used to play all the time when growing up.  I built a 4x4 numbered grid using a single background image which the user can interact with by clicking on a tile to move it or to drag and drop a tile into the empty slot.  The game is designed to look as if it was being played on an iPad.  It has a solved puzzle screen with a congratulatory message for the user while removing interactivity at this stage.  If the user reshuffles the board at this point, the game restarts.

*/



var data = [4, 8, 1, 14, 7, 2, 3, 0, 12, 5, 6, 11, 13, 9, 15, 10];

var SliderPuzzle = function() {
  
  var solvedPuzzle    = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], // complete state 
      currentState    = data.slice(0),              // copy and start with initial array, update with each move!
      
      puzzleSize      = 640,                        // width and height in pixels for square puzzle
      numTiles        = 4,                          // numbe of tiles across and down
      blankIndex      = currentState.length-1,      // blank tile's index is at end of data array
      tileSize        = puzzleSize / numTiles,      // pixel size of each puzzle tile
      blankPos        = currentState[blankIndex],   // blank tile position

      blankTile       = document.getElementById('piece'+ blankIndex),   // blank puzzle tile
      congrats        = document.getElementById('congrats'),            // end of game congrats message
      puzzle          = document.getElementById('puzzle'),              // puzzle parent container
      scrambleButton  = document.getElementById('scramble'),            // scramble/shuffle button
      
      isComplete      = false,  // completed state flag
      
      MOUSE_UP        = 0,      // flag=0: mouse is up
      MOUSE_DOWN      = 1,      // flag=1: mouse is down
      MOUSE_DRAG      = 2,      // flag=2: mouse is down and dragging
      
      // Mouse event related
      mouseConfig = {
        dragged         : null, // current dragged photo tile
        startX          : 0,    // get starting mousedown X coordinate
        startY          : 0,    // get starting mousedown Y coordinate
        dragXMax        : 0,    // bounding box's X1 coordinate
        dragYMax        : 0,    // bounding box's Y1 coordinate
        dragXMin        : 0,    // bounding box's X2 coordinate
        dragYMin        : 0,    // bounding box's Y2 coordinate
        offsetX         : 0,    // X distance dragged tile has moved
        offsetY         : 0,    // Y distance dragged tile has moved
        flag            : 0     // default to MOUSE_UP
      };

  
  /**
  * Setup all board functionality: 
  *   - For mobile, remove address bar
  *   - Set up event handlers for board tiles and shuffle button
  *   - Draw board with sample data provided
  */
  function _init() {
  
    // When viewing in mobile, remove address bar for larger viewport
    window.addEventListener("load",function() {
    	setTimeout(function(){
    		window.scrollTo(0, 1);
    	}, 0);
    });

    // set click event on parent
    scrambleButton.addEventListener('click', displayValidBoard, false);
    
    // Draw initial board
    _drawBoard(data);
    
    // Set mouse related event handlers
    puzzle.addEventListener("mousedown", _handleMouseDown, false);
    puzzle.addEventListener("mousemove", _handleMouseMove, false);
    puzzle.addEventListener("mouseup",   _handleMouseUp,   false);
    puzzle.addEventListener("mouseout",  _handleMouseout,  false);
  }  
  
  
  /**
  * Capture mouse event coordinates and tile's coordinates 
  *
  * @param  {Event}
  */
  function _startDrag(event) {
    
    // If mouseup, then user has released tile
    if (mouseConfig.flag === MOUSE_UP) {
      return;
    }    
    
    var clickedId = mouseConfig.dragged.id;
    
    
    if (mouseConfig.dragged !== blankTile) {
    
      if (_setDragBounds(clickedId.substring(5, clickedId.length), parseFloat(mouseConfig.dragged.style.left), parseFloat(mouseConfig.dragged.style.top))) {
      
        mouseConfig.flag = MOUSE_DRAG;
        
        mouseConfig.startX = event.clientX;
        mouseConfig.startY = event.clientY;
  
        mouseConfig.offsetX = parseFloat(mouseConfig.dragged.style.left);
        mouseConfig.offsetY = parseFloat(mouseConfig.dragged.style.top);
      }
    }
  }
  
  
  /**
  * User has dragged tile paste puzzle board's perimeter; release dragged item.
  *
  * @param  {Event}
  */
  function _handleMouseout(event) {
    mouseConfig.flag = MOUSE_UP;
  }
  
  
  /**
  * Using a timeout, handle whether user has clicked or started dragging tile
  *
  * @param  {Event}
  */
  function _handleMouseDown(event) {
    mouseConfig.flag = MOUSE_DOWN;
    mouseConfig.dragged = event.target;

    setTimeout(function(){
      _startDrag(event)
    }, 150);
  }
  
  
  /**
  * While user is dragging item, update tile's position on screen.
  *
  * @param  {Event}
  */
  function _handleMouseMove(event) {

    if ( (mouseConfig.flag === MOUSE_DRAG) && (mouseConfig.dragged !== null) && (mouseConfig.dragged !== blankTile)) {
      
      var rawX = mouseConfig.offsetX + event.clientX - mouseConfig.startX,
          rawY = mouseConfig.offsetY + event.clientY - mouseConfig.startY;
          
      // Ensure the tile is only dragged within the bounds of its current position or that of the blank space.
      mouseConfig.dragged.style.left = Math.max( Math.min(rawX, mouseConfig.dragXMax), mouseConfig.dragXMin) + 'px';
      mouseConfig.dragged.style.top  = Math.max(Math.min(rawY, mouseConfig.dragYMax), mouseConfig.dragYMin) + 'px';
    }
  }
  

  /**
  * Differentiates whether user is dragging tile or has clicked on a tile and swaps tiles.
  *
  * @param  {Event}
  */
  function _handleMouseUp(event) {

    var flagTemp = mouseConfig.flag;
        mouseConfig.flag = 0;
    
    // User is dragging tile
    if (mouseConfig.flagTemp === MOUSE_DRAG) {
    
      if ( (mouseConfig.offsetX !== parseFloat(mouseConfig.dragged.style.left)) || (mouseConfig.offsetY !== parseFloat(mouseConfig.dragged.style.top)) ) {
        _moveTile();
      }
      
      return;
    }
    
    // User clicked on tile
    else {
      _moveTile();
      mouseConfig.dragged = null; 
    }
  }
  
  
  /**
  * For clicked tile, if it is adjacent to blank tile, calculate allowable dragging space based on it's location.
  * This simulates a physical board so a photo tile to the left of the blank tile
  * is only allowed to move right and not beyond the blank tile's perimeter.
  *
  * @param  {Integer, Integer, Integer}
  * @return {Boolean} True if photo tile is adjacent to blank tile
  */
  function _setDragBounds(idNum, x, y) {
  
    // Phot tile is left of blank tile
    if ( (currentState[idNum] + 1) === blankPos && blankPos % numTiles !== 0) {
      mouseConfig.dragXMax = x + tileSize;
      mouseConfig.dragXMin = x;
      mouseConfig.dragYMax = y;
      mouseConfig.dragYMin = y;
      return true;
    }
    
    // Photo tile is right of blank tile
    if ((currentState[idNum] - 1) === blankPos && blankPos % numTiles !== numTiles - 1) {
      mouseConfig.dragXMax = x;
      mouseConfig.dragXMin = x - tileSize;
      mouseConfig.dragYMax = y;
      mouseConfig.dragYMin = y;
      return true;
    } 
    
    // Photo tile is above blank tile
    if ( (currentState[idNum] - numTiles) === blankPos ) {
      mouseConfig.dragXMax = x;
      mouseConfig.dragXMin = x;
      mouseConfig.dragYMax = y;
      mouseConfig.dragYMin = y - tileSize;
      return true;
    }
    
    // Photo tile is below blank tile
    if ((currentState[idNum] + numTiles) === blankPos) { 
      mouseConfig.dragXMax = x;
      mouseConfig.dragXMin = x;
      mouseConfig.dragYMax = y + tileSize;
      mouseConfig.dragYMin = y;
      return true;
    }
    return false;
  }
    
  
  /**
  * Compares currentState[] Array to solvedPuzzle[] Array
  *
  * @return {Boolean} True if existing board's state is equal to sorted solvedPuzzle[] Array
  */
  function _isSolved() {
    
    var solvedLen = solvedPuzzle.length,
        i = 0;

    if (solvedLen !== currentState.length)
        return false;
                
    for (i = 0; i < solvedLen; i++) {
      if (solvedPuzzle[i] !== currentState[i]) {
        return false;
      }
    }
    return true;
  }
  
  
  /**
  * Display completed board state
  *   - Blank tile will display final photo tile without any styles
  *   - Display congrats message
  *   - Make board non-interactive unless user shuffles board to restart game
  */
  function _showCompleteState() {
    blankTile.className = "solved";
    congrats.className  = 'active';
    puzzle.removeEventListener("mousedown", _handleMouseDown, false);
    puzzle.removeEventListener("mousemove", _handleMouseMove, false);
    puzzle.removeEventListener("mouseup",   _handleMouseUp,   false);
    puzzle.removeEventListener("mouseout",  _handleMouseout,  false);
  }
  
  
  /**
  * Draw board containing board's tile positions
  * @param {int[]} The values of new board to be drawn
  */
  function _drawBoard(board) {
  
    var len = board.length,
        tileId,
        i,
        p;
    
    for (i=0; i<len; i++) {
      xPos = board[i] % numTiles;
      yPos = ~~(board[i] / numTiles);
      
      p = 'piece' + i;
      tileId = document.getElementById(p);
      
      tileId.style.left = xPos * tileSize + "px";
      tileId.style.top  = yPos * tileSize + "px";
    }
  }
  
  
  /**
  * If photo tile is adjacent to blank tile, swap their values and animate both tiles to show new positions
  */
  function _moveTile() {
    var photoTile = mouseConfig.dragged,                        // currently active photo tile
        clickedId = photoTile.id,                               // tile id
        idNum     = clickedId.substring(5, clickedId.length),   // get id digits
        tileRow,    // photo tile's board row position
        tileCol,    // photo tile's board column position
        blankRow,   // blank tile's board row position
        blankCol;   // blank tile's board column position
            
    // Photo tile is left or right of blank tile
    if ((currentState[idNum] + 1 === blankPos) && (blankPos % numTiles !== 0) ||
        ((currentState[idNum] - 1 === blankPos) && (blankPos % numTiles !== numTiles - 1))
        ) {
      _swapWithBlank(idNum);
      tileRow   = (currentState[idNum] % numTiles);
      blankRow  = (currentState[blankIndex] % numTiles);   
      photoTile.style.left = tileRow * tileSize + "px";
      blankTile.style.left = blankRow * tileSize + "px";
    } 
    
    // Photo tile is above or below blank tile
    if ((currentState[idNum]- numTiles === blankPos) || (currentState[idNum] + numTiles === blankPos)) {
      _swapWithBlank(idNum);
      tileCol   = ~~(currentState[idNum] / numTiles);
      blankCol  = ~~(currentState[blankIndex] / numTiles);
      photoTile.style.top = tileCol * tileSize + "px";
      blankTile.style.top = blankCol * tileSize + "px";
    }
    
    // Update blank tile's position
    blankPos = currentState[blankIndex];
    
    // Is the puzzle solved yet?
    if (_isSolved() ) {
      isComplete = true;
      _showCompleteState();
    }
  }
  
  
  /**
  * Update currentState[] by swapping the positions of the blank and the target tiles
  */
  function _swapWithBlank(id) {
    
    var tmp                  = currentState[id];
    currentState[id]         = currentState[blankIndex];
    currentState[blankIndex] = tmp;
  }
  
  
  /**
  * Scrambles the set of tiles so that a user may restart the game
  * @param {int[]} data An array containing a set of numbers defining
  * the board state.
  * @return {Boolean} Returns true if the board was successfully scrambled.
  */
  function _scramble(board) {
    if (arguments.length !== 1) { return false; }
        
    var input = board.slice(0),
        top   = input.length, 
        current,
        i;
      
    while(top) {
      current = Math.floor(Math.random() * (top));
      board[top-1] = input[current];
      input.splice(current, 1);
      --top;
    }
    
    return canBoardBeSolved(board);
  } 
  
  
  /**
  * Set board to initial state:
  *   - Attach event handlers to puzzle tiles
  *   - Reset blank tile to not have background image
  *   - Hide congrats message
  */
  function _resetBoard() {
    
    puzzle.addEventListener("mousedown", _handleMouseDown, false);
    puzzle.addEventListener("mousemove", _handleMouseMove, false);
    puzzle.addEventListener("mouseup",   _handleMouseUp,   false);
    puzzle.addEventListener("mouseout",  _handleMouseout,  false);

    blankTile.className = '';
    congrats.className  = '';  
  }
  
  
  /**
  * Redraw board with valid data that's been scrambled
  */
  function displayValidBoard() {
  
    if (isComplete) {
      _resetBoard();
    }
        
    // regenerate board until a valid one is found
    while (!_scramble(currentState));
    
    // Update blank tile's position
    blankPos = currentState[blankIndex];
    
    _drawBoard(currentState);
  }
  
  /**
  * Only make init() public
  */
  return {
    init:       _init
  };
  
}();

SliderPuzzle.init();