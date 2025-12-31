const LSP = {
    // Level 1
    1: [ 
        { x: 50, y: 50 },
        { x: 550, y: 50 },
        { x: 50, y: 550 },
        { x: 550, y: 550 },
        { x: 300, y: 50 },
        { x: 300, y: 550 } 
    ],
    // Level 2
    2: [ 
        { x: 50, y: 50 },
        { x: 550, y: 50 },
        { x: 50, y: 550 },
        { x: 550, y: 550 },
        { x: 10, y: 300 },
        { x: 590, y: 300 }
    ],
    // Level 3
    3: [
        { x: 50, y: 50 },
        { x: 550, y: 50 },   
        { x: 50, y: 550 },   
        { x: 550, y: 550 },  
        { x: 300, y: 50 },   
        { x: 300, y: 550 }, 
        { x: 50, y: 300 },  
        { x: 550, y: 300 }  
    ]
};

const enemyCosts = {
    "basic": 1,
    "melee1": 2,
    "rapid": 3,
    "shotgun": 3,
    "sniper": 4,
    "splitter big": 4,
    "explode": 5
}

let currentLevel = 1;

const levelWaveData = {
    1: {baseBudget: 8, spawnTimer: 1200, enemyType: ["basic", "melee1", "rapid", "explode"]},
    2: {baseBudget: 15, spawnTimer: 1500, enemyType: ["basic", "melee1", "shotgun", "splitter big"]},
    3: {baseBudget: 25, spawnTimer: 1800, enemyType: ["basic", "sniper", "shotgun", "rapid", "melee1", "splitter big", "explode"]},
};

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function waves() {
    
    if (killCount >= target) {
        if (currentLevel < 3) {
            currentLevel++;
            obstacles = [];
            enemies = [];
            selectedLayout = levelLayouts[currentLevel];
            killCount = 0;
            playerX =worldWidth / 2;
            playerY = worldHeight / 2;
            for (let obsData of selectedLayout) {
                obstacles.push(obsData);
            }
        } else {
            currentLevel = 1;
            prestige++;
            obstacles = [];
            enemies = [];
            selectedLayout = levelLayouts[currentLevel];
            killCount = 0;
            target += 10;
            playerX =worldWidth / 2;
            playerY = worldHeight / 2;
            for (let obsData of selectedLayout) {
                obstacles.push(obsData);
            }
        }

    }

    if (enemies.length == 0 || frameCount % levelWaveData[currentLevel].spawnTimer == 0) {
        if (enemies.length == 0) {
            if (playerHealth < maxHealth) {
                playerHealth = min(playerHealth + 10, maxHealth);
            }
        }
        let prestigeBonus = prestige * 5;
        let currentWaveBudget = prestigeBonus + levelWaveData[currentLevel].baseBudget;
        
        while (currentWaveBudget > 0 && enemies.length < 20) {
            let allowedTypes = levelWaveData[currentLevel].enemyType;
            let affordableEnemies = [];
            for (let enemy of allowedTypes) {
                if (enemyCosts[enemy] <= currentWaveBudget) {
                    affordableEnemies.push(enemy);
                }
            }
            if (affordableEnemies.length == 0) {
                break;
            }
            let randomInt = getRandomInt(0, affordableEnemies.length);
            let selectedType = affordableEnemies[randomInt];
            let cost = enemyCosts[selectedType];

            let spawnPoints = LSP[currentLevel];
            let spawnPoint = random(spawnPoints);

            let newEnemy = createEnemy({}, 100 + prestigeBonus, spawnPoint.x, spawnPoint.y, selectedType);
            enemies.push(newEnemy);
            currentWaveBudget -= cost;
        }
    }
}
