export function initStars() {
    if (window.__starsRunning) return;
    window.__starsRunning = true;

    const canvas = document.createElement("canvas");
    canvas.id = "stars";
    document.body.prepend(canvas);

    const ctx = canvas.getContext("2d");
    let w, h;

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    let rafId = null;
    const timeouts = [];

    const targetFPS = isMobile ? 15 : 30;
    const layers = [[], [], []];
    const numStars = isMobile ? [150, 300, 450] : [700, 400, 1000];
    const clusters = [];
    const clusterCount = 4;
    const nebulas = [];
    let shootingStars = [];
    let starBursts = [];

    let windActive = false;
    let windBoost = 1;
    let windTimer = 0;

    function safeTimeout(fn, delay) {
        const id = setTimeout(fn, delay);
        timeouts.push(id);
        return id;
    }

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    function createCluster() {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            radius: Math.random() * 200 + 120,
            dx: (Math.random() - 0.5) * 0.05,
            dy: (Math.random() - 0.5) * 0.05
        };
    }

    function createStar(layer) {
        const cluster = clusters[Math.floor(Math.random() * clusterCount)];
        const inCluster = Math.random() < 0.6;
        let pos;

        if (inCluster && cluster) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * cluster.radius;
            pos = {
                x: cluster.x + Math.cos(angle) * dist,
                y: cluster.y + Math.sin(angle) * dist
            };
        } else {
            pos = { x: Math.random() * w, y: Math.random() * h };
        }

        const sizeFactor = [1, 0.8, 0.6][layer];
        const speedFactor = [0.18, 0.14, 0.1][layer];

        const isLongLived = Math.random() < 0.2;

        return {
            x: pos.x,
            y: pos.y,
            radius: (Math.random() * 0.6 + 0.3) * sizeFactor,
            alpha: 0,
            targetAlpha: Math.random() * 0.5 + 0.25,
            twinkleSpeed: Math.random() * 0.012 * (layer + 1),
            dx: (Math.random() - 0.5) * speedFactor,
            dy: (Math.random() - 0.5) * speedFactor,
            driftTimer: Math.random() * 120 + 60,
            life: 0,
            maxLife: isLongLived
                ? (Math.random() * 3600 + 2400)
                : (Math.random() * 300 + 150),
            fadeSpeed: 0.006 + Math.random() * 0.003
        };
    }

    function randomNebulaColor() {
        const colors = [
            [150, 100, 255],
            [100, 200, 255],
            [255, 180, 100],
            [180, 255, 150]
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function createNebula() {
        const color = randomNebulaColor();
        const target = randomNebulaColor();
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            radius: (Math.random() * 200 + 150) * (isMobile ? 0.7 : 1),
            dx: (Math.random() - 0.5) * 0.02,
            dy: (Math.random() - 0.5) * 0.02,
            color,
            target,
            transitionProgress: 0
        };
    }

    function createShootingStar(x, y, dx, dy) {
        return {
            path: [{ x, y }],
            dx,
            dy,
            life: 0,
            maxLife: 60
        };
    }

    for (let i = 0; i < clusterCount; i++) clusters.push(createCluster());
    for (let layer = 0; layer < 3; layer++)
        for (let i = 0; i < numStars[layer]; i++)
            layers[layer].push(createStar(layer));
    for (let i = 0; i < (isMobile ? 2 : 3); i++) nebulas.push(createNebula());

    // Падающая звезда
    function spawnShootingStar() {
        shootingStars.push(createShootingStar(
            Math.random() * w,
            Math.random() * h * 0.5,
            -4 - Math.random() * 2,
            2 + Math.random()
        ));
        safeTimeout(spawnShootingStar, Math.random() * 20000 + 20000);
    }
    spawnShootingStar();

    function spawnMeteorShower() {
        const startX = Math.random() * w;
        const startY = Math.random() * h * 0.5;
        for (let i = 0; i < 5; i++) {
            shootingStars.push(createShootingStar(
                startX + Math.random() * 20,
                startY + Math.random() * 20,
                -4 - Math.random() * 2,
                2 + Math.random()
            ));
        }
        safeTimeout(spawnMeteorShower, Math.random() * 120000 + 120000);
    }
    spawnMeteorShower();

    function triggerWind() {
        windActive = true;
        windBoost = 1.4 + Math.random() * 0.4;
        windTimer = targetFPS * (2 + Math.random() * 1.5);
        safeTimeout(triggerWind, Math.random() * 8000 + 12000);
    }
    safeTimeout(triggerWind, Math.random() * 2000 + 3000);

    function triggerStarBurst() {
        starBursts.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 150 + 150,
            time: targetFPS * (Math.random() * 2 + 1)
        });
        safeTimeout(triggerStarBurst, Math.random() * 10000 + 10000);
    }
    triggerStarBurst();

    let lastTime = performance.now();
    const frameInterval = 1000 / targetFPS;

    function draw(now) {
        const delta = now - lastTime;
        if (delta < frameInterval) {
            rafId = requestAnimationFrame(draw);
            return;
        }
        lastTime = now;

        ctx.clearRect(0, 0, w, h);

        for (let nebula of nebulas) {
            nebula.transitionProgress += 0.001;
            if (nebula.transitionProgress >= 1) {
                nebula.color = nebula.target;
                nebula.target = randomNebulaColor();
                nebula.transitionProgress = 0;
            }
            const r = Math.floor(
                nebula.color[0] + (nebula.target[0] - nebula.color[0]) * nebula.transitionProgress
            );
            const g = Math.floor(
                nebula.color[1] + (nebula.target[1] - nebula.color[1]) * nebula.transitionProgress
            );
            const b = Math.floor(
                nebula.color[2] + (nebula.target[2] - nebula.color[2]) * nebula.transitionProgress
            );

            const grad = ctx.createRadialGradient(
                nebula.x, nebula.y, 0,
                nebula.x, nebula.y, nebula.radius
            );
            grad.addColorStop(0, `rgba(${r},${g},${b},0.12)`);
            grad.addColorStop(1, "transparent");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
            ctx.fill();

            nebula.x += nebula.dx;
            nebula.y += nebula.dy;
        }

        for (let c of clusters) {
            c.x += c.dx;
            c.y += c.dy;
            if (Math.random() < 0.005) {
                c.dx = (Math.random() - 0.5) * 0.08;
                c.dy = (Math.random() - 0.5) * 0.08;
            }
        }

        ctx.fillStyle = "#fff";
        for (let layer = 0; layer < 3; layer++) {
            for (let i = 0; i < layers[layer].length; i++) {
                let star = layers[layer][i];

                if (star.life < star.maxLife / 2) {
                    star.alpha = Math.min(star.targetAlpha, star.alpha + star.fadeSpeed);
                } else {
                    star.alpha = Math.max(0, star.alpha - star.fadeSpeed);
                }

                star.alpha += (Math.random() - 0.5) * star.twinkleSpeed;

                star.driftTimer--;
                if (star.driftTimer <= 0) {
                    star.dx = (Math.random() - 0.5) * 0.045;
                    star.dy = (Math.random() - 0.5) * 0.045;
                    star.driftTimer = Math.random() * 600 + 300;
                }

                let speedBoost = windActive ? windBoost : 1;
                star.x += star.dx * speedBoost + (Math.random() - 0.5) * 0.12;
                star.y += star.dy * speedBoost + (Math.random() - 0.5) * 0.12;

                for (let b of starBursts) {
                    const dx = star.x - b.x;
                    const dy = star.y - b.y;
                    if (dx * dx + dy * dy < b.r * b.r) {
                        star.alpha = Math.min(1, star.alpha * 1.1);
                    }
                }

                ctx.globalAlpha = Math.max(0, Math.min(1, star.alpha));
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();

                star.life++;
                if (star.life >= star.maxLife) {
                    layers[layer][i] = createStar(layer);
                }
            }
        }

        ctx.lineWidth = 1;
        for (let s of shootingStars) {
            s.path.unshift({ x: s.path[0].x + s.dx, y: s.path[0].y + s.dy });
            if (s.path.length > 15) s.path.pop();

            const fadeFactor = Math.max(0, (s.maxLife - s.life) / s.maxLife);
            for (let i = 0; i < s.path.length - 1; i++) {
                const alpha = (1 - i / s.path.length) * fadeFactor;
                ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
                ctx.beginPath();
                ctx.moveTo(s.path[i].x, s.path[i].y);
                ctx.lineTo(s.path[i + 1].x, s.path[i + 1].y);
                ctx.stroke();
            }

            s.life++;
        }
        shootingStars = shootingStars.filter(s => s.life < s.maxLife);

        if (windActive) {
            windTimer--;
            if (windTimer <= 0) windActive = false;
        }

        starBursts = starBursts.filter(b => {
            b.time--;
            return b.time > 0;
        });

        rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);

    window.destroyStars = function() {
        window.__starsRunning = false;
        timeouts.forEach(clearTimeout);
        if (rafId) cancelAnimationFrame(rafId);
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
    };
}
