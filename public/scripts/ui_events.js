$(document).on('mouseenter', '#ui_tiles', function(evt) {
  if (targEnt.active && targEnt.isGlobalObject) {
    targEnt.isOverInventory = true;
    
    $('#ui_tiles').toggleClass('inventory_area__active', true);
    $('#' + targEnt.htmlID).toggleClass('entity__over_inventory', true);
    
    $('#tiles').append('<div class="item" id="placeholder_item"></div>');
  }
});

$(document).on('mouseleave', '#ui_tiles', function(evt) {
  if (targEnt.isOverInventory) {
    targEnt.isOverInventory = false;
    
    $('#ui_tiles').toggleClass('inventory_area__active', false);
    $('#' + targEnt.htmlID).toggleClass('entity__over_inventory', false);
    
    $('#placeholder_item').remove();
  }
});

$(document).on('mouseenter', '#ui_inventory', function(evt) {
  if (targEnt.active && !targEnt.isGlobalObject) {
    targEnt.isOverInventory = true;
    
    $('#ui_inventory').toggleClass('inventory_area__active', true);
    $('#' + targEnt.htmlID).toggleClass('entity__over_inventory', true);
    
    $('#inventory').append('<div class="item" id="placeholder_item"></div>');
  }
});

$(document).on('mouseleave', '#ui_inventory', function(evt) {
  if (targEnt.isOverInventory) {
    targEnt.isOverInventory = false;
    
    $('#ui_inventory').toggleClass('inventory_area__active', false);
    $('#' + targEnt.htmlID).toggleClass('entity__over_inventory', false);
    
    $('#placeholder_item').remove();
  }
});


/**

Player Button Events

**/

$(document).on('click', '#pointer_icon', function(evt) {
	$('#pointer_icon').css('box-shadow', '0px 0px 0px 0.2vw ' + playerInfo.color);
	$('#pencil_icon').css('box-shadow', '');
	$('#eraser_icon').css('box-shadow', '');

	cursorMode = 'pointer';
	$('#drawing_area').css('cursor', 'default');
	$('.table').css('touch-action', 'auto');
	$('.clear_scroll_bar').css('display', 'none');
});
$(document).on('click', '#pencil_icon', function(evt) {
	$('#pencil_icon').css('box-shadow', '0px 0px 0px 0.2vw ' + playerInfo.color);
	$('#pointer_icon').css('box-shadow', '');
	$('#eraser_icon').css('box-shadow', '');

	cursorMode = 'pencil';
	$('#drawing_area').css('cursor', 'url(\'/resources/icons/pencil.png\'), crosshair');
	$('.table').css('touch-action', 'none');
	$('.clear_scroll_bar').css('display', 'block');
});
$(document).on('click', '#eraser_icon', function(evt) {
	$('#eraser_icon').css('box-shadow', '0px 0px 0px 0.2vw ' + playerInfo.color);
	$('#pointer_icon').css('box-shadow', '');
	$('#pencil_icon').css('box-shadow', '');

	cursorMode = 'eraser';
	$('#drawing_area').css('cursor', 'url(\'/resources/icons/eraser.png\'), cell');
	$('.table').css('touch-action', 'none');
	$('.clear_scroll_bar').css('display', 'block');
});
$(document).on('dblclick', '#eraser_icon', function(evt) {
	socket.emit('clear draw area');
});

$(document).on('click', '#question_icon', function(evt) {
  $('.info_text_container').toggleClass('info_text_container__active', true);
});
$(document).on('click', '.info_text_exit', function(evt) {
  $('.info_text_container').toggleClass('info_text_container__active', false);
});

$(document).on('click', '#terminal_icon', function(evt) {
  $('.terminal_container').toggleClass('terminal_container__active', true);
  $('#console_input').focus();
});
$(document).on('click', '.terminal_exit', function(evt) {
  $('.terminal_container').toggleClass('terminal_container__active', false);
});
$(document).on('click', '#wallpaper_icon', function(evt) {
  socket.emit('cycle wallpaper');
});