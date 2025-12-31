function createExplosion(x, y, duration, radius, damage, affectsPlayer, affectsEnemy) {
    explosions.push({
        x: x,
        y: y,
        r: radius,
        duration: duration,
        damage: damage,
        affectsEnemy: affectsEnemy,
        affectsPlayer: affectsPlayer,
    });
}

function updateExplosions() {
    for (let i = 0; i < explosions.length; i++) {
        let exp = explosions[i];
        print(exp);
        if (exp.affectsEnemy) {
            for (let e of enemies) {
                if (dist(exp.x , exp.y, e.x, e.y) < exp.r + e.size) {
                    e.health -= exp.damage;
                }
            }
        }
        if (exp.affectsPlayer) {
            if (dist(exp.x, exp.y, playerX, playerY) < exp.r + playerSize) {
                if (iFrames == 0) {
                    iFrames = 30;
                    playerHealth -= 10;
                }
            }
        }
        fill(255, 165, 0);
        circle(exp.x, exp.y, exp.r);
        exp.duration--;
        if (exp.duration <= 0) {
            explosions.splice(i, 1);
        } else {
            i++;
        }
    }
}