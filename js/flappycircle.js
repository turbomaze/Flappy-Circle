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

var flappyCircleRadius = 15; //in px
var barrierOpeningSpace = 0.2; //space of each opening as a percent
var barrierWidth = 100; //width of the barriers in px
var startPosAsAFraction = [0.1, 0.5]; //constant location of flappy as a percent
var percentBGLand = 0.3; //how far the land part of the BG extends

/*************
 * constants */
var MS_PER_FRAME = 1000/frameRate;
var XRANGE = [0, 1];
var YRANGE = [0, 1];
var G = 0.002; //units/second
var JUMP = 0.025; //units/second
var X_VEL = 0.012; //units/second

/*********************
 * working variables */
var canvas;
var ctx;
var updateCtr;
var pos;
var velocity;
var screenVelocity;
var barriers;

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
	console.log(pos);
	velocity = [X_VEL, 0]; //units/second, x velocity shouldn't change
	screenVelocity = velocity.slice(0); //never changes
	barriers = []; //[[x position, fraction up on the page] ... []]
	for (var ai = 1; ai <= 15; ai++) {
		var vertDisp = getRandReal(0.2, 0.8);
		barriers.push([0.75*ai, vertDisp]);
	}

	//////////////////////////
	//attach event listeners//
	canvas.addEventListener('CanvasResize', function() {
		canvas.height = document.documentElement.clientHeight-5;
	});

	function onPress(e) { velocity[1] = JUMP; }
	canvas.addEventListener('click', onPress);
	canvas.addEventListener('touchstart', onPress);

	updateCanvas();
}

function updateCanvas() {
	var startTime = currentTimeMillis();
	updateCtr += 1;
	if (updateCtr%drawEvery == 0) drawBackground();

	////////////////////////////////////////////
	//move the screen (aka the x and y ranges)//
	XRANGE[0] += screenVelocity[0]; //x velocity
	XRANGE[1] += screenVelocity[0];
	YRANGE[0] += screenVelocity[1]; //y velocity
	YRANGE[1] += screenVelocity[1];

	///////////////////////////////////
	//update flappy circle's location//
	velocity[1] -= G; //gravity
	pos = arrayAdd(pos, velocity); //apply the velocity
	pos = cap(pos, velocity, [XRANGE, YRANGE]); //can't go off screen

	//////////////////////
	//draw flappy circle//
	var canvasX = map(pos[0], XRANGE[0], XRANGE[1], 0, canvas.width);
	var canvasY = map(pos[1], YRANGE[0], YRANGE[1], canvas.height, 0);
	drawPoint([canvasX, canvasY], flappyCircleRadius, 'maroon');

	/////////////////////
	//draw the barriers//
	ctx.fillStyle = 'darkgreen';
	var p = (YRANGE[1]-YRANGE[0])*barrierOpeningSpace;
	for (var ai = 0; ai < barriers.length; ai++) {
		/////////////////////////////////////////////////
		//figure out how big the barriers are in pixels//
		var q = (YRANGE[1]-YRANGE[0])*barriers[ai][1] + YRANGE[0];
		var topHalfDownTo = YRANGE[0]+q+p/2;
		var botHalfUpTo = topHalfDownTo-p;
		var topHalfLength = map(
			YRANGE[1] - topHalfDownTo, YRANGE[0], YRANGE[1], 0, canvas.height
		); //length in units of the top half of the barrier
		var botHalfLength = map(
			botHalfUpTo, YRANGE[0], YRANGE[1], 0, canvas.height
		); //same for the bottom half

		//its x position
		var topCornerXPos = map(barriers[ai][0], XRANGE[0], XRANGE[1], 0, canvas.width);
		
		//draw it
		ctx.fillRect(topCornerXPos, 0, barrierWidth, topHalfLength);
		ctx.fillRect(
			topCornerXPos, canvas.height-botHalfLength, barrierWidth, botHalfLength
		);
	}
	
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

		if (ret[ai] !== a[ai]) {
			b[ai] = screenVelocity[ai]; //capped? then reset b to the screen's vel
		}
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
	return Math.floor(getRandReal(lower, upper));
}

function getRandReal(lower, upper) { //returns number in [lower, upper)
	return (Math.random()*(upper-lower))+lower;
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