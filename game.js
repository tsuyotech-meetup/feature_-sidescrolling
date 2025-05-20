const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

/// ごちゃごちゃしてきたので情報ごとにファイルを分けて整理したい、、、、

// プレイヤー情報
const player = {
    x: 100,
    y: 280,
    width: 40,
    height: 40,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpPower: 15,
    onGround: false,
};

// 敵キャラクター情報
const enemy = {
    x: 1630,         // 600番台のプラットフォーム中央に配置
    y: 190,         // プラットフォーム高さ230 - 敵の高さ40
    width: 40,
    height: 40,
    nextShootTime: 0,
    shootInterval: 1000 + Math.random() * 2000 // 1-3秒のランダム間隔
};

// 地面・障害物
const platforms = [
    { x: 0, y: 330, width: 2000, height: 70 }, // 床
    { x: 400, y: 280, width: 100, height: 20 },
    { x: 600, y: 230, width: 100, height: 20 },
    { x: 800, y: 180, width: 200, height: 20 },
    { x: 1600, y: 230, width: 100, height: 20 },
];

// 弾
const bullets = [];

// キー入力管理
const keys = {};

// 弾のプロパティやクールタイム管理変数を追加
const bulletSpeed_A = 10;
const bulletWidth_A = 10;
const bulletHeight_A = 5;
const shootCooldown_A = 200; // ms
const bulletSpeed_B = 7;
const bulletWidth_B = 20;
const bulletHeight_B = 10;
const shootCooldown_B = 3000; // ms
let nextShootTime_A = 0;
let nextShootTime_B = 0;
let gameOver = false;
let enemyHP = 5;
let gameClear = false;

// キーイベントリスナー
document.addEventListener('keydown', e => {
    keys[e.code] = true;
    const now = Date.now();

    // Jキーで弱攻撃　Iキーで強攻撃　の弾を発射
    if (e.code === 'KeyJ' && now >= nextShootTime_A) {
        bullets.push({
            x: player.x + player.width,
            y: player.y + player.height / 2 - bulletHeight_A / 2,
            vx: bulletSpeed_A,
            vy: 0,
            width: bulletWidth_A,
            height: bulletHeight_A,
            type: 'A'
        });
        nextShootTime_A = now + shootCooldown_A;
    }

    // Iキーで強攻撃
    if (e.code === 'KeyI' && now >= nextShootTime_B) {
        bullets.push({
            x: player.x + player.width,
            y: player.y + player.height / 2 - bulletHeight_B / 2,
            vx: bulletSpeed_B,
            vy: 0,
            width: bulletWidth_B,
            height: bulletHeight_B,
            type: 'B'
        });
        nextShootTime_B = now + shootCooldown_B;
    }
});
document.addEventListener('keyup', e => keys[e.code] = false);

// カメラ位置（スクロール用）
let cameraX = 0;

