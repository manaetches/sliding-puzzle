/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2016 Photon Storm Ltd.
 * @license      You are permitted to use this code in your own commercial games, including 
 *               games sold to clients, publishers, games portals or sponsors.
 *               It may not be distributed anywhere in source code form. Including printed in a
 *               book, sold as a 'template', or uploaded to a public service such as GitHub.
 */

/**
 * Phaser Games Pack 1 - Sliding Puzzle Game Template
 * --------------------------------------------------
 *
 * This is the classic Sliding Puzzle game. Unlike lots of implementations out there,
 * we don't use a 'random' starting layout, as otherwise the puzzle will be unsolvable
 * 50% of the time. Instead we use a puzzle walker function. This allows you to see
 * the puzzle before-hand, and then it gets all manged up, ready for you to solve.
 *
 * You can control the number of iterations, or steps, that the walker goes through.
 * You can of course provide any image you like to the puzzle, and it'll adapt and resize
 * without changing much.
 *
 * In this example template there are 3 pictures, and as you solve them, the walker
 * increases in complexity each time, making it harder to solve.
 *
 * This web site has some create tips on solving Sliding Puzzles:
 * http://www.nordinho.net/vbull/blogs/lunanik/6131-slider-puzzles-solved-once-all.html
 * 
 * The sliding puzzle images are promotional images from the game League of Legends,
 * so don't use them in your own game!
 */

var SlidingPuzzle = {
    ALLOW_CLICK: 0,
    TWEENING: 1
};

SlidingPuzzle.Game = function (game) {

    //  These are all set in the startPuzzle function
    this.rows = 0;
    this.columns = 0;

    //  The width and height of each piece in the puzzle.
    //  Again, this is set automatically in startPuzzle.
    this.pieceWidth = 0;
    this.pieceHeight = 0;

    this.pieces = null;
    this.spacer = null;

    //  The speed at which the pieces slide, and the tween they use
    this.slideSpeed = 250;
    this.slideEase = 'Sine';

    //  The number of iterations the puzzle walker will go through when
    //  scrambling up the puzzle. 10 is a nice and easy puzzle, but
    //  push it higher for much harder ones.
    this.iterations = 10;

    //  The speed at which the pieces are shuffled at the start. This allows
    //  the player to see the puzzle before trying to solve it. However if
    //  you don't want this, just set the speed to zero and it'll appear
    //  instantly 'scrambled'.
    this.shuffleSpeed = 80;
    this.shuffleEase = 'Linear';

    this.lastMove = null;

    //  The image in the Cache to be used for the puzzle.
    //  Set in the startPuzzle function.
    this.photo = '';
    
    this.action = SlidingPuzzle.ALLOW_CLICK;

};

