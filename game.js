const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// プレイヤー情報
const player = {
    x: 100,
    y: 300,
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
    { x: 0, y: 350, width: 2000, height: 50 }, // 長い地面
    { x: 400, y: 300, width: 100, height: 20 },
    { x: 600, y: 250, width: 100, height: 20 },
];

// キー入力管理
const keys = {};
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

// カメラ位置（スクロール用）
let cameraX = 0;

function update() {
    // 左右移動
    if (keys['D']) player.vx = player.speed;
    else if (keys['a']) player.vx = -player.speed;
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
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
