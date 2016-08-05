define(["jquery", "./isotope.pkgd.min", "./jquery-bridget", "text!./sorttable.css", "./numeral.min"],
function ($, Isotope, jQueryBridget, cssContent) {
	jQueryBridget( 'isotope', Isotope, $);
  'use strict';
  $("<style>").html(cssContent).appendTo("head");
  var $grid, olditems, newitems;
  function animateValue(obj, start, end, duration) {
    var range = parseFloat(end) - parseFloat(start);
    var minTimer = 50;
	var direction = (start - end) < 0 ? "up" : "down";
    var stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, minTimer);
    
    var startTime = new Date().getTime();
    var endTime = startTime + duration;
    var timer;
  
    function run() {
        var now = new Date().getTime();
        var remaining = Math.max((endTime - now) / duration, 0);
        var value = Math.round(parseFloat(end) - (remaining * range));
   //     console.log(value + ' ' + start + ' ' + end);
	  	obj.text(numeral(value).format('0,0'));
	  if (value === Math.round(end)) {
            clearInterval(timer);
        }
    }
    
    timer = setInterval(run, stepTime);
    run();
}
  
  function getIndex(dim, items) {
	for (var i=0;i<items.length;i++) {
	  if (items[i].name == dim) return i;
	  }
	return -1;
  }
  
  function updateIndex(index, value, items) {
	$.each(items, function(key, item) {
	  if (key == index) {
		var oldvalue = item.value;
		item.action = "C";
		item.value = value;
		
	  }
	});
  }
  
  function recalculateOrder() {
	var elems = $grid.isotope('getFilteredItemElements');
	var key = 0;
	$.each(elems, function() {
	  key++;
	  var currentorder = $(this).find('.element-order').text();
	  $(this).find('.element-order').text(key);
	  
	  if (key < currentorder) {
		$(this).effect("highlight", {color: '#C8E6C9'}, 2000);
	  } else if (key > currentorder) {
		$(this).effect("highlight", {color: '#FFCDD2'}, 2000);
	  } 

	});
	$grid.isotope('updateSortData').isotope();
  }
  
  function updateItems($grid, olditems, newitems) {
	
	var items = [];
	var $divitems = $grid.find('.element-item');
	
	$.each(olditems, function(oldkey, oldrow) {
	  var olddim = oldrow[0].qText, oldmeas = oldrow[1].qNum, oldmeasshow = oldrow[1].qText;
	  items.push({name: olddim, value: oldmeas , showvalue: oldmeasshow, action: "R"});
	});

	$.each(newitems, function(newkey, newrow) {
	  var newdim = newrow[0].qText, newmeas = newrow[1].qNum, newmeasshow = newrow[1].qText;
	  var index = getIndex(newdim, items);
	  	if (index != -1) {
			updateIndex(index, newmeas, items);
	  	}
	  	else if (newmeas != 0) {
			items.push({name: newdim, value: newmeas , showvalue: newmeasshow, action: "I"});
	  	}
	});

	$.each(items, function(key, item) {
	  switch (item.action) {
		case "C": $divitems.each( function() {
		  	var itemname = $(this).find('.element-name').text();
		  	if (itemname == item.name) {
			  if (item.value != $(this).data('value'))  {
				animateValue($(this).find('.element-value'), $(this).data('value'), item.value, 500);
			  }
				$(this).find('.element-value').text((item.showvalue));
			    $(this).data('value', (item.value));
		  	}	
    	});break;
		case "I": 
		  var $items = $('<div class="element-item" data-value="'+(item.value)+'"><div class="element-order">'+ key +'</div><div class="element-name">'+item.name +'</div><div class="element-value">'+item.value +'</div></div>');
		  $grid.append($items);
		  $items.effect("highlight", {color: '#CFD8DC'}, 2000)
		  $grid.isotope('appended',$items);
		  break;
		case "R": 
		  var $remove = $('div.element-item:contains("'+ item.name +'")');
		  $grid.isotope('remove', $remove).isotope('layout');
		  break;
	  }
	  
	});

	$grid.isotope('updateSortData').isotope();
	recalculateOrder();

  }
  
  
	return {
	  initialProperties : {
			qHyperCubeDef : {
				qDimensions : [],
				qMeasures : [],
				qTitle : "Leaderboard",
				qInitialDataFetch : [{
					qWidth : 2,
					qHeight : 1000
				}]
			}
		},
	    definition : {
		type: "items",
		component: "accordion",
		items: {
			dimensions: {
				uses: "dimensions",
				min: 1,
				max: 1
			},
			measures: {
				uses: "measures",
				min: 1,
				max: 1
			},
			options: {
					label: "Settings",
					type : "items",
					items : {
						sheetid: {
							type: "string",
							label: "Title",
							ref: "qHyperCubeDef.qTitle",
							defaultValue: "Leaderboard",
							maxlength: 1024,
							show: true
						}
					}
				}
		}
	},
		paint: function ($element, layout) {
		  var html = '', title = layout.qHyperCube.qTitle, qData = layout.qHyperCube.qDataPages[0];
		  if (typeof($grid) == "undefined") {	
			html +='<div id="leaderboard"><div class="leaderboard-header"><div class="leaderboard-title">'+ title +'</div></div>';
			html += '<div class="grid">';	
			if(qData && qData.qMatrix) {
			  newitems = qData.qMatrix;
				$.each(qData.qMatrix, function(key, row) {
				  var dim = row[0], meas = row[1];
				  html += '<div class="element-item" data-value="'+(meas.qNum)+'"><div class="element-order">'+ key +'</div><div class="element-name">'+dim.qText +'</div><div class="element-value">'+(meas.qText) +'</div></div>';
				});
		     }
		  html += '</div></div>';
		  $element.html(html);

			$grid = $('.grid').isotope({
			itemSelector: '.element-item',
			layoutMode: 'vertical',
			sortBy: "dataweight",
			sortAscending: false,
			getSortData: {
			  order : '.element-order',
			  name: '.element-name',
			  dataweight: function(itemElem) {
				return parseInt($(itemElem).data('value').toString().replace( /[\(\)]/g, ''));
    			},
			  weight: function(itemElem) {
				var weight = $(itemElem).find('.element-value').text();
				return parseInt(weight.replace( /[\(\)]/g, ''));
    			}
  				}
			});

			recalculateOrder();
	
		  } else {
			olditems = newitems;
			newitems = qData.qMatrix;
			updateItems($grid, olditems, newitems);

		  }

		  
		}
	};

});