SlidingPuzzle.Game.prototype = {

    preload: function () {

        this.load.path = 'assets/';

        this.load.images([ 'photo1', 'photo2', 'photo3' ]);

    },

    /**
     * A simple background color, and then the puzzle is created in startPuzzle.
     */
    create: function () {

        this.stage.backgroundColor = '#002157';

        this.startPuzzle('photo1', 3, 3);

    },

    /**
     * This function is responsible for building the puzzle.
     * It takes an Image key and a width and height of the puzzle (in pieces, not pixels).
     * Read the comments within this function to find out what happens.
     */
    startPuzzle: function (key, rows, columns) {

        this.photo = key;

        //  The size if the puzzle, in pieces (not pixels)
        this.rows = rows;
        this.columns = columns;

        //  The size of the source image
        var photoWidth = this.cache.getImage(key).width;
        var photoHeight = this.cache.getImage(key).height;

        //  Create our sliding pieces

        //  Each piece will be this size:
        this.pieceWidth = Math.floor(photoWidth / this.rows);
        this.pieceHeight = Math.floor(photoHeight / this.columns);

        //  A Group to put the pieces in
        if (this.pieces)
        {
            //  Group already exists? Destroy the contents
            this.pieces.destroy(true, true);
        }
        else
        {
            this.pieces = this.add.group();
        }

        //  Center the Group
        this.pieces.x = Math.floor((this.game.width - photoWidth) / 2);
        this.pieces.y = Math.floor((this.game.height - photoHeight) / 2);

        //  Loop through the image and create a new Sprite for each piece of the puzzle.
        for (var y = 0; y < this.columns; y++)
        {
            for (var x = 0; x < this.rows; x++)
            {
                var piece = this.pieces.create(x * this.pieceWidth, y * this.pieceHeight, key);

                //  The current row and column of the piece
                piece.data.row = x;
                piece.data.column = y;

                //  Store the row and column the piece _should_ be in, when the puzzle is solved
                piece.data.correctRow = x;
                piece.data.correctColumn = y;

                //  Here is how we handle creating each piece. Rather than do something like create
                //  a BitmapData, and all kinds of extra textures, we just set each Sprite to have
                //  the same texture as the source image - and then we crop it to be the correct
                //  portion of the image. This ensures that we've still only got one texture
                //  bound to the GPU.
                piece.crop(new Phaser.Rectangle(x * this.pieceWidth, y * this.pieceHeight, this.pieceWidth, this.pieceHeight));

                piece.inputEnabled = true;

                piece.events.onInputDown.add(this.checkPiece, this);
            }
        }

        //  The last piece will be our 'spacer' to slide in to
        this.spacer = this.pieces.getChildAt(this.pieces.length - 1);
        this.spacer.alpha = 0;

        this.lastMove = null;

        this.shufflePieces();

    },

    /**
     * This shuffles up our puzzle.
     *
     * We can't just 'randomize' the tiles, or 50% of the time we'll get an
     * unsolvable puzzle. So instead lets walk it, making non-repeating random moves.
     */
    shufflePieces: function () {

        //  Push all available moves into this array
        var moves = [];

        if (this.spacer.data.column > 0 && this.lastMove !== Phaser.DOWN)
        {
            moves.push(Phaser.UP);
        }

        if (this.spacer.data.column < this.columns - 1 && this.lastMove !== Phaser.UP)
        {
            moves.push(Phaser.DOWN);
        }

        if (this.spacer.data.row > 0 && this.lastMove !== Phaser.RIGHT)
        {
            moves.push(Phaser.LEFT);
        }

        if (this.spacer.data.row < this.rows - 1 && this.lastMove !== Phaser.LEFT)
        {
            moves.push(Phaser.RIGHT);
        }

        //  Pick a move at random from the array
        this.lastMove = this.rnd.pick(moves);

        //  Then move the spacer into the new position
        switch (this.lastMove)
        {
            case Phaser.UP:
                this.swapPiece(this.spacer.data.row, this.spacer.data.column - 1);
                break;

            case Phaser.DOWN:
                this.swapPiece(this.spacer.data.row, this.spacer.data.column + 1);
                break;

            case Phaser.LEFT:
                this.swapPiece(this.spacer.data.row - 1, this.spacer.data.column);
                break;

            case Phaser.RIGHT:
                this.swapPiece(this.spacer.data.row + 1, this.spacer.data.column);
                break;
        }

    },

    /**
     * Swaps the spacer with the piece in the given row and column.
     */
    swapPiece: function (row, column) {

        //  row and column is the new destination of the spacer

        var piece = this.getPiece(row, column);

        var x = this.spacer.x;
        var y = this.spacer.y;

        piece.data.row = this.spacer.data.row;
        piece.data.column = this.spacer.data.column;

        this.spacer.data.row = row;
        this.spacer.data.column = column;

        this.spacer.x = piece.x;
        this.spacer.y = piece.y;

        //  If we don't want them to watch the puzzle get shuffled, then just
        //  set the piece to the new position immediately.
        if (this.shuffleSpeed === 0)
        {
            piece.x = x;
            piece.y = y;

            if (this.iterations > 0)
            {
                //  Any more iterations left? If so, shuffle, otherwise start play
                this.iterations--;

                this.shufflePieces();
            }
            else
            {
                this.startPlay();
            }
        }
        else
        {
            //  Otherwise, tween it into place
            var tween = this.add.tween(piece).to({ x: x, y: y }, this.shuffleSpeed, this.shuffleEase, true);

            if (this.iterations > 0)
            {
                //  Any more iterations left? If so, shuffle, otherwise start play
                this.iterations--;

                tween.onComplete.add(this.shufflePieces, this);
            }
            else
            {
                tween.onComplete.add(this.startPlay, this);
            }
        }

    },

    /**
     * Gets the piece at row and column.
     */
    getPiece: function (row, column) {

        for (var i = 0; i < this.pieces.children.length; i++)
        {
            var piece = this.pieces.getChildAt(i);

            if (piece.data.row === row && piece.data.column === column)
            {
                return piece;
            }
        }

        return null;

    },

    /**
     * Sets the game state to allow the user to click.
     */
    startPlay: function () {

        this.action = SlidingPuzzle.ALLOW_CLICK;

    },

    /**
     * Called when the user clicks on any of the puzzle pieces.
     * It first checks to see if the piece is adjacent to the 'spacer', and if not, bails out.
     * If it is, the two pieces are swapped by calling `this.slidePiece`.
     */
    checkPiece: function (piece) {

        if (this.action !== SlidingPuzzle.ALLOW_CLICK)
        {
            return;
        }

        //  Only allowed if adjacent to the 'spacer'
        //  
        //  Remember:
        //  
        //  Columns = vertical (y) axis
        //  Rows = horizontal (x) axis

        if (piece.data.row === this.spacer.data.row)
        {
            if (this.spacer.data.column === piece.data.column -1)
            {
                //  Space above the piece?
                piece.data.column--;

                this.spacer.data.column++;
                this.spacer.y += this.spacer.height;

                this.slidePiece(piece, piece.x, piece.y - this.pieceHeight);
            }
            else if (this.spacer.data.column === piece.data.column + 1)
            {
                //  Space below the piece?
                piece.data.column++;

                this.spacer.data.column--;
                this.spacer.y -= this.spacer.height;

                this.slidePiece(piece, piece.x, piece.y + this.pieceHeight);
            }
        }
        else if (piece.data.column === this.spacer.data.column)
        {
            if (this.spacer.data.row === piece.data.row -1)
            {
                //  Space to the left of the piece?
                piece.data.row--;

                this.spacer.data.row++;
                this.spacer.x += this.spacer.width;

                this.slidePiece(piece, piece.x - this.pieceWidth, piece.y);
            }
            else if (this.spacer.data.row === piece.data.row + 1)
            {
                //  Space to the right of the piece?
                piece.data.row++;

                this.spacer.data.row--;
                this.spacer.x -= this.spacer.width;

                this.slidePiece(piece, piece.x + this.pieceWidth, piece.y);
            }
        }

    },

    /**
     * Slides the piece into the position previously occupied by the spacer.
     * Uses a tween (see slideSpeed and slideEase for controls).
     * When complete, calls tweenOver.
     */
    slidePiece: function (piece, x, y) {

        this.action = SlidingPuzzle.TWEENING;

        var tween = this.add.tween(piece).to({ x: x, y: y }, this.slideSpeed, this.slideEase, true);

        tween.onComplete.addOnce(this.tweenOver, this);

    },

    /**
     * Called when a piece finishes sliding into place.
     * First checks if the puzzle is solved. If not, allows the player to carry on.
     */
    tweenOver: function () {

        //  Are all the pieces in the right place?

        var outOfSequence = false;

        this.pieces.forEach(function(piece) {

            if (piece.data.correctRow !== piece.data.row || piece.data.correctColumn !== piece.data.column)
            {
                outOfSequence = true;
            }

        });

        if (outOfSequence)
        {
            //  Not correct, so let the player carry on.
            this.action = SlidingPuzzle.ALLOW_CLICK;
        }
        else
        {
            //  If we get this far then the sequence is correct and the puzzle is solved.
            //  Fade the missing piece back in ...

            var tween = this.add.tween(this.spacer).to({ alpha: 1 }, this.slideSpeed * 2, 'Linear', true);

            //  When the tween finishes we'll let them click to start the next round

            var _this = this;

            tween.onComplete.addOnce(function() {
                _this.input.onDown.addOnce(_this.nextRound, _this);
            });

        }

    },

    /**
     * Starts the next round of the game.
     * 
     * In this template it cycles between the 3 pictures, increasing the iterations and complexity
     * as it progresses. But you can replace this with whatever you need - perhaps returning to
     * a main menu to select a new puzzle?
     */
    nextRound: function () {

        if (this.photo === 'photo1')
        {
            this.photo = 'photo2';
            this.iterations = 20;
            this.startPuzzle(this.photo, 4, 4);
        }
        else if (this.photo === 'photo2')
        {
            this.photo = 'photo3';
            this.iterations = 30;
            this.startPuzzle(this.photo, 5, 5);
        }
        else
        {
            //  Back to the start again
            this.photo = 'photo1';
            this.iterations = 10;
            this.startPuzzle(this.photo, 3, 3);
        }

    }

};

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'game');

game.state.add('SlidingPuzzle.Game', SlidingPuzzle.Game, true);
