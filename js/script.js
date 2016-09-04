$(document).ready(function($) {

	var onFlip = new Event("flip");

	////////////////////////////////////////////////////////
	///////////////////// CANVAS OBJ ///////////////////////
	////////////////////////////////////////////////////////

	var canvas = {
			canvas: document.getElementById("confettiCanvas"),
			cardElems: document.querySelectorAll(".card"),
			cardHeight: $(".card").height(),
			cardHover: false,
			cardUrl: undefined,
			cardCoords: [],
			cardIndex: undefined,
			confetti: true,
			setSize: function(){
				console.log("setSize");
				canvas.canvas.style.height = canvas.canvas.parentElement.style.clientHeight;
				canvas.canvas.style.width = canvas.canvas.parentElement.style.clientWidth;
			},
			insert: function(){ 
				console.log("insert");
				$("section").find(".profile-photos").append('<canvas id="confettiCanvas"></canvas>') 
			},
			flipCoords: function (){
				// Get Flip Card Coords
				console.log("flipCoords");
				for (var len = canvas.cardElems.length - 1, i = 0; i < len; i++) {

					var thisCard = canvas.cardElems[i],
						rect = thisCard.getBoundingClientRect(),
						x = rect.left,
						y = rect.top;

					canvas.cardCoords.push([x,y]);
				}

				return canvas.cardCoords;
			},
			flipListeners: function(array, event){
				console.log("flipListeners");
				for (var i = array.length - 1; i > 0; i--) {
					document.addEventListener("mousemove", function(e){
						console.log(e.clientX, e.clientY);
						console.log(e.clientX >= array[i][0], e.clientX <= array[i][0] + canvas.cardHeight, e.clientY >= array[i][1], e.clientY <= array[i][1] + canvas.cardHeight);
						if (e.clientX >= array[i][0] &&
							e.clientX <= (array[i][0] + canvas.cardHeight) &&
							e.clientY >= array[i][1] &&
							e.clientY <= (array[i][1] + canvas.cardHeight)){
							canvas.flipCard(i);
							canvas.cardHover = true;
							document.body.style.cursor = "pointer";
							canvas.cardIndex = i;
							console.log(canvas.cardCoords[i][0],canvas.cardCoords[i][1]);
							window.dispatchEvent(onFlip);
							if (canvas.confetti) {
								confettiCannon.handleMouseup(e);
								canvas.confetti = false;
							}
						} else {
							var thisCard = $(".card").eq(i); 
							if (thisCard.hasClass("m-flipped")) {
								canvas.cardHover = false;
								document.body.style.cursor = "default";
								thisCard.removeClass("m-flipped").addClass("m-not-flipped");
								TweenLite.to(thisCard, 0.5, {rotationY: 0});
								thisCard.find("button").removeClass("slideRight-canvasHover");
								canvas.confetti = true;
							}
						}
					});
				}
				
			},
			buttonListeners: function(){
				console.log("buttonListeners");

			},
			flipCard: function(i){
				console.log("flipCard");
				var thisCard = $(".card").eq(i); 
				thisCard.removeClass("m-not-flipped").addClass("m-flipped");
				TweenLite.to(thisCard, 0.5, {rotationY: -180});
				setTimeout(function(){
					window.dispatchEvent(onFlip);
					thisCard.find("button").addClass("slideRight-canvasHover");
				}, 500);
			}
	}


	////////////////////////////////////////////////////////
	///////////////////// FUNCTIONS ////////////////////////
	////////////////////////////////////////////////////////

	// utilities
	function getLength(x0, y0, x1, y1) {
	    // returns the length of a line segment
	    const x = x1 - x0;
	    const y = y1 - y0;
	    return Math.sqrt(x * x + y * y);
	}

	function getDegAngle(x0, y0, x1, y1) {
	    const y = y1 - y0;
	    const x = x1 - x0;
	    return Math.atan2(y, x) * (180 / Math.PI);
	}

	// some constants
	const DECAY = 4;        // confetti decay in seconds
	const SPREAD = 60;      // degrees to spread from the angle of the cannon
	const GRAVITY = 1200;

	var confettiCannon = {
	    constructor: function() {
	        // setup a canvas
	        confettiCannon.canvas = document.getElementById('confettiCanvas');
	        confettiCannon.dpr = window.devicePixelRatio || 1;
	        confettiCannon.ctx = confettiCannon.canvas.getContext('2d');
	        confettiCannon.ctx.scale(confettiCannon.dpr, confettiCannon.dpr);

	        // add confetti here
	        confettiCannon.confettiSpriteIds = [];
	        confettiCannon.confettiSprites = {};
	        
	        // vector line representing the firing angle
	        confettiCannon.drawVector = false;
	        confettiCannon.vector = [{
	            x: window.innerWidth, 
	            y: window.innerHeight * 1.25,
	        }, {
	            x: window.innerWidth, 
	            y: window.innerHeight * 2,
	        }];
	        
	        confettiCannon.pointer = {};
	        
	        // bind methods
	        confettiCannon.render = confettiCannon.render.bind(confettiCannon);
	        // confettiCannon.handleMousedown = confettiCannon.handleMousedown.bind(confettiCannon);
	        confettiCannon.handleMouseup = confettiCannon.handleMouseup.bind(confettiCannon);
	        // confettiCannon.handleMousemove = confettiCannon.handleMousemove.bind(confettiCannon);
	        // confettiCannon.handleTouchstart = confettiCannon.handleTouchstart.bind(confettiCannon);
	        // confettiCannon.handleTouchmove = confettiCannon.handleTouchmove.bind(confettiCannon);
	        confettiCannon.setCanvasSize = confettiCannon.setCanvasSize.bind(confettiCannon);
	        
	        confettiCannon.setupListeners();
	        confettiCannon.setCanvasSize();
	        
	        // fire off for a demo
	        confettiCannon.timer = setTimeout(confettiCannon.handleMouseup, 1000);
	    },
	    
	    setupListeners: function() {
	        // Use TweenLite tick event for the render loop
	        TweenLite.ticker.addEventListener('tick', confettiCannon.render);
	        
	        // bind events
	        window.addEventListener('mousedown', confettiCannon.handleMousedown);
	        window.addEventListener('mouseup', confettiCannon.handleMouseup);
	        window.addEventListener('mousemove', confettiCannon.handleMousemove);
	        window.addEventListener('touchstart', confettiCannon.handleTouchstart);
	        window.addEventListener('touchend', confettiCannon.handleMouseup);
	        window.addEventListener('touchmove', confettiCannon.handleTouchmove);
	        window.addEventListener('resize', confettiCannon.setCanvasSize);
	        // custom event
	        window.addEventListener("flip", confettiCannon.handleMouseup(event));
	    },

	    setCanvasSize: function() {
	        confettiCannon.canvas.width = window.innerWidth * confettiCannon.dpr;
	        confettiCannon.canvas.height = window.innerHeight * confettiCannon.dpr;
	        confettiCannon.canvas.style.width = window.innerWidth + 'px';
	        confettiCannon.canvas.style.height = window.innerHeight + 'px';
	    },
	    
	    // handleMousedown: function(event) {
	    //     clearTimeout(confettiCannon.timer);
	    //     const x = event.clientX * confettiCannon.dpr;
	    //     const y = event.clientY * confettiCannon.dpr;
	        
	    //     confettiCannon.vector[0] = {
	    //         x,
	    //         y,
	    //     };
	    //     confettiCannon.drawVector = true;
	    // },
	    
	    // handleTouchstart: function(event) {
	    //     clearTimeout(confettiCannon.timer);
	    //     event.preventDefault();
	    //     const x = event.touches[0].clientX * confettiCannon.dpr;
	    //     const y = event.touches[0].clientY * confettiCannon.dpr;
	    //     confettiCannon.vector[0] = {
	    //         x,
	    //         y,
	    //     };
	        
	    //     confettiCannon.drawVector = true;
	    // },
	    
	    handleMouseup: function(event) {
	    	console.log("handleMouseup");
	    	console.log(event.clientX);
	        confettiCannon.drawVector = false;
	        
	        // const x0 = confettiCannon.vector[0].x;
	        // const y0 = confettiCannon.vector[0].y;
	        // const x1 = confettiCannon.vector[1].x;
	        // const y1 = confettiCannon.vector[1].y;
	        
	        const length = 120;
	        const angle = 180;

	        const particles = 200;
	        const velocity = length * 10;
	        confettiCannon.addConfettiParticles(particles, angle, velocity, event.clientX-(canvas.cardHeight*0.5), event.clientY-(canvas.cardHeight));
	    },
	    
	    // handleMousemove: function(event) {
	    //     const x = event.clientX * confettiCannon.dpr;
	    //     const y = event.clientY * confettiCannon.dpr;   
	    //     confettiCannon.vector[1] = {
	    //         x,
	    //         y,
	    //     };
	    //     confettiCannon.pointer = confettiCannon.vector[1];
	    // },
	    
	    // handleTouchmove: function(event) {
	    //     event.preventDefault();
	    //     const x = event.changedTouches[0].clientX * confettiCannon.dpr;
	    //     const y = event.changedTouches[0].clientY * confettiCannon.dpr;   
	    //     confettiCannon.vector[1] = {
	    //         x,
	    //         y,
	    //     };
	    //     confettiCannon.pointer = confettiCannon.vector[1];
	    // },
	    
	    // drawVectorLine: function(event) {
	    //     confettiCannon.ctx.strokeStyle = 'pink';
	    //     confettiCannon.ctx.lineWidth = 2 * confettiCannon.dpr;
	        
	    //     const x0 = confettiCannon.vector[0].x;
	    //     const y0 = confettiCannon.vector[0].y;
	    //     const x1 = confettiCannon.vector[1].x;
	    //     const y1 = confettiCannon.vector[1].y;
	        
	    //     confettiCannon.ctx.beginPath();
	    //     confettiCannon.ctx.moveTo(x0, y0);
	    //     confettiCannon.ctx.lineTo(x1, y1);
	    //     confettiCannon.ctx.stroke();
	    // },

	    addConfettiParticles: function(amount, angle, velocity, x, y) {
	    	console.log("addConfettiParticles");
	        let i = 0;
	        while (i < amount) {
	            // sprite
	            const r = _.random(4, 6) * confettiCannon.dpr;
	            const d = _.random(15, 25) * confettiCannon.dpr;
	            
	            const cr = _.random(30, 255);
	            const cg = _.random(30, 230);
	            const cb = _.random(30, 230);
	            const color = `rgb(${cr}, ${cg}, ${cb})`;
	            
	            const tilt = _.random(10, -10);
	            const tiltAngleIncremental = _.random(0.07, 0.05);
	            const tiltAngle = 0;

	            const id = _.uniqueId();
	            const sprite = {
	                [id]: {
	                    angle,
	                    velocity,
	                    x,
	                    y,
	                    r,
	                    d,
	                    color,
	                    tilt,
	                    tiltAngleIncremental,
	                    tiltAngle,
	                },
	            };

	            console.log(confettiCannon.confettiSprites, sprite);
	            Object.assign(confettiCannon.confettiSprites, sprite);
	            confettiCannon.confettiSpriteIds.push(id);
	            confettiCannon.tweenConfettiParticle(id);
	            i++;
	        }
	    },

	    tweenConfettiParticle: function(id) {
	    	console.log("tweenConfettiParticle");
	        const minAngle = confettiCannon.confettiSprites[id].angle - SPREAD / 2;
	        const maxAngle = confettiCannon.confettiSprites[id].angle + SPREAD / 2;
	        
	        const minVelocity = confettiCannon.confettiSprites[id].velocity / 4;
	        const maxVelocity = confettiCannon.confettiSprites[id].velocity;

	        // Physics Props
	        const velocity = _.random(minVelocity, maxVelocity);
	        const angle = _.random(minAngle, maxAngle);
	        const gravity = GRAVITY;
	        const friction = _.random(0.1, 0.25);
	        const d = 0;

	        TweenLite.to(confettiCannon.confettiSprites[id], DECAY, {
	            physics2D: {
	                velocity,
	                angle,
	                gravity,
	                friction,
	            },
	            d,
	            ease: Power4.easeIn,
	            onComplete: () => {
	                // remove confetti sprite and id
	                _.pull(confettiCannon.confettiSpriteIds, id);
	                delete confettiCannon.confettiSprites[id];
	            },
	        });
	    },

	    updateConfettiParticle: function(id) {
	    	console.log("updateConfettiParticle");
	        const sprite = confettiCannon.confettiSprites[id];
	        
	        const tiltAngle = 0.0005 * sprite.d;
	        
	        sprite.angle += 0.01;
	        sprite.tiltAngle += tiltAngle;
	        sprite.tiltAngle += sprite.tiltAngleIncremental;
	        sprite.tilt = (Math.sin(sprite.tiltAngle - (sprite.r / 2))) * sprite.r * 2;
	        sprite.y += Math.sin(sprite.angle + sprite.r / 2) * 2;
	        sprite.x += Math.cos(sprite.angle) / 2;
	    },

	    drawConfetti: function() {
	    	console.log("drawConfetti");
	        confettiCannon.confettiSpriteIds.map(id => {
	            const sprite = confettiCannon.confettiSprites[id];
	            
	            confettiCannon.ctx.beginPath();
	            confettiCannon.ctx.lineWidth = sprite.d / 2;
	            confettiCannon.ctx.strokeStyle = sprite.color;
	            confettiCannon.ctx.moveTo(sprite.x + sprite.tilt + sprite.r, sprite.y);
	            confettiCannon.ctx.lineTo(sprite.x + sprite.tilt, sprite.y + sprite.tilt + sprite.r);
	            confettiCannon.ctx.stroke();

	            confettiCannon.updateConfettiParticle(id);
	        });
	    },
	    
	    // drawPointer: function() {
	    // 	console.log("drawPointer");
	    //     const centerX = confettiCannon.pointer.x;
	    //     const centerY = confettiCannon.pointer.y;
	    //     const radius = 15 * confettiCannon.dpr;

	    //     confettiCannon.ctx.beginPath();
	    //     confettiCannon.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	    //     confettiCannon.ctx.fillStyle = 'transparent';
	    //     confettiCannon.ctx.fill();
	    //     confettiCannon.ctx.lineWidth = 2 * confettiCannon.dpr;
	    //     confettiCannon.ctx.strokeStyle = '#ffffff';
	    //     confettiCannon.ctx.stroke();
	    // },
	    
	    // drawPower: function() {
	    // 	console.log("drawPower");
	    //     const x0 = confettiCannon.vector[0].x;
	    //     const y0 = confettiCannon.vector[0].y;
	    //     const x1 = confettiCannon.vector[1].x;
	    //     const y1 = confettiCannon.vector[1].y;
	        
	    //     const length = getLength(x0, y0, x1, y1);
	    //     const centerX = x0;
	    //     const centerY = y0;
	    //     const radius = 1 * confettiCannon.dpr * length / 20;

	    //     confettiCannon.ctx.beginPath();
	    //     confettiCannon.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
	    //     confettiCannon.ctx.fillStyle = 'transparent';
	    //     confettiCannon.ctx.fill();
	    //     confettiCannon.ctx.lineWidth = 2 * confettiCannon.dpr;
	    //     confettiCannon.ctx.strokeStyle = '#333333';
	    //     confettiCannon.ctx.stroke();
	    // },

	    render: function() {
	   		// console.log("render");
	        confettiCannon.ctx.clearRect(0, 0, confettiCannon.canvas.width, confettiCannon.canvas.height);
	        
	        // only draw the vector when the drawVector flag is on
	        // confettiCannon.drawVector && confettiCannon.drawVectorLine();
	        // confettiCannon.drawVector && confettiCannon.drawPower();
	        
	        // confettiCannon.drawPointer();
	        confettiCannon.drawConfetti();
	    }
	}

	// const confetti = new ConfettiCannon();



	////////////////////////////////////////////////////////
	//////////////////// RUNTIME EXEC //////////////////////
	////////////////////////////////////////////////////////
	$(".card").flip({
		trigger: "hover"
	});
	// canvas.insert();
	canvas.setSize();
	console.log(canvas.flipCoords());
	canvas.flipListeners(canvas.flipCoords(), event);
	confettiCannon.constructor();
	confettiCannon.setupListeners();
	confettiCannon.render();
	// console.log(canvas.flipCoords());

	// confettiCannon.setup();
	// confettiCannon.render();


});