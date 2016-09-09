/* Animation settings. */
var DECAY = 3; // Confetti decay in seconds
var SPREAD = 100; // Degrees to spread from the angle of the cannon
var GRAVITY = 1200;

function confettiEffect() {
    /* Canvas. */
    this.canvas = $( "#confetti" );
    this.canvasWidth = this.canvas.outerWidth();
    this.canvasHeight = this.canvas.outerHeight();

    /* Canvas context. */
    this.dpr = window.devicePixelRatio || 1;
    this.ctx = this.canvas.get( 0 ).getContext( "2d" );

    this.ctx.scale( this.dpr, this.dpr );

    // Sprite data structure.
    this.confettiSpriteIds = [];
    this.confettiSprites = {};

    /* Effect settings. */
    this.settings = {
        length: 120,
        angle: -90,
        particles: 100,
        velocity: 120 * 10
    }

    /* Cards and buttons. */
    this.cards = [];
    this.buttons = [];

    /* 
     * We toggle this on temporarily when we're flipping a card,
     * It is toggled off later to allow for button clicking.
     * This is to solve a problem where if we click on mobile right on
     * top of where the button is, the modal is opened as well.
     */

    this.flipping = false;

    this.cardsContainer = $( ".profile-photos" );

    this.init();

    $( document ).mousemove( _.bind( this.hoverEventHandler, this ) );
    
    /** 
     * If the viewport resolution is changed, everything changes.
     * So we need to recalculate card bounding boxes.
     */
    $( window ).resize( _.bind( this.init, this ) );

    this.canvas.on( "click", _.bind( this.clickEventHandler, this ) );

    this.mousePosition = { x: 0, y: 0 };

    /* We setup a watcher to unflip the cards back. */
    setInterval( _.bind( this.unflipCards, this ), 500 );

    TweenLite.ticker.addEventListener( "tick", _.bind( this.render, this ) );

    this.render();
}

confettiEffect.prototype.init = function() {
    this.canvasWidth = this.canvas.outerWidth();
    this.canvasHeight = this.canvas.outerHeight();

    this.canvas.attr( "width", this.canvasWidth );
    this.canvas.attr( "height", this.canvasHeight );

    var cards = $( ".card", this.cardsContainer ),
        i = 0, L = cards.length, card = null, offset = null,
        button = null, buttonOffset = null;

    this.cards = [];
    this.buttons = [];

    for( ; i < L; ++i ) {
        card = $( cards[ i ] );
        offset = card.offset();

        /* Cache buttons for click processing. */
        button = $( ".btn-info", card );
        button = {
            $el: button,
        };

        this.buttons.push( button );

        button.card = this.cards.push({
            $el: card,
            x: offset.left,
            y: offset.top,
            deltaX: offset.left + card.outerWidth(),
            deltaY: offset.top + card.outerHeight(),
            flipped: false,
            button: button
        });
    }
};

confettiEffect.prototype.unflipCards = function() {
    // console.log( "Refreshing cards..." );
    var cards = this.cards,
        i = 0, L = cards.length, card = null
        mouse = this.mousePosition;

    for( ; i < L; ++i ) {
        card = cards[ i ];

        if( ( mouse.x < card.x || mouse.x > card.deltaX || mouse.y < card.y || mouse.y > card.deltaY ) && card.flipped ) {
            card.$el.trigger( "click" );
            card.flipped = false;
        }
    }
}

confettiEffect.prototype.hoverEventHandler = function( event ) {
    var mouseX = event.pageX, mouseY = event.pageY,
        cards = this.cards,
        i = 0, L = cards.length, card = null,
        button = null, buttonOffset = null, self = this;

    this.mousePosition = { x: mouseX, y: mouseY };

    for( ; i < L; ++i ) {
        card = cards[ i ];
        button = card.button;

        if( mouseX > card.x && mouseX < card.deltaX && mouseY > card.y && mouseY < card.deltaY && !card.flipped ) {
            // console.log( "Mouse X: " + mouseX + "\nCard X: " + card.x + "\n Card AfterX: " + 
            // ( card.x + card.width ) + "\nMouse Y: " + mouseY + "\nCard Y: " + card.y + "\n Card AfterY: " + ( card.y + card.height ) )
            card.$el.trigger( "click" );
            card.flipped = true;

            this.flipping = true;
            /* Fire confetti in the center of the card. */
            this.fire( ( card.x + card.deltaX ) / 2, ( card.y + card.deltaY ) / 2 );

            setTimeout( function() {
                self.flipping = false;
            }, 1000 )
        }

        /* Recalculating button bounding box. */
        buttonOffset = button.$el.offset();

        button.x      = buttonOffset.left;
        button.y      = buttonOffset.top;
        button.deltaX =  buttonOffset.left + button.$el.outerWidth();
        button.deltaY = buttonOffset.top + button.$el.outerHeight();

        if( mouseX > button.x && mouseX < button.deltaX && mouseY > button.y && mouseY < button.deltaY ) {
            button.$el.addClass( "hover" );
            document.body.style.cursor = "pointer";

        } else if( button.$el.hasClass( "hover" ) ) {
            button.$el.removeClass( "hover" );
            document.body.style.cursor = "default";
        }
    }
}

