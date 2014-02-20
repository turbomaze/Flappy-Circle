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
var prefDimensions = [800, 600];
var frameRate = 30;

var flappyCircleRadius = 15;
var startPosAsAFraction = [0.1, 0.5];
var percentBGLand = 0.3;

/*************
 * constants */
var MS_PER_FRAME = 1000/frameRate;
var XRANGE = [0, 1];
var YRANGE = [0, 1];
var G = 0.001; //units/second
var JUMP = 0.025;

/*********************
 * working variables */
var canvas;
var ctx;
var updateCtr;
var pos;
var velocity;

/******************
 * work functions */
function initFlappyCircle() {
	////////////////////////////////
	//initialize working variables//
	canvas = $('#canvas');
	canvas.width = prefDimensions[0];
	canvas.height = prefDimensions[1];
	ctx = canvas.getContext('2d');
	updateCtr = 0;
	pos = [map(startPosAsAFraction[0], 0, 1, XRANGE[0], XRANGE[1]),
		   map(startPosAsAFraction[1], 0, 1, YRANGE[0], YRANGE[1])];
	velocity = [0, 0]; //units/second

	//////////////////////////
	//attach event listeners//
	canvas.addEventListener('click', function(e) {
		velocity[1] = JUMP;
	});

	updateCanvas();
}

function updateCanvas() {
	var startTime = currentTimeMillis();
	updateCtr += 1;
	if (updateCtr%drawEvery == 0) drawBackground();

	///////////////////////////////////
	//update flappy circle's location//
	velocity[1] -= G; //gravity
	pos = arrayAdd(pos, velocity); //apply velocity
	pos = cap(pos, velocity, [XRANGE, YRANGE]); //can't go off screen

	//////////////////////
	//draw flappy circle//
	var canvasX = map(pos[0], XRANGE[0], XRANGE[1], 0, canvas.width);
	var canvasY = map(pos[1], YRANGE[0], YRANGE[1], canvas.height, 0);
	drawPoint([canvasX, canvasY], flappyCircleRadius, 'black');
	
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
function drawPoint(pos, r, color) {
	ctx.fillStyle = color || 'rgba(255, 255, 255, 0.3)';
	ctx.beginPath();
	ctx.arc(pos[0], pos[1], r, 0, 2*Math.PI, true);
	ctx.closePath();
	ctx.fill();
}

function drawBackground() {
	ctx.fillStyle = '#7DC7F5';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#62D162';
	var numPixelsForLab = percentBGLand*canvas.height; //30% the height
	ctx.fillRect(0, canvas.height-numPixelsForLab, canvas.width, numPixelsForLab);
}

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

function cap(a, b, constraints) { //caps a according to constr and sets b to 0
	var ret = [];
	for (var ai = 0; ai < Math.min(a.length, constraints.length); ai++) {
		if (a[ai] < constraints[ai][0]) ret.push(constraints[ai][0]);
		else if (a[ai] > constraints[ai][1]) ret.push(constraints[ai][1]);
		else ret.push(a[ai]);

		if (ret[ai] !== a[ai]) b[ai] = 0; //if it was capped, zero out b
	}
	return ret;
}

function arrayAdd(a, b) {
	var ret = [];
	for (var ai = 0; ai < Math.min(a.length, b.length); ai++) {
		ret.push(a[ai]+b[ai]);
	}
	return ret;
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