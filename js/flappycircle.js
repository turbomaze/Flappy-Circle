/******************\
|  Flappy Circle   |
| @author Anthony  |
| @version 1.1     |
| @date 2014/02/19 |
| @edit 2014/02/21 |
\******************/

/**********
 * config */
var drawEvery = 1;
var frameRate = 30;

var barrierOpeningSpace = 0.3; //space of each opening as a percent
var barriersEveryXUnits = 0.45; //how often a barrier appears
var powerupRate = 0.2; //1 in 10 barriers

var gradualSpeedup = [2E-7, 6E-7, 1E-6]; //gravity, jump, x velocity

/*************
 * constants */
var MS_PER_FRAME = 1000/frameRate;

var INIT_XRANGE = [0, 1];
var INIT_YRANGE = [0, 1];

var INIT_G = 0.003; //units/second
var INIT_JUMP = 0.0375; //units/second
var INIT_X_VEL = 0.012; //units/second

var barrierOpeningRange = [0.05, 0.95]; //range of the vertical pos of the space
var barrierWidth = 0.081; //width of the barriers in units
var coinRadius = 0.04; //in units
var numPowerups = 1;

var flappyCircleRadius = 0.025; //in units
var startPosAsAFraction = [0.05, 0.5]; //constant location of flappy in units
var percentBGLand = 0.3; //how far the land part of the BG extends

var fontSize = 0.08; //as a percent of the screen's height

var WELCOME_TXT = ['Press to begin', 'a new game'];
var LOSE_TXT = ['Score: ', 'Press to try again!'];

/*********************
 * working variables */
var canvas;
var ctx;
var updateCtr;

var xrange;
var yrange;
var pos;

var G;
var JUMP;
var velocity;
var screenVelocity;

var barriers;
var powerups;

var isRunning;
var currentScreen; //0 is home, 1 is game, 2 is lose
var clickingEnabled; //to fix accidentally exiting the lose screen

var currentScore;
var bonusPoints;
var bestScore;

/******************
 * work functions */
function initFlappyCircle() {
	////////////////////////////////
	//initialize working variables//
	canvas = $('#canvas');
	FastClick.attach(canvas);
	ctx = canvas.getContext('2d');
	updateCtr = 0;
	xrange = INIT_XRANGE.slice(0);
	yrange = INIT_YRANGE.slice(0);
	clickingEnabled = true;
	bestScore = 0;

	///////////////////////
	//draw the homescreen//
	drawHomeScreen();

	//////////////////////////
	//attach event listeners//

	canvas.addEventListener('CanvasResize', function() {
		//change the x range to accomodate the change in dimensions
		var u = (canvas.width/canvas.height)*(9/16);
		xrange[1] = xrange[0] + u;
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
					var u = (canvas.width/canvas.height)*(9/16);
					xrange[1] = xrange[0] + u;
				yrange = INIT_YRANGE.slice(0);
				pos = startPosAsAFraction.slice(0);
				G = INIT_G;
				JUMP = INIT_JUMP;
				velocity = [INIT_X_VEL, 0]; //units/second
				screenVelocity = [INIT_X_VEL, 0]; //same
				currentScore = 0;
				bonusPoints = 0;

				/////////////////////
				//generate barriers//
				barriers = []; //[[x position, fraction up on the page] ... []]
				var barriersUntil = Math.max(2*(xrange[1]-xrange[0]), barriersEveryXUnits);
				for (var ai = barriersEveryXUnits; ai <= barriersUntil;
					 ai+=barriersEveryXUnits) {
					var vertDisp = getRandReal(
						barrierOpeningRange[0], barrierOpeningRange[1]
					);
					barriers.push([ai, vertDisp]);
				}
				powerups = []; //remove all the coins

				currentScreen = 1; //game screen
				updateCanvas();
			}
		} else {
			clickingEnabled = true; //so the next click will enter the above if
		}
	}

	canvas.addEventListener('click', function(e) { onPress(e)}, false);
}

