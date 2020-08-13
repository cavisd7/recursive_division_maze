let canvas = document.getElementById('canvas');
canvas.width = 1200;
canvas.height = 660;
let ctx = canvas.getContext('2d');

let canvas2 = document.getElementById('canvas2');
canvas2.width = 1200;
canvas2.height = 660;
let ctx2 = canvas2.getContext('2d');

const pressedKeys = {
    left: false,
    right: false,
    up: false,
    down: false
};

const keyMap = {
    68: 'right',
    65: 'left',
    87: 'up',
    83: 'down'
};

function keyDown (e) {
    let key = keyMap[e.keyCode];
    pressedKeys[key] = true; 
};

function keyUp (e) {
    let key = keyMap[e.keyCode];
    pressedKeys[key] = false;
};

window.addEventListener("keydown", keyDown, false);
window.addEventListener("keyup", keyUp, false);

document.getElementById('newButton').onclick = function () {
    newGame();
};

const timer = () => {
    gameTimerId = setTimeout(addTime, 1000);
};

const addTime = () => {
    seconds++;
    if (seconds >= 60) {
        seconds = 0;
        minutes++;
        if (minutes >= 60) {
            minutes = 0;
            hours++;
        };
    };

    timeDisplay.textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + 
        (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + 
        (seconds > 9 ? seconds : "0" + seconds);

    timer();
};

/**
 * Helper functions.
 * ****************************************************
 */

const heuristic = (cell1, cell2) => {
    return Math.abs(cell1.x - cell2.x) + Math.abs(cell1.y - cell2.y);
};

const randomNumberRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

const findAverage = (arr) => {
    let total = 0;
    let len = arr.length;

    for (let i = 0; i < len; i++) {
        total += arr[i];
    };

    return total / len;
};

/**
 *******************************************************
 */

function Cell (x, y, state, visited = false) {
    this.x = x;
    this.y = y;
    this.state = state; 
    this.visited = visited;
    this.neighbors = [];//right, left, bottom, top,

    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.previousNode = undefined;

    this.findNeighbors = function (board) {
        //right neighbor
        if (this.x < board[0].length - 1) {
            this.neighbors.push(board[this.y][this.x + 1])
        }
        //left neighbor
        if (this.x > 0) {
            this.neighbors.push(board[this.y][this.x - 1])
        }
        //bottom neighbor
        if (this.y < board.length - 1) {
            this.neighbors.push(board[this.y + 1][this.x])
        }
        //top neighbor
        if (this.y > 0) {
            this.neighbors.push(board[this.y - 1][this.x])
        }
    };

    this.getXPosition = function () {
        return this.x;
    };

    this.getYPosition = function () {
        return this.y;
    };

    this.setVisited = function (isVisited) {
        this.visited = isVisited;
    };
};

function Board (width, height) {
    this.width = width;
    this.height = height;

    this.grid = [];
    this.entrance;
    this.exit;
    this.wallsToAnimate = [];
    this.bestPath = [];
    this.visitedCells = [];

    this.reset = function () {
        this.grid = [];
        this.bestPath = [];
        this.visitedCells = [];
        this.wallsToAnimate = [];
        this.entrance = {};
        this.exit = {};
    };

    this.init = function () {
        //Y value of entrance and exit cell.
        let entranceY = Math.floor((randomNumberRange(1, (this.height / 20) - 2)) / 2) * 2 + 1;
        let exitY = Math.floor((randomNumberRange(1, (this.height / 20) - 2)) / 2) * 2 + 1;

        for (let y = 0; y <= this.height / 20 - 1; y++) {
            this.grid.push([]);

            for (let x = 0; x <= this.width / 20 - 2; x++) {
                let cell;

                //Set outer walls, entrance and exit 
                if (y == 0 || y == this.height / 20 - 1 || x == 0 || x == this.width / 20 - 2) {
                    if (x == 0 && y == entranceY) {
                        cell = new Cell(x, y, 0, true);
                        this.grid[y].push(cell);
                        this.entrance = this.grid[entranceY][0];
                        this.visitedCells.push({x, y});
                    } else if (y == exitY && x == this.width / 20 - 2) {
                        cell = new Cell(x, y, 0);
                        this.grid[y].push(cell);
                        this.exit = this.grid[exitY][this.grid[0].length - 1];
                    } else {
                        cell = new Cell(x, y, 1);
                        this.grid[y].push(cell);
                        this.wallsToAnimate.push(cell);
                    };
                } else {
                    cell = new Cell(x, y, 0);
                    this.grid[y].push(cell);
                };
            };
        };

        //Find each cell's neighbors
        for (let y = 0; y <= this.grid.length - 1; y++) {
            for (let x = 0; x <= this.grid[y].length - 1; x++) {
                this.grid[y][x].findNeighbors(this.grid);
            };
        };

        //Generate inner walls
        this.divide(1, 1, this.grid[0].length - 2, this.grid.length - 2, this.isHorizontal(this.grid[0].length - 2, this.grid.length - 2));
        
        //Calculate the best path with A*
        this.findBestPath();
    };

    this.divide = function (startX, startY, endX, endY, isHorizontal) {
        if (!isHorizontal) {
            if (endX - startX < 2) {
                return;
            };

            let wallX = Math.floor(randomNumberRange(startX + 2, endX) / 2) * 2;
            let doorY = Math.floor(Math.floor(Math.random() * (endY - startY + 1) + startY) / 2) * 2 + 1;

            this.divideVertically(startY, wallX, endY, doorY);
            
            this.divide(startX, startY, wallX - 1, endY, this.isHorizontal((wallX - 1) - startX, endY - startY));
            this.divide(wallX + 1, startY, endX, endY, this.isHorizontal(endX - (wallX + 1), endY - startY));
        };
        
        if (isHorizontal) {
            if (endY - startY < 2) {
                return;
            };

            let wallY = Math.floor(randomNumberRange(startY + 2, endY) / 2) * 2;
            let doorX = Math.floor(Math.floor(Math.random() * (endX - startX + 1) + startX) / 2) * 2 + 1;//x position of door along wall

            this.divideHorizontally(startX, wallY, endX, doorX);

            this.divide(startX, startY, endX, wallY - 1, this.isHorizontal(endX - startX, (wallY - 1) - startY));
            this.divide(startX, wallY + 1, endX, endY, this.isHorizontal(endX - startX, endY - (wallY + 1)));
        };
    };

    this.isHorizontal = function (width, height) {
        if (width < height) {
            return true;
        } else if (height < width) {
            return false;
        } else {
            return Math.random() < 0.5 ? true : false
        };
    };

    this.divideVertically = function (startY, wallX, wallLength, doorY) {
        for (let wallY = startY; wallY <= wallLength; wallY++) {
            if (wallY === doorY) {
                this.grid[wallY][doorY].state = 0;
            } else {
                this.grid[wallY][wallX].state = 1;
                this.wallsToAnimate.push(this.grid[wallY][wallX]);
            };
        };
    };

    this.divideHorizontally = function (startX, wallY, wallLength, doorX) {
        for (let wallX = startX; wallX <= wallLength; wallX++) {
            if (wallX === doorX) {
                this.grid[wallY][doorX].state = 0;
            } else {
                this.grid[wallY][wallX].state = 1;
                this.wallsToAnimate.push(this.grid[wallY][wallX]);
            };
        };
    };

    this.findBestPath = function () {
        let openSet = [];
        let closedSet = [];

        openSet.push(this.entrance);

        while (openSet.length > 0) {
            //best next index
            let bestIndex = 0;
            for (let i = 0; i < openSet.length; i++) {
                if (openSet[i].f < openSet[bestIndex].f) {
                    bestIndex = i;
                };
            };

            let current = openSet[bestIndex];

            if (current === this.exit) {
                let temp = current;
                this.bestPath.push(temp);

                while (temp.previousNode) {
                    this.bestPath.push(temp.previousNode);
                    temp = temp.previousNode;
                };

                this.boardReady = true;
            };

            let removeIndex = openSet.indexOf(current);
            openSet.splice(removeIndex, 1);
            closedSet.push(current);

            let neighbors = current.neighbors;
            for (let a = 0; a < neighbors.length; a++) {
                let currentNeighbor = neighbors[a];

                if (!closedSet.includes(currentNeighbor) && currentNeighbor.state === 0) {
                    let tempG = current.g + heuristic(currentNeighbor, current);
                    let newPath = false;

                    if (openSet.includes(currentNeighbor)) {
                        if (tempG < currentNeighbor.g) {
                            currentNeighbor.g = tempG;
                            newPath = true;
                        };
                    } else {
                        currentNeighbor.g = tempG;
                        newPath = true;
                        openSet.push(currentNeighbor);
                    };

                    if (newPath) {
                        currentNeighbor.h = heuristic(currentNeighbor, this.exit);
                        currentNeighbor.f = currentNeighbor.g + currentNeighbor.h;
                        currentNeighbor.previousNode = current;
                    };
                };
            };
        };

        //no solution
        if (openSet.length == 0) {
            this.boardReady = true;
        };
    };

    this.updateVisitedCells = function (x, y) {
        this.visitedCells.push({ x, y });
    };
};

function Player (x, y, state = 3) {
    this.x = x;
    this.y = y;
    this.state = state;

    this.updatePos = function (nextX, nextY) {
        this.x += nextX;
        this.y += nextY;
    };

    this.reset = function (newX, newY) {
        this.x = newX;
        this.y = newY;
    };

    this.getXPos = function () {
        return this.x;
    };

    this.getYPos = function () {
        return this.y;
    };
};

const board = new Board(1200, 660);
board.init();
const player = new Player(board.entrance.x, board.entrance.y);

let secondsPassed, oldTimestamp, fps;
let stop;
let buffer = [];
let averagedFPS = 0;

let walls = board.wallsToAnimate;
let bestPath = board.bestPath.slice(0).reverse();
let animateMazeGeneration = true;
let animateBestPath = false;
let index = 0;

let gameId = null;
let isGameStart = false;
let gamePlaying = false;
let completed = false;

let timeDisplay = document.getElementById('timer');
let seconds = 0, minutes = 0, hours = 0;
let gameTimerId = null;

const update = () => {
    if (animateMazeGeneration) {
        if (index === walls.length - 1) {
            animateMazeGeneration = false;
            animateBestPath = true;
            index = 0;
            return;
        };

        if (index === 0) {
            ctx.fillStyle = 'red';
            ctx.fillRect(walls[index].x * 20, walls[index].y * 20, 20, 20);
        };

        index++;
    };

    if (animateBestPath) {
        if (index === bestPath.length - 1) {
            animateBestPath = false;
            gamePlaying = true;
            isGameStart = true;
            timer();
            return;
        };

        if (index === 0) {
            ctx2.fillStyle = 'yellow';
            ctx2.fillRect(bestPath[index].x * 20, bestPath[index].y * 20, 20, 20);
        };

        index++;
    }

    if (gamePlaying) {
        if (player.x == board.exit.x && player.y == board.exit.y) {
            gameWon();
        };

        if (pressedKeys.up) {
            //y-=1
            let nextY = -1;
            let nextX = 0;

            if (board.grid[player.y + nextY][player.x + nextX].state === 0) {
                board.updateVisitedCells(player.getXPos() + nextX, player.getYPos() + nextY);
                player.updatePos(nextX, nextY);
            } else {
                player.updatePos(0, 0);
            };
        } else if (pressedKeys.down) {
            //y+=1
            let nextY = 1;
            let nextX = 0;

            if (board.grid[player.y + nextY][player.x + nextX].state === 0) {
                board.updateVisitedCells(player.getXPos() + nextX, player.getYPos() + nextY);
                player.updatePos(nextX, nextY);
            } else {
                player.updatePos(0, 0);
            };
        } else if (pressedKeys.left) {
            //x-=1
            if (player.x !== 0) {
                let nextY = 0;
                let nextX = -1;

                if (board.grid[player.y + nextY][player.x + nextX].state === 0) {
                    board.updateVisitedCells(player.getXPos() + nextX, player.getYPos() + nextY);
                    player.updatePos(nextX, nextY);
                } else {
                    player.updatePos(0, 0);
                };
            } else {
                player.updatePos(0, 0);
            };
        } else if (pressedKeys.right) {
            //x+=1
            if (player.x !== board.width / 20 - 2) {
                let nextY = 0;
                let nextX = 1;
                
                if (board.grid[player.y + nextY][player.x + nextX].state === 0) {
                    board.updateVisitedCells(player.getXPos() + nextX, player.getYPos() + nextY);
                    player.updatePos(nextX, nextY);
                } else {
                    player.updatePos(0, 0);
                };
            } else {
                player.updatePos(0, 0);
            };
        };
    };
};

const render = () => {
    if (animateMazeGeneration) {
        ctx.fillStyle = 'red';
        ctx.fillRect(walls[index].x * 20, walls[index].y * 20, 20, 20);
    };

    if (animateBestPath) {
        ctx2.fillStyle = 'yellow';
        ctx2.fillRect(bestPath[index].x * 20, bestPath[index].y * 20, 20, 20);
    };

    if (gamePlaying) {
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

        /*if (isGameStart) {
            console.log('game start')
            ctx2.font = "100px Arial";
            let text = "Go!";
            let textWidth = ctx2.measureText(text).width;
            ctx2.fillStyle = 'white';
            ctx2.fillText(text, (1200 / 2) - (textWidth / 2), 660 / 2);
            isGameStart = false;
        };*/

        for (let i = 0; i < board.visitedCells.length; i++) {
            ctx2.fillStyle = 'blue';
            ctx2.fillRect(board.visitedCells[i].x * 20, board.visitedCells[i].y * 20, 20, 20);
        };

        ctx2.fillStyle = 'purple';
        ctx2.fillRect(player.x * 20, player.y * 20, 20, 20);
    };

    if (completed) {
        for (let i = 0; i < bestPath.length; i++) {
            ctx2.fillStyle = 'yellow';
            ctx2.fillRect(bestPath[i].x * 20, bestPath[i].y * 20, 20, 20);
        };

        ctx2.font = "100px Arial";
        let text = "Completed!";
        let textWidth = ctx2.measureText(text).width;
        ctx2.fillStyle = 'white';
        ctx2.fillText(text, (1200 / 2) - (textWidth / 2), 660 / 2);
    };
};

const animate = (tFrame) => {
    stop = window.requestAnimationFrame(animate);

    if (!animateMazeGeneration && !animateBestPath) {
        cancelAnimationFrame(stop);
        main();
    };

    secondsPassed = (tFrame - oldTimestamp) / 1000;
    oldTimestamp = tFrame;
    fps = Math.round(1 / secondsPassed);

    if (buffer.length <= 60) {
        buffer.push(fps);
    } else {
        averagedFPS = findAverage(buffer);
        console.log(`FPS: ${averagedFPS}`);
        buffer = [];
    };

    update(secondsPassed);
    render();
};

const main = () => {
    clearTimeout(gameId);

    update();
    render();

    gameId = setTimeout(main, 70);
};

const newGame = () => {
    clearTimeout(gameTimerId);
    gameTimerId = null;
    seconds = 0; minutes = 0; hours = 0;
    timeDisplay.textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + 
        (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + 
        (seconds > 9 ? seconds : "0" + seconds);

    clearTimeout(gameId);
    gameId = null;
    cancelAnimationFrame(stop);

    ctx.clearRect(0, 0, 1200, 660);
    ctx2.clearRect(0, 0, 1200, 660);

    board.reset();
    board.init();
    index = 0;
    walls = board.wallsToAnimate;
    bestPath = board.bestPath.slice(0).reverse();
    player.reset(board.entrance.x, board.entrance.y);

    completed = false;
    gamePlaying = false;
    animateMazeGeneration = true;

    animate(performance.now());
};

function gameWon () {
    clearTimeout(gameTimerId);
    gameTimerId = null;

    gamePlaying = false;
    completed = true;

    clearTimeout(gameId);
    gameId = null;
};

animate(performance.now());
