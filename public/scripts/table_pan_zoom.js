const ele = document.getElementById('table_container');

let pos = {
  top: 0,
  left: 0,
  x: 0,
  y: 0
};

const mouseDownHandler = function(e) {
  if (e.target.id != 'drawing_area')
    // prevent the table drag event if we click on anything other than the drawing area
    // ie: if we click on an entity instead
    return;
  
  ele.style.cursor = 'move';
  ele.style.userSelect = 'none';

  pos = {
    left: ele.scrollLeft,
    top: ele.scrollTop,
    // Get the current mouse position
    x: e.clientX,
    y: e.clientY,
  };

  document.addEventListener('mousemove', mouseMoveHandler);
  document.addEventListener('mouseup', mouseUpHandler);
};

const mouseMoveHandler = function(e) {
  // How far the mouse has been moved
  const dx = e.clientX - pos.x;
  const dy = e.clientY - pos.y;

  // Scroll the element
  ele.scrollTop = pos.top - dy;
  ele.scrollLeft = pos.left - dx;
};

const mouseUpHandler = function() {
  ele.style.cursor = 'default';
  ele.style.removeProperty('user-select');

  document.removeEventListener('mousemove', mouseMoveHandler);
  document.removeEventListener('mouseup', mouseUpHandler);
};

// Attach the handler
ele.addEventListener('mousedown', mouseDownHandler);




// zoom events

const defaultWidth = $('#table').css('width').replace('px', '');
const defaultHeight = $('#table').css('height').replace('px', '');

const zoomStep = 0.0005;
var zoomScale = 1;

const zoom = function(e) {
  if (e.deltaY == 0)
    return; // dont do anything if the delta didnt change
  
  let direction = e.deltaY;
  
  zoomScale -= (direction * zoomStep);
  
  // set the zoom scale of the table
  $('#table').css('transform', 'scale(' + zoomScale + ')');
  
  $('#table_spacer').css('width', (defaultWidth * zoomScale) + 'px');
  $('#table_spacer').css('height', (defaultHeight * zoomScale) + 'px');
}

const disableScrollWheel = function() {
  return false;
}

// attach handlers
ele.addEventListener('wheel', zoom);
ele.onwheel = disableScrollWheel;