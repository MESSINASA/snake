const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreText = document.getElementById('scoreText');

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const animationSpeed = 0.1;

let snake = [];
let food = {};
let obstacles = [];
let direction = 'right';
let score = 0;
let gameInterval;
let gameSpeed = 200;
let lastTime = 0;
let accumulator = 0;

let smoothSnake = [];

const OBSTACLE_TYPES = {
    WALL: 'wall',
    SPIKE: 'spike',
    PORTAL: 'portal'
};

function updateDifficulty() {
    const difficultyLevel = Math.floor(score / 50);
    
    gameSpeed = Math.max(100, 200 - difficultyLevel * 20);
    
    if (score > 0 && score % 50 === 0) {
        addNewObstacles(difficultyLevel);
    }
}

function addNewObstacles(level) {
    const numObstacles = Math.min(3, level);
    
    for (let i = 0; i < numObstacles; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * tileCount);
            y = Math.floor(Math.random() * tileCount);
        } while (
            isPositionOccupied(x, y) ||
            isNearSnake(x, y)
        );

        const types = Object.values(OBSTACLE_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        
        obstacles.push({ x, y, type });
    }
}

function isPositionOccupied(x, y) {
    if (food.x === x && food.y === y) return true;
    
    return obstacles.some(obs => obs.x === x && obs.y === y);
}

function isNearSnake(x, y) {
    return snake.some(segment => 
        Math.abs(segment.x - x) < 2 && Math.abs(segment.y - y) < 2
    );
}

function initGame() {
    const startX = 5;
    const startY = 5;
    
    snake = [
        { x: startX, y: startY }
    ];
    
    smoothSnake = [{
        x: startX,
        y: startY,
        targetX: startX,
        targetY: startY
    }];
    
    direction = 'right';
    score = 0;
    scoreText.textContent = score;
    obstacles = [];
    gameSpeed = 200;
    spawnFood();
    lastTime = performance.now();
    accumulator = 0;
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
}

function draw() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    obstacles.forEach(obstacle => {
        drawObstacle(obstacle);
    });

    ctx.fillStyle = 'red';
    ctx.beginPath();
    const foodX = food.x * gridSize + gridSize/2;
    const foodY = food.y * gridSize + gridSize/2;
    ctx.arc(foodX, foodY, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    smoothSnake.forEach((segment, index) => {
        if (index === 0) {
            drawSnakeHead(segment);
        } else {
            const hue = (120 + index * 5) % 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            
            roundedRect(
                segment.x * gridSize + 1,
                segment.y * gridSize + 1,
                gridSize - 2,
                gridSize - 2,
                5
            );
        }
    });
}

function roundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

function drawSnakeHead(head) {
    const x = head.x * gridSize;
    const y = head.y * gridSize;
    
    ctx.fillStyle = '#2ecc71';
    roundedRect(
        x + 1,
        y + 1,
        gridSize - 2,
        gridSize - 2,
        5
    );

    ctx.fillStyle = 'white';
    let eyeX1, eyeY1, eyeX2, eyeY2;
    const eyeSize = 4;
    
    switch(direction) {
        case 'right':
            eyeX1 = x + gridSize - 8;
            eyeY1 = y + 6;
            eyeX2 = x + gridSize - 8;
            eyeY2 = y + gridSize - 8;
            break;
        case 'left':
            eyeX1 = x + 6;
            eyeY1 = y + 6;
            eyeX2 = x + 6;
            eyeY2 = y + gridSize - 8;
            break;
        case 'up':
            eyeX1 = x + 6;
            eyeY1 = y + 6;
            eyeX2 = x + gridSize - 8;
            eyeY2 = y + 6;
            break;
        case 'down':
            eyeX1 = x + 6;
            eyeY1 = y + gridSize - 8;
            eyeX2 = x + gridSize - 8;
            eyeY2 = y + gridSize - 8;
            break;
    }
    
    ctx.beginPath();
    ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
    ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(eyeX1, eyeY1, eyeSize/2, 0, Math.PI * 2);
    ctx.arc(eyeX2, eyeY2, eyeSize/2, 0, Math.PI * 2);
    ctx.fill();
}

function drawObstacle(obstacle) {
    const x = obstacle.x * gridSize;
    const y = obstacle.y * gridSize;

    switch (obstacle.type) {
        case OBSTACLE_TYPES.WALL:
            ctx.fillStyle = '#666';
            ctx.fillRect(x, y, gridSize, gridSize);
            break;
            
        case OBSTACLE_TYPES.SPIKE:
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.moveTo(x + gridSize/2, y);
            ctx.lineTo(x + gridSize, y + gridSize);
            ctx.lineTo(x, y + gridSize);
            ctx.closePath();
            ctx.fill();
            break;
            
        case OBSTACLE_TYPES.PORTAL:
            ctx.fillStyle = '#9933ff';
            ctx.beginPath();
            ctx.arc(x + gridSize/2, y + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
            ctx.fill();
            break;
    }
}

function moveSnake() {
    const head = { ...snake[0] };

    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    const hitObstacle = obstacles.find(obs => obs.x === head.x && obs.y === head.y);
    if (hitObstacle) {
        switch (hitObstacle.type) {
            case OBSTACLE_TYPES.WALL:
            case OBSTACLE_TYPES.SPIKE:
                gameOver();
                return;
            case OBSTACLE_TYPES.PORTAL:
                do {
                    head.x = Math.floor(Math.random() * tileCount);
                    head.y = Math.floor(Math.random() * tileCount);
                } while (isPositionOccupied(head.x, head.y));
                break;
        }
    }

    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);
    const prevHead = smoothSnake[0] || { x: head.x, y: head.y };
    smoothSnake.unshift({
        x: prevHead.x,
        y: prevHead.y,
        targetX: head.x,
        targetY: head.y
    });

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreText.textContent = score;
        updateDifficulty();
        spawnFood();
    } else {
        snake.pop();
        smoothSnake.pop();
    }
}

function gameOver() {
    cancelAnimationFrame(gameInterval);
    gameInterval = null;
    
    const modal = document.getElementById('gameOverModal');
    const finalScore = document.getElementById('finalScore');
    finalScore.textContent = score;
    modal.style.display = 'flex';
    
    startButton.disabled = false;
}

function gameLoop(currentTime) {
    if (!gameInterval) return;

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    accumulator += deltaTime;

    if (accumulator >= gameSpeed) {
        moveSnake();
        accumulator -= gameSpeed;
    }

    updateSmoothPositions();
    draw();
    gameInterval = requestAnimationFrame(gameLoop);
}

function updateSmoothPositions() {
    smoothSnake.forEach((segment, index) => {
        const target = snake[index];
        
        segment.x = lerp(segment.x, target.x, animationSpeed);
        segment.y = lerp(segment.y, target.y, animationSpeed);
    });
}

function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            if (direction !== 'down') direction = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') direction = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') direction = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') direction = 'right';
            break;
    }
});

startButton.addEventListener('click', () => {
    initGame();
    startButton.disabled = true;
    if (gameInterval) cancelAnimationFrame(gameInterval);
    gameInterval = requestAnimationFrame(gameLoop);
});

document.getElementById('restartButton').addEventListener('click', () => {
    document.getElementById('gameOverModal').style.display = 'none';
    initGame();
    gameInterval = requestAnimationFrame(gameLoop);
    startButton.disabled = true;
});

document.getElementById('gameOverModal').addEventListener('click', (event) => {
    if (event.target.id === 'gameOverModal') {
        event.target.style.display = 'none';
    }
}); 