/******************\
|  Flappy Circle   |
| @author Anthony  |
| @version 1.1     |
| @date 2014/02/19 |
| @edit 2014/02/20 |
\******************/

/**********
 * config */
var drawEvery = 1;
var prefDimensions = [800, 600];
var frameRate = 30;

var flappyCircleRadius = 15; //in px
var barrierOpeningSpace = 0.3; //space of each opening as a percent
var barrierOpeningRange = [0.05, 0.95]; //range of the vertical pos of the space
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
var LOSE_TXT = ['        Score: ', 'Press to try again!'];

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
var currentScreen; //0 is home, 1 is game, 2 is lose
var clickingEnabled; //to fix accidentally exiting the lose screen
var currentScore;

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
	clickingEnabled = true;

	///////////////////////
	//draw the homescreen//
	drawHomeScreen();

	//////////////////////////
	//attach event listeners//
	canvas.addEventListener('CanvasResize', function() {
		canvas.height = document.documentElement.clientHeight-5;
		if (!isRunning) { //if the game isn't running
			switch (currentScreen) {
				case 0: drawHomeScreen(); break;
				case 2: drawLoseScreen(currentScore); break;
			}
		}
	}); //forcing the canvas's height to the full size of the screen, the 5 is fudge

	function onPress(e) {
		if (clickingEnabled) {
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
				currentScore = 0;

				/////////////////////
				//generate barriers//
				barriers = []; //[[x position, fraction up on the page] ... []]
				var barriersUntil = 2*(xrange[1]-xrange[0]); //starting barriers
				for (var ai = barriersEveryXUnits; ai < barriersUntil; 
					 ai+=barriersEveryXUnits) {
					var vertDisp = getRandReal(
						barrierOpeningRange[0], barrierOpeningRange[1]
					);
					barriers.push([ai, vertDisp]);
				}

				currentScreen = 1; //game screen
				updateCanvas();
			}
		} else {
			clickingEnabled = true; //so the next click will enter the above if
		}
	}
	canvas.addEventListener('click', onPress);
	canvas.addEventListener('touchstart', onPress);
}

function drawHomeScreen() {
	currentScreen = 0; //home screen
	drawBackground('#7DC7F5', '#62D162');
	ctx.fillStyle = 'black';
	ctx.font = 'bold 72px Arial';
	var FUDGES = [230, 30, 70];
	for (var ai = 0; ai < WELCOME_TXT.length; ai++) {
		ctx.fillText(
			WELCOME_TXT[ai], 
			canvas.width/2 - FUDGES[0], 
			canvas.height/2 - FUDGES[1] + ai*FUDGES[2]
		);
	}
}

function drawLoseScreen(score) {
	currentScreen = 2; //lose screen
	drawBackground('#B50000', 'black');
	ctx.fillStyle = 'white';
	ctx.font = 'bold 72px Arial';
	var FUDGES = [300, 30, 70];
	for (var ai = 0; ai < LOSE_TXT.length; ai++) {
		ctx.fillText(
			(ai === 0) ? LOSE_TXT[ai]+score : LOSE_TXT[ai], 
			canvas.width/2 - FUDGES[0], 
			canvas.height/2 - FUDGES[1] + ai*FUDGES[2]
		);
	}
}

function updateCanvas() {
	var startTime = currentTimeMillis();
	updateCtr += 1;
	if (updateCtr%drawEvery == 0) drawBackground('#7DC7F5', '#62D162');

	///////////////////////////
	//add and remove barriers//
	//there aren't any barriers or Flappy Circle is approaching the final barrier
	var lastBarrier = barriers[barriers.length-1];
	if (lastBarrier[0] - xrange[1] < 2*(xrange[1] - xrange[0])) { //two windows away
		var xPos = lastBarrier[0]+barriersEveryXUnits;
		var vertDisp = getRandReal(
			barrierOpeningRange[0], barrierOpeningRange[1]
		);
		barriers.push([xPos, vertDisp]);
	}
	for (var ai = 0; ai < barriers.length; ai++) {
		if (barriers[ai][0] < xrange[0]-(xrange[1]-xrange[0])) { //too far left
			barriers.splice(ai, 1); //then remove it
		}
	}

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
	currentScore = Math.floor(pos[0]/barriersEveryXUnits); //flappy circle's score

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
		if (inRange(canvasX, [topCornerXPos-flappyCircleRadius, 
							  topCornerXPos+100+flappyCircleRadius])) {
			//and it's within the y ranges of either the top or the bottom
			if (inRange(canvasY, [-flappyCircleRadius, 
								  topHalfLength+flappyCircleRadius]) ||
				inRange(canvasY, [botHalfYStart-flappyCircleRadius, 
								  canvas.height+flappyCircleRadius])) {
				collision = true;
			}
		}
		if (collision) {
			isRunning = false; //they lost
			clickingEnabled = false; //prevent rapid lose screen exiting
			//so their most recently earned point is invalid
			currentScore -= currentScore === 0 ? 0 : 1; //can't get a negative score
			drawLoseScreen(currentScore);
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
	ctx.fillStyle = 'white';
	ctx.font = 'bold 48px Arial';
	ctx.fillText('Score: '+currentScore, canvas.width-250, canvas.height-50);
	
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

function drawBackground(sky, land) {
	ctx.fillStyle = sky;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = land;
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

function inRange(n, range) { //within fudge of either boundary
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