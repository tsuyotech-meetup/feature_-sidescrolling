const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

// 地面・障害物
const platforms = [
    { x: 0, y: 330, width: 2000, height: 70 }, // 床
    { x: 400, y: 280, width: 100, height: 20 },
    { x: 600, y: 230, width: 100, height: 20 },
    { x: 800, y: 180, width: 200, height: 20 },
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

    // カメラをプレイヤーに追従
    cameraX = player.x - 150;
    if (cameraX < 0) cameraX = 0;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // プラットフォーム描画
    ctx.fillStyle = '#219ebc';
    for (const p of platforms) {
        ctx.fillRect(p.x - cameraX, p.y, p.width, p.height);
    }

    // プレイヤー描画
    ctx.fillStyle = '#ffb703';
    ctx.fillRect(player.x - cameraX, player.y, player.width, player.height);

    // 弾の描画
    ctx.fillStyle = '#e63946';
    for (const b of bullets) {
        ctx.fillRect(b.x - cameraX, b.y, b.width, b.height);
    }

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
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