function update() {
    // 左右移動
    if (keys['KeyD']) player.vx = player.speed;
    else if (keys['KeyA']) player.vx = -player.speed;
    else player.vx = 0;

    // ジャンプ
    if (keys['Space'] && player.onGround) {
        player.vy = -player.jumpPower;
        player.onGround = false;
    }

    // 重力
    player.vy += 0.7;

    // 移動
    player.x += player.vx;
    player.y += player.vy;

    // 地面・障害物との当たり判定
    player.onGround = false;
    for (const p of platforms) {
        // 簡易AABB判定
        if (
            player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y < p.y + p.height &&
            player.y + player.height > p.y
        ) {
            // プレイヤーが上から着地
            if (player.vy > 0 && player.y + player.height - player.vy <= p.y) {
                player.y = p.y - player.height;
                player.vy = 0;
                player.onGround = true;
            }
        }
    }

        // 弾の移動と当たり判定
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;

        // プラットフォームとの当たり判定
        let hit = false;
        for (const p of platforms) {
            if (
                b.x < p.x + p.width &&
                b.x + b.width > p.x &&
                b.y < p.y + p.height &&
                b.y + b.height > p.y
            ) {
                hit = true;
                break;
            }
        }
        // 画面外 or 当たり判定で削除
        if (hit || b.x - cameraX > canvas.width || b.x + b.width < 0) {
            bullets.splice(i, 1);
        }
    }

    // プレイヤーの弾と敵の当たり判定
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.type === 'A' || b.type === 'B') {
            if (
                b.x < enemy.x + enemy.width &&
                b.x + b.width > enemy.x &&
                b.y < enemy.y + enemy.height &&
                b.y + b.height > enemy.y
            ) {
                // 弾を削除
                bullets.splice(i, 1);

                // HP減少
                if (b.type === 'A') {
                    enemyHP -= 1;
                } else if (b.type === 'B') {
                    enemyHP -= 3;
                }

                // HPが0以下ならゲームクリア
                if (enemyHP <= 0) {
                    gameClear = true;
                }
            }
        }
    }

    // 敵の射撃処理
    const now = Date.now();
    if (now >= enemy.nextShootTime) {
        bullets.push({
            x: enemy.x - bulletWidth_A, // 左側から発射
            y: enemy.y + enemy.height/2 - bulletHeight_A/2,
            vx: -bulletSpeed_A, // 左方向に移動
            vy: 0,
            width: bulletWidth_A,
            height: bulletHeight_A,
            type: 'enemy' // 弾の種類を追加
        });
        
        // 次の射撃タイミングをランダムに設定
        enemy.nextShootTime = now + 1000 + Math.random() * 2000;
    }

        if (gameOver) return; // ゲームオーバー時は処理を停止

    // 敵弾とプレイヤーの当たり判定
    for (const b of bullets) {
        if (b.type === 'enemy') {
            if (
                b.x < player.x + player.width &&
                b.x + b.width > player.x &&
                b.y < player.y + player.height &&
                b.y + b.height > player.y
            ) {
                gameOver = true; // 当たったらゲームオーバー
                break;
            }
        }
    }

    // カメラをプレイヤーに追従
    cameraX = player.x - 150;
    if (cameraX < 0) cameraX = 0;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /// オブジェクトの描画関係
    // プラットフォーム描画
    ctx.fillStyle = '#219ebc';
    for (const p of platforms) {
        ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
    }

    // プレイヤー描画
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);

    // 敵キャラクターの描画（暗い赤色）
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(enemy.x - cameraX, enemy.y, enemy.width, enemy.height);

    // 弾の描画
    ctx.fillStyle = '#e63946';
    for (const b of bullets) {
        ctx.fillRect(b.x - cameraX, b.y, b.width, b.height);
    }

    /// ゲーム画面のGUI描画関係
    // 敵HPバーの描画
    const barWidth = 150;
    const barHeight = 20;
    const barX = canvas.width - barWidth - 20;
    const barY = 20;
    ctx.fillStyle = '#555';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const hpWidth = Math.max(0, (enemyHP / 5) * barWidth);
    ctx.fillStyle = '#f00';
    ctx.fillRect(barX, barY, hpWidth, barHeight);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ENEMY HP: ${Math.max(0, enemyHP)}/5`, barX + barWidth / 2, barY + barHeight / 2);

    // クールダウン表示
    const now = Date.now();
    let cooldownA = Math.max(0, nextShootTime_A - now);
    let cooldownSecA = (cooldownA / 1000).toFixed(1);
    let cooldownB = Math.max(0, nextShootTime_B - now);
    let cooldownSecB = (cooldownB / 1000).toFixed(1);

    // 背景（半透明黒）
    const pad =2, boxW = 230, boxH = 60;
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#222';
    ctx.fillRect(0 + pad, canvas.height - boxH - pad, boxW, boxH);
    ctx.restore();

    // テキスト
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "Segoe UI", "Meiryo", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`J: 弱攻撃CD: ${cooldownSecA}s`, 22, canvas.height - boxH + 42);
    ctx.fillText(`I: 強攻撃CD: ${cooldownSecB}s`, 22, canvas.height - boxH + 18);

    if (gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ゲームオーバー', canvas.width / 2, canvas.height / 2);
        return;
    }
    if (gameClear) {

        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ゲームクリア', canvas.width / 2, canvas.height / 2);
        return;
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
