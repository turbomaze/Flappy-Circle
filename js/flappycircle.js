/******************\
|  Flappy Circle   |
| @author Anthony  |
| @version 0.1     |
| @date 2014/02/19 |
| @edit 2014/02/19 |
\******************/

/**********
 * config */
var drawEvery = 1;

/*************
 * constants */

/*********************
 * working variables */
var canvas;
var ctx;
var updateCtr;

/******************
 * work functions */
function initFlappyCircle() {
	canvas = $('#canvas');
	ctx = canvas.getContext('2d');
	updateCtr = 0;
}

function updateCanvas() {
	var startTime = currentTimeMillis();
	updateCtr += 1;
	if (updateCtr%drawEvery == 0) clearCanvas();
	
	/////////////////
	//call next one//
	var timeTaken = currentTimeMillis() - startTime;
	if (timeTaken > MS_PER_FRAME) {
		updateCanvas();
	} else {
		setTimeout(function(){updateCanvas();}, MS_PER_FRAME - timeTaken);
	}
}

/********************
 * helper functions */
function getMousePos(e) {
	var rect = canvas.getBoundingClientRect();
	return [
		(e.clientX-rect.left)/(desiredCanvasWidth/canvasWidth), 
		(e.clientY-rect.top)/(desiredCanvasWidth/canvasWidth)
	];
}

function $(sel) {
	if (sel.charAt(0) === '#') return document.getElementById(sel.substring(1));
	else return false;
}

function currentTimeMillis() {
	return new Date().getTime();
}

function getRandNum(lower, upper) { //returns number in [lower, upper)
	return Math.floor((Math.random()*(upper-lower))+lower);
}

function tightMap(n, d1, d2, r1, r2) { //enforces boundaries
	var raw = map(n, d1, d2, r1, r2);
	if (raw < r1) return r1;
	else if (raw > r2) return r2;
	else return raw;
}

//given an n in [d1, d2], return a linearly related number in [r1, r2]
function map(n, d1, d2, r1, r2) {
	var Rd = d2-d1;
	var Rr = r2-r1;
	return (Rr/Rd)*(n - d1) + r1;
}

/***********
 * objects */
window.addEventListener('load', function() {
	initFlappyCircle();
});