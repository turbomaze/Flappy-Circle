/******************\
|  Perfect Canvas  |
| @author Anthony  |
| @version 0.1     |
| @date 2013/12/31 |
| @edit 2013/12/31 |
\******************/

/*********************
 * working variables */
var canvases;
var canvasParents;
var resizeEvt;

/******************
 * work functions */
function initPerfectCanvas() {
	//////////////////////////////////////////
	//load up the canvases and their parents//
	canvases = [];
	canvasParents = [];
	var allTheCanvases = document.getElementsByTagName('canvas');
	for (var ai = 0; ai < allTheCanvases.length; ai++) {
		canvases.push(allTheCanvases[ai]);
		canvasParents.push(hug(allTheCanvases[ai]));
	}
	
	//////////////////////////
	//catch the resize event//
	window.addEventListener('resize', resizeCanvases);
	resizeCanvases(); //initial call
}

function resizeCanvases() {
	var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	for (var ai = 0; ai < canvases.length; ai++) {
		canvases[ai].width = Math.floor((w/h)*400);
		//the outer height must be defined explicitly!
		canvases[ai].height = 400;
		canvases[ai].style.width = (w)+'px'; 
		canvases[ai].style.height = (h)+'px'; 
		
		///////////////////////////////////////////
		//let other scripts know the size changed//
		resizeEvt = document.createEvent('CustomEvent');
		resizeEvt.initEvent('CanvasResize', true, true);
		canvases[ai].dispatchEvent(resizeEvt);
	}
}

/********************
 * helper functions */
function hug(el) { //surrounds the element with a div and returns that div
	var hugger = document.createElement('div');
	hugger.style.height = '100%'; //make it a reeeaalllly big hug
	el.parentNode.appendChild(hugger);
	hugger.appendChild(el);
	return hugger;
}

window.addEventListener('load', initPerfectCanvas);