function drawHomeScreen() {
	currentScreen = 0; //home screen

	var fontPoints = Math.floor(fontSize*canvas.height);
	drawBackground('#7DC7F5', '#62D162');
	ctx.fillStyle = 'black';
	ctx.font = 'bold '+fontPoints+'px Arial';
	ctx.textAlign = 'center';
	for (var ai = 0; ai < WELCOME_TXT.length; ai++) {
		ctx.fillText(
			WELCOME_TXT[ai], 
			canvas.width/2, 
			canvas.height/2 - fontPoints/2 + ai*fontPoints
		);
	}
}

function drawLoseScreen(score) {
	currentScreen = 2; //lose screen

	var fontPoints = Math.floor(fontSize*canvas.height);
	drawBackground('#B50000', 'black');
	ctx.fillStyle = 'white';
	ctx.font = 'bold '+fontPoints+'px Arial';
	ctx.textAlign = 'center';
	for (var ai = 0; ai < LOSE_TXT.length; ai++) {
		ctx.fillText(
			(ai === 0) ? LOSE_TXT[ai]+score+' ('+bestScore+')' : LOSE_TXT[ai], 
			canvas.width/2, 
			canvas.height/2 - fontPoints/2 + ai*fontPoints
		);
	}
}

function updateCanvas() {
	var startTime = currentTimeMillis();
	updateCtr += 1;
	if (updateCtr%drawEvery == 0) drawBackground('#7DC7F5', '#62D162');

	////////////////////////////////////////////////
	//add barriers/powerups and prune old barriers//
	//there aren't any barriers or Flappy Circle is approaching the final barrier
	var lastBarrier = barriers[barriers.length-1];
	if (lastBarrier[0] - xrange[1] < 2*(xrange[1] - xrange[0])) { //two windows away
		var xPos = lastBarrier[0]+barriersEveryXUnits;
		var vertDisp = getRandReal(
			barrierOpeningRange[0], barrierOpeningRange[1]
		);
		barriers.push([xPos, vertDisp]);
		if (Math.random() < powerupRate) { //add a coin inside this barrier
			var type = getRandNum(0, numPowerups); //the different kinds
			var powerupXPos = xPos + barrierWidth/2; //in the middle, in units
			var dispFromCenter = getRandReal(
				coinRadius-barrierOpeningSpace/2, barrierOpeningSpace/2-coinRadius
			); //units
			powerups.push([type, powerupXPos, vertDisp, dispFromCenter]);
		}
	}
	for (var ai = 0; ai < barriers.length; ai++) {
		if (barriers[ai][0] < xrange[0]-(xrange[1]-xrange[0])) { //too far left
			barriers.splice(ai, 1); //then remove it
		}
	}

	//////////////////////
	//prune old powerups//
	for (var ai = 0; ai < powerups.length; ai++) {
		if (powerups[ai][1] < xrange[0]-(xrange[1]-xrange[0])) { //too far left
			powerups.splice(ai, 1); //then remove it
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
	var flappyCircPxRadius = (flappyCircleRadius/(yrange[1]-yrange[0]))*canvas.height;
	var canvasX = map(
		pos[0], xrange[0], xrange[1], flappyCircPxRadius, canvas.width-flappyCircPxRadius
	);
	var canvasY = map(
		pos[1], yrange[0], yrange[1], canvas.height-flappyCircPxRadius, flappyCircPxRadius
	);
	drawFlappyCircle([canvasX, canvasY], flappyCircPxRadius);
	currentScore = bonusPoints+Math.floor((pos[0]-barrierWidth)/barriersEveryXUnits);

	/////////////////////
	//draw the barriers//
	var collision = false;
	var barrierPixelWidth = (barrierWidth/(xrange[1]-xrange[0]))*canvas.width;
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
		if (inRange(canvasX, [topCornerXPos-flappyCircPxRadius, 
							  topCornerXPos+barrierPixelWidth+flappyCircPxRadius])) {
			//and it's within the y ranges of either the top or the bottom
			if (inRange(canvasY, [-flappyCircPxRadius, 
								  topHalfLength+flappyCircPxRadius]) ||
				inRange(canvasY, [botHalfYStart-flappyCircPxRadius, 
								  canvas.height+flappyCircPxRadius])) {
				collision = true;
				break;
			}
		}

		/////////////////////
		//draw the barriers//
		ctx.fillRect(topCornerXPos, 0, barrierPixelWidth, topHalfLength);
		ctx.fillRect(
			topCornerXPos, botHalfYStart, barrierPixelWidth, botHalfLength
		);
	}

	////////////////////////////////
	//deal with barrier collisions//
	if (collision) {
		isRunning = false; //they lost
		clickingEnabled = false; //prevent rapid lose screen exiting
		if (currentScore > bestScore) bestScore = currentScore;
		drawLoseScreen(currentScore);
		return; //exit the game loop
	}

	/////////////////////
	//draw the powerups//
	var powerupCollision = -1;
	for (var ai = 0; ai < powerups.length; ai++) {
		////////////////////
		//collision checks//
		var coinX = map(
			powerups[ai][1], xrange[0], xrange[1], 0, canvas.width
		);
		var coinY = map(
			powerups[ai][2]+powerups[ai][3], yrange[0], yrange[1], canvas.height, 0
		);
		var coinOuterRadius = (coinRadius/(yrange[1]-yrange[0]))*canvas.height;
		if (dist([canvasX, canvasY], [coinX, coinY]) < flappyCircPxRadius+coinOuterRadius) {
			powerupCollision = powerups[ai][0];
			powerups.splice(ai, 1);
			break;
		}

		//draw the coin
		drawCoin(powerups[ai][0], [coinX, coinY]);
	}

	////////////////////////////////
	//deal with powerup collisions//
	if (powerupCollision > -1) {
		switch (powerupCollision) {
			case 0: //extra point
				bonusPoints += 1;
				break;
			case 1: //temporary invincibility
				break;
			case 2: //larger gaps
				break;
		}
	}

	//////////////////
	//draw the score//
	var fontPoints = Math.floor(0.75*fontSize*canvas.height); //75% the normal size
	ctx.fillStyle = 'white';
	ctx.font = 'bold '+fontPoints+'px Arial';
	ctx.textAlign = 'end';
	ctx.fillText('Score: '+currentScore, canvas.width-10, canvas.height-15);

	///////////////////////////////
	//make it a little bit harder//
	G += gradualSpeedup[0];
	JUMP += gradualSpeedup[1];
	velocity[0] += gradualSpeedup[2];
	screenVelocity[0] += gradualSpeedup[2];
	
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
function drawCoin(type, pos) {
	var colors  = ['black', 'gray'];
	switch (type) {
		case 0: colors = ['#184DED', '#8CA2E6']; break;
		case 1: colors = ['#A80F68', '#EB83C0']; break;
		case 2: colors = ['#FFBB00', '#F5DA90']; break;
	}
	var outerRadius = (coinRadius/(yrange[1]-yrange[0]))*canvas.height;
	var innerRadius = outerRadius - 5; //5 pixel border looks nice
	drawPoint([pos[0], pos[1]], outerRadius, colors[0]);
	drawPoint([pos[0], pos[1]], innerRadius, colors[1]);
}

function drawFlappyCircle(pos, r) {
	drawPoint(pos, r, 'maroon');
}

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
	if (r1 < r2) {
		if (raw < r1) return r1;
		else if (raw > r2) return r2;
	} else {
		if (raw > r1) return r1;
		else if (raw < r2) return r2;
	}
	return raw;
}

//given an n in [d1, d2], return a linearly related number in [r1, r2]
function map(n, d1, d2, r1, r2) {
	var Rd = d2-d1;
	var Rr = r2-r1;
	return (Rr/Rd)*(n - d1) + r1;
}

function dist(a, b) {
	return Math.sqrt(Math.pow(a[0]-b[0], 2) + Math.pow(a[1]-b[1], 2));
}

/***********
 * objects */
window.addEventListener('load', function() {
	initFlappyCircle();
});