confettiEffect.prototype.clickEventHandler = function( event ) {
    var mouseX = event.pageX, mouseY = event.pageY,
        buttons = this.buttons,
        i = 0, L = buttons.length, button = null;

    if( this.flipping )
        return;

    for( ; i < L; ++i ) {
        button = buttons[ i ];

        if( mouseX > button.x && mouseX < button.deltaX && mouseY > button.y && mouseY < button.deltaY )
            button.$el.trigger( "click" );
    }
}

confettiEffect.prototype.fire = function( x, y ) {

    /* Calculating coordinates within the canvas. */
    var canvasOffset = this.canvas.offset();
    x = x - canvasOffset.left;
    y = y - canvasOffset.top;

    // console.log( "Firing confetti... at: ( " + x + ", " + y + " )" );

    var settings = this.settings,
        amount = settings.particles, angle = settings.angle,
        velocity = settings.velocity, i = 0;

    while ( i < amount ) {
        // sprite
        var r = _.random( 4, 6 ) * this.dpr;
        var d = _.random( 15, 25 ) * this.dpr;
        
        var cr = _.random( 30, 255 );
        var cg = _.random( 30, 230 );
        var cb = _.random( 30, 230 );
        var color = "rgb(" + cr + "," + cg + "," + cb + ")";
        
        var tilt = _.random( 10, -10 );
        var tiltAngleIncremental = _.random( 0.07, 0.05 );
        var tiltAngle = 0;

        var id = _.uniqueId();

        var sprite = {
            angle: angle,
            velocity: velocity,
            x: x,
            y: y,
            r: r,
            d: d,
            color: color,
            tilt: tilt,
            tiltAngleIncremental: tiltAngleIncremental,
            tiltAngle: tiltAngle,
        };

        this.confettiSprites[ id ] = sprite;
        this.confettiSpriteIds.push( id );
        
        this.tweenParticle( id );

        i++;
    }
};

confettiEffect.prototype.tweenParticle = function( id ) {
    var sprite = this.confettiSprites[ id ];

    // console.log("tweenConfettiParticle");
    var minAngle = sprite.angle - SPREAD / 2;
    var maxAngle = sprite.angle + SPREAD / 2;
    
    var minVelocity = sprite.velocity / 4;
    var maxVelocity = sprite.velocity;

    // Physics Props
    var velocity = _.random( minVelocity, maxVelocity );
    var angle = _.random( minAngle, maxAngle );
    var gravity = GRAVITY;
    var friction = _.random( 0.1, 0.25 );
    var d = 0;

    var self = this;

    TweenLite.to( sprite, DECAY, {
        physics2D: {
            velocity: velocity,
            angle: angle,
            gravity: gravity,
            friction: friction,
        },
        d: d,
        ease: Power4.easeIn,
        onComplete: function(){
            // remove confetti sprite and id
            _.pull( self.confettiSpriteIds, id );
            delete self.confettiSprites[ id ];
        },
    });
},

confettiEffect.prototype.updateConfettiParticle = function( id ) {
    var sprite = this.confettiSprites[ id ];
    
    var tiltAngle = 0.0005 * sprite.d;
    
    sprite.angle += 0.01;
    sprite.tiltAngle += tiltAngle;
    sprite.tiltAngle += sprite.tiltAngleIncremental;
    sprite.tilt = ( Math.sin( sprite.tiltAngle - (sprite.r / 2 ) ) ) * sprite.r * 2;
    sprite.y += Math.sin( sprite.angle + sprite.r / 2 ) * 2;
    sprite.x += Math.cos( sprite.angle ) / 2;
};

confettiEffect.prototype.drawConfetti = function() {
    var self = this,
        ctx = this.ctx;

    this.confettiSpriteIds.map( function( id ) {
        var sprite = self.confettiSprites[ id ];

        ctx.beginPath();
        ctx.lineWidth = sprite.d / 2;
        ctx.strokeStyle = sprite.color;
        ctx.moveTo( sprite.x + sprite.tilt + sprite.r, sprite.y );
        ctx.lineTo( sprite.x + sprite.tilt, sprite.y + sprite.tilt + sprite.r );
        ctx.stroke();

        self.updateConfettiParticle( id );
    });
};

confettiEffect.prototype.render = function() {
    this.ctx.clearRect( 0, 0, this.canvasWidth, this.canvasHeight );
    this.drawConfetti();
};

$( document ).ready( function( $ ) {
    /* Activate card flipping. */
    $( ".card" ).flip({
        trigger: "click",
    });

    new confettiEffect();
});