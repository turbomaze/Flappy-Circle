/******************\
|  Flappy Circle   |
| @author Anthony  |
| @version 1.0     |
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
var barriersEveryXUnits = 0.75;
var startPosAsAFraction = [0.1, 0.5]; //constant location of flappy as a percent
var percentBGLand = 0.3; //how far the land part of the BG extends

/*************
 * constants */
var MS_PER_FRAME = 1000/frameRate;
var INIT_XRANGE = [0, 1];
var INIT_YRANGE = [0, 1];
var G = 0.002; //units/second
var JUMP = 0.025; //units/second
var X_VEL = 0.012; //units/second
var WELCOME_TXT = ['Press to begin', '  a new game'];

/*********************
 * working variables */
var canvas;
var ctx;
var updateCtr;
var xrange;
var yrange;
var pos;
var velocity;
var screenVelocity;
var barriers;
var isRunning;

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
	screenVelocity = [X_VEL, 0]; //never changes

	///////////////////////
	//draw the homescreen//
	drawHomeScreen();

	//////////////////////////
	//attach event listeners//
	canvas.addEventListener('CanvasResize', function() {
		canvas.height = document.documentElement.clientHeight-5;
		if (!isRunning) drawHomeScreen(); //if the game hasn't started yet
	}); //forcing the canvas's height to the full size of the screen, the 5 is fudge

	function onPress(e) {
		if (isRunning) velocity[1] = JUMP;
		else { //game just started!
			isRunning = true;

			//////////////////////////////
			//setup the game's variables//
			xrange = INIT_XRANGE.slice(0);
			yrange = INIT_YRANGE.slice(0);
			pos = [map(startPosAsAFraction[0], 0, 1, xrange[0], xrange[1]),
				   map(startPosAsAFraction[1], 0, 1, yrange[0], yrange[1])];
			velocity = [X_VEL, 0]; //units/second, x velocity shouldn't change

			/////////////////////
			//generate barriers//
			barriers = []; //[[x position, fraction up on the page] ... []]
			for (var ai = barriersEveryXUnits; ai < 15; ai+=barriersEveryXUnits) {
				var vertDisp = getRandReal(0.2, 0.8);
				barriers.push([ai, vertDisp]);
			}

			updateCanvas();
		}
	}
	canvas.addEventListener('click', onPress);
	canvas.addEventListener('touchstart', onPress);
}

function drawHomeScreen() {
	drawBackground();
	ctx.fillStyle = 'black';
	ctx.font = 'bold 72px Arial';
	//-100 pixels for the width of the text
	var FUDGES = [230, -30, 70];
	for (var ai = 0; ai < WELCOME_TXT.length; ai++) {
		ctx.fillText(
			WELCOME_TXT[ai], 
			canvas.width/2 - FUDGES[0], 
			canvas.height/2 + FUDGES[1] + ai*FUDGES[2]
		);
	}
}

function updateCanvas() {
	var startTime = currentTimeMillis();
	updateCtr += 1;
	if (updateCtr%drawEvery == 0) drawBackground();

	////////////////////////////////////////////
	//move the screen (aka the x and y ranges)//
	xrange[0] += screenVelocity[0]; //x velocity
	xrange[1] += screenVelocity[0];
	yrange[0] += screenVelocity[1]; //y velocity
	yrange[1] += screenVelocity[1];

	///////////////////////////////////
	//update flappy circle's location//
	velocity[1] -= G; //gravity
	pos = arrayAdd(pos, velocity); //apply the velocity
	pos = cap(pos, velocity, [xrange, yrange]); //can't go off screen

	//////////////////////
	//draw flappy circle//
	var canvasX = map(pos[0], xrange[0], xrange[1], 0, canvas.width);
	var canvasY = map(pos[1], yrange[0], yrange[1], canvas.height, 0);
	drawPoint([canvasX, canvasY], flappyCircleRadius, 'maroon');

	/////////////////////
	//draw the barriers//
	var collision = false;
	var p = (yrange[1]-yrange[0])*barrierOpeningSpace;
	ctx.fillStyle = 'darkgreen';
	for (var ai = 0; ai < barriers.length; ai++) {
		/////////////////////////////////////////////////
		//figure out how big the barriers are in pixels//
		var q = (yrange[1]-yrange[0])*barriers[ai][1] + yrange[0];
		var topHalfDownTo = yrange[0]+q+p/2;
		var botHalfUpTo = topHalfDownTo-p;
		var topHalfLength = map(
			yrange[1] - topHalfDownTo, yrange[0], yrange[1], 0, canvas.height
		); //length in units of the top half of the barrier
		var botHalfLength = map(
			botHalfUpTo, yrange[0], yrange[1], 0, canvas.height
		); //same for the bottom half
		//where the bottom half of the barrier begins vertically
		var botHalfYStart = canvas.height - botHalfLength;
		//their x positions
		var topCornerXPos = map(barriers[ai][0], xrange[0], xrange[1], 0, canvas.width);
		
		////////////////////
		//collision checks//
		//if flappy circle is within the x range of this barrier
		if (inRange(canvasX, [topCornerXPos, topCornerXPos+100])) {
			//and it's within the y ranges of either the top or the bottom
			if (inRange(canvasY, [0, topHalfLength]) ||
				inRange(canvasY, [botHalfYStart, canvas.height])) {
				collision = true;
			}
		}
		if (collision) {
			isRunning = false; //they lost
			drawHomeScreen();
			return; //exit the game loop
		}
		
		/////////////////////
		//draw the barriers//
		ctx.fillRect(topCornerXPos, 0, barrierWidth, topHalfLength);
		ctx.fillRect(
			topCornerXPos, botHalfYStart, barrierWidth, botHalfLength
		);
	}

	//////////////////
	//draw the score//
	var score = Math.floor(pos[0]/barriersEveryXUnits); //super easy!
	ctx.fillStyle = 'white';
	ctx.font = 'bold 48px Arial';
	ctx.fillText('Score: '+score, canvas.width-250, canvas.height-50);
	
	/////////////////
	//call next one//
	if (isRunning) { //only if the game is running!
		var timeTaken = currentTimeMillis() - startTime;
		if (timeTaken > MS_PER_FRAME) {
			updateCanvas();
		} else {
			setTimeout(function(){updateCanvas();}, MS_PER_FRAME - timeTaken);
		}
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

function inRange(n, range) {
	return n >= range[0] && n <= range[1];
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