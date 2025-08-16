// starnight.js - thanks for recode chat gpt v5
// Веб-фон: туманности (без мерцания формы + мягкое дыхание), звёзды с кластерами (уменьшенная плотность/размер),
// метеоры вниз-вправо. Всё — WebGL2, один канвас. API: export function initStars(opts = {})

export function initStars(opts = {}) {
    // чтобы не инициализировать второй раз
    if (window.__starsRunning) return;
    window.__starsRunning = true;

    // ---------- Конфиг по умолчанию (можно переопределять через opts) ----------
    const cfg = {
        // туманности: слабые, как на скриншотах, с очень плавным дыханием
        nebulas: {
            count: 3,
            alpha: 0.4,           // базовая прозрачность всех слоёв
            breathPeriod: 20.0,    // секунд на цикл дыхания
        },
        // звёзды — уменьшили количество и размеры (как при масштабе 90%)
        stars: {
            count: 1500,                     // раньше было ~2200 — стало скромнее
            clusters: 6,                     // макс 16 (ограничение юниформа)
            clusterRadius: [120, 200],       // компактнее, чем раньше
            // распределение: 20% вне кластеров, 30% могут попасть в кластеры, 50% в кластерах
            layers: [
                { share: 0.20, size: 0.75, speed: 1.2, clusterChance: 0.00, denseFactor: 1.00 }, // быстрые, вне кластеров
                { share: 0.30, size: 0.65, speed: 0.9, clusterChance: 0.50, denseFactor: 1.00 }, // средние, часть в кластеры
                { share: 0.50, size: 0.55, speed: 0.6, clusterChance: 1.00, denseFactor: 0.60 }, // медленные, в кластерах
            ],
            twinkleAmp: 0.08,                // амплитуда мерцания (стало слабее)
            twinkleBase: 0.55                // базовая яркость
        },
        meteors: {
            pool: 6,
            angleDeg: 24,          // летим вправо-вниз
            speedMin: 900,         // px/сек (до мультипликатора DPR)
            speedMax: 1400,
            trailPx: 220,          // длина хвоста
            activeMin: 1.2,        // сколько виден метеор в своём периоде
            activeMax: 2.2,
            periodMin: 16,         // реже, чем раньше
            periodMax: 32,
            jitterDeg: 6,          // небольшой разносклон
            brightness: 0.8        // общая «яркость» хвоста (понижена)
        },
        render: {
            fps: 60,
            zIndex: 0,
            dprMax: 2              // можно снизить до 1.5 если нужно ещё меньше мерцания/нагрузки
        }
    };

    // поверх defaults — пользовательские опции (частичное/глубокое слияние не нужно)
    if (opts.nebulas) Object.assign(cfg.nebulas, opts.nebulas);
    if (opts.stars)   Object.assign(cfg.stars,   opts.stars);
    if (opts.meteors) Object.assign(cfg.meteors, opts.meteors);
    if (opts.render)  Object.assign(cfg.render,  opts.render);

    // ---------- Холст / GL ----------
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
        position: 'fixed', inset: 0, width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: String(cfg.render.zIndex)
    });
    document.body.prepend(canvas);

    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) { console.warn('WebGL2 not available'); return; }
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const DPR = Math.max(1, Math.min(cfg.render.dprMax, window.devicePixelRatio || 1));
    let W = 0, H = 0;
    const resize = () => {
        const w = Math.floor(innerWidth * DPR);
        const h = Math.floor(innerHeight * DPR);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w; canvas.height = h;
            gl.viewport(0, 0, w, h);
            W = w; H = h;
        }
    };
    addEventListener('resize', resize, { passive: true });
    resize();

    // ---------- Вспомогательные функции ----------
    const compile = (type, src) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPLETE_STATUS) && !gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(sh) || 'Shader compile error');
        }
        return sh;
    };
    const link = (vs, fs) => {
        const p = gl.createProgram();
        gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'Program link error');
        return p;
    };

    // ---------- NEBULA ----------
    const nebVS = `#version 300 es
  layout(location=0) in vec2 a_pos;
  out vec2 v_uv;
  void main(){ v_uv = a_pos*0.5+0.5; gl_Position = vec4(a_pos,0.0,1.0); }`;

    const nebFS = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  uniform vec2  u_center;       // 0..1
  uniform vec2  u_radius;       // эллипсоидальный радиус (0..1)
  uniform vec2  u_staticOffset; // фиксированный сдвиг шума
  uniform float u_alpha;        // общий множитель прозрачности
  uniform float u_time;         // для дыхания
  uniform vec3  u_colorA;       // нижняя граница цвета
  uniform vec3  u_colorB;       // верхняя граница цвета
  uniform float u_breathT;      // скорость дыхания (рад/сек)
  out vec4 fragColor;

  // value noise + fbm (4 октавы)
  float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
    vec2 u=f*f*(3.0-2.0*f);
    return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
  }
  float fbm(vec2 p){
    float s=0.0, a=0.5;
    for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.0; a*=0.5; }
    return s;
  }

  void main(){
    // эллипсоидальная «маска» с мягкими краями
    vec2 d = (v_uv - u_center);
    float g = exp(-0.5*(d.x*d.x/(u_radius.x*u_radius.x + 1e-6) + d.y*d.y/(u_radius.y*u_radius.y + 1e-6)));

    // статичная текстура туманности (никакой time в координатах!)
    float n = fbm(v_uv*3.0 + u_staticOffset);

    // очень медленное дыхание всей туманности
    float breath = 0.95 + 0.05 * sin(u_time * u_breathT);

    // цветовой градиент от u_colorA к u_colorB по шуму n
    vec3 col = mix(u_colorA, u_colorB, n);

    // итоговая альфа
    float alpha = g * (0.45 + 0.55*n) * u_alpha * breath;
    if (alpha < 0.01) discard;

    fragColor = vec4(col, alpha);
  }`;

    const nebProg = link(nebVS, nebFS);
    const vaoNeb = gl.createVertexArray();
    gl.bindVertexArray(vaoNeb);
    {
        // экранный прямоугольник
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1,-1,  1,-1, -1, 1,
            -1, 1,  1,-1,  1, 1
        ]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
    }
    gl.bindVertexArray(null);

    // параметры туманностей
    const nebulae = Array.from({ length: cfg.nebulas.count }, () => {
        // случайные, но «приятные» позиции и формы
        const cx = 0.18 + Math.random()*0.64;
        const cy = 0.18 + Math.random()*0.64;
        const rx = 0.16 + Math.random()*0.18;
        const ry = 0.12 + Math.random()*0.16;
        // фиксированный сдвиг шума (чтобы форма не «жила»)
        const off = [Math.random()*100.0, Math.random()*100.0];
        // палитра: фиолетовый/сине-фиолетовый/слегка в зелень
        const palettes = [
            { a:[0.00, 0.00, 0.00], b:[0.25, 0.28, 0.32] }, // тёмно-серый дым
            { a:[0.05, 0.05, 0.05], b:[0.45, 0.45, 0.50] }, // мягкий серый
            { a:[0.02, 0.02, 0.02], b:[0.65, 0.65, 0.70] }  // лёгкий белёсый
        ];
        const pal = palettes[Math.floor(Math.random()*palettes.length)];
        return {
            center: [cx, cy],
            radius: [rx, ry],
            offset: off,
            colorA: pal.a,
            colorB: pal.b
        };
    });

    // ---------- STARS ----------
    const starVS = `#version 300 es
  precision highp float;
  float h1(float n){ return fract(sin(n)*43758.5453123); }
  vec2  h21(float n){ return vec2(h1(n), h1(n+1.2345)); }

  layout(location=0) in float a_dummy;

  uniform vec2  u_res;
  uniform float u_time;
  uniform float u_size;
  uniform float u_speed;
  uniform float u_idOff;

  uniform int   u_clusterCount;      // фактически используемое число центров
  uniform vec2  u_clusters[16];      // центры в нормализованных координатах (0..1)

  uniform vec2  u_clusterRadius;     // базовый радиус в px (min,max)
  uniform float u_clusterChance;     // 0..1, вероятность «попасть» в кластер
  uniform float u_denseFactor;       // сжимает радиус (делает плотнее)

  uniform float u_twBase;            // базовая яркость мерцания
  uniform float u_twAmp;             // амплитуда мерцания

  out float v_a;

  void main(){
    float id = float(gl_InstanceID) + u_idOff;

    // Решаем — в кластере или нет
    float inCl = step(h1(id+100.0), u_clusterChance);

    // выбираем кластер (просто по id, чтобы не дергать rand)
    int clId = int(mod(id, float(u_clusterCount)));
    vec2 clCenter = u_clusters[clId] * u_res;

    // радиус кластера (случайный в пределах)
    float baseR = mix(u_clusterRadius.x, u_clusterRadius.y, h1(id+7.0));
    baseR *= u_denseFactor;

    // позиция в кластере — ближе к центру (sqrt распределение)
    float distK = sqrt(h1(id+55.0));
    float ang = h1(id+66.0) * 6.2831853;
    vec2  offset = vec2(cos(ang), sin(ang)) * baseR * distK;

    // позиция вне кластера
    vec2 base = h21(id*3.17) * u_res;

    // комбинируем
    vec2 pos = mix(base, clCenter + offset, inCl);

    // лёгкий дрейф (очень небольшой), зависящий от слоя
    vec2 drift = (h21(id+20.0) - 0.5) * (5.0 * u_speed);
    pos = mod(pos + drift * u_time, u_res);

    // мягкое и редкое мерцание
    float phase = u_time*(0.05 + h1(id+23.0)*0.07) + id*0.37;
    float raw = 0.5 + 0.5 * sin(phase);
    
    float tw  = u_twBase + u_twAmp * pow(raw, 3.0); // мягкая форма
    v_a = tw;

    // вывод
    vec2 clip = vec2(pos.x/u_res.x*2.0-1.0, 1.0 - pos.y/u_res.y*2.0);
    gl_Position = vec4(clip, 0.0, 1.0);
    gl_PointSize = (0.9 + 1.6*h1(id+5.5)) * u_size; // меньше, чем раньше
  }`;

    const starFS = `#version 300 es
  precision highp float;
  in float v_a;
  out vec4 fragColor;
  void main(){
    // маленький «диск» со сглаженным краем
    vec2 p = gl_PointCoord*2.0 - 1.0;
    float r2 = dot(p,p);
    float core = smoothstep(1.0, 0.0, r2);
    fragColor = vec4(1.0, 1.0, 1.0, core * v_a);
  }`;

    const starProg = link(starVS, starFS);

    const vaoStar = gl.createVertexArray();
    gl.bindVertexArray(vaoStar);
    {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
    }
    gl.bindVertexArray(null);

    // центры кластеров (в нормированных координатах)
    const clusterCount = Math.min(16, cfg.stars.clusters);
    const clusters = Array.from({ length: clusterCount }, () => [Math.random(), Math.random()]);

    // ---------- METEORS ----------
    const metVS = `#version 300 es
  precision highp float;
  float h1(float n){ return fract(sin(n)*43758.5453123); }

  layout(location=0) in vec2 a_corner;

  uniform vec2  u_res;
  uniform float u_time;
  uniform float u_angle;
  uniform float u_trail;
  uniform vec2  u_speedRange;
  uniform vec2  u_periodRange;
  uniform vec2  u_activeRange;
  uniform float u_jitter;

  out float v_s;  // вдоль хвоста 0..1
  out float v_t;  // поперёк -1..1
  out float v_on; // активен ли метеор в данный момент

  vec2 startPos(float seed, vec2 res){
    float off=120.0; // старт чуть за границей
    if (h1(seed+29.0) > 0.5) return vec2(h1(seed+30.0)*res.x*0.6 - off, -off);
    else                    return vec2(-off, h1(seed+31.0)*res.y*0.6 - off);
  }

  void main(){
    float id = float(gl_InstanceID);

    float per = mix(u_periodRange.x,  u_periodRange.y,  h1(id+2.0));
    float act = mix(u_activeRange.x,  u_activeRange.y,  h1(id+3.0));
    float spd = mix(u_speedRange.x,   u_speedRange.y,   h1(id+4.0));
    float phase = h1(id+5.0) * per;
    float local = mod(u_time + phase, per);

    float isOn = step(local, act);          // активен только в первой части периода

    float ang = u_angle + (h1(id+6.0)-0.5)*2.0*u_jitter;
    vec2 dir = normalize(vec2(cos(ang), sin(ang)));
    vec2 head = startPos(id+10.0, u_res) + dir * spd * local;

    float L = min(u_trail, spd*local*0.9);
    vec2 n = normalize(vec2(-dir.y, dir.x));

    float s = clamp(a_corner.x, 0.0, 1.0);
    float t = a_corner.y;
    float width = (1.0 - s*0.85) * 2.0;

    vec2 pos = head - dir*(s*L) + n*(t*width);

    vec2 clip = vec2(pos.x/u_res.x*2.0-1.0, 1.0 - pos.y/u_res.y*2.0);
    gl_Position = vec4(clip, 0.0, 1.0);

    v_s = s; v_t = t; v_on = isOn;
  }`;

    const metFS = `#version 300 es
  precision highp float;
  in float v_s;
  in float v_t;
  in float v_on;
  uniform float u_brightness;
  out vec4 fragColor;
  void main(){
    if (v_on < 0.5) discard;
    float w = 1.0 - smoothstep(0.0, 1.0, abs(v_t));
    float along = pow(1.0 - v_s, 1.6);
    float headGlow = smoothstep(0.0, 0.25, 0.25 - v_s);
    float a = w * (along*0.4 + headGlow*0.35) * u_brightness; // умеренная яркость
    fragColor = vec4(1.0, 1.0, 1.0, a);
  }`;

    const metProg = link(metVS, metFS);
    const vaoMet = gl.createVertexArray();
    gl.bindVertexArray(vaoMet);
    {
        // «лента» треугольниками: (s,t) = [0..1] x [-1..1]
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0,-1, 0, 1, 1,-1,
            0, 1, 1, 1, 1,-1
        ]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);
    }
    gl.bindVertexArray(null);

    // ---------- Рендер-цикл ----------
    let last = performance.now();
    const frameInt = 1000 / cfg.render.fps;

    function draw(now) {
        if (now - last < frameInt) { requestAnimationFrame(draw); return; }
        last = now;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // === Nebula ===
        gl.useProgram(nebProg);
        gl.bindVertexArray(vaoNeb);
        const u_timeN = gl.getUniformLocation(nebProg, 'u_time');
        const u_alphaN = gl.getUniformLocation(nebProg, 'u_alpha');
        const u_centerN = gl.getUniformLocation(nebProg, 'u_center');
        const u_radiusN = gl.getUniformLocation(nebProg, 'u_radius');
        const u_offN = gl.getUniformLocation(nebProg, 'u_staticOffset');
        const u_colorA = gl.getUniformLocation(nebProg, 'u_colorA');
        const u_colorB = gl.getUniformLocation(nebProg, 'u_colorB');
        const u_breathT = gl.getUniformLocation(nebProg, 'u_breathT');

        gl.uniform1f(u_timeN, now * 0.001);
        gl.uniform1f(u_alphaN, cfg.nebulas.alpha);
        gl.uniform1f(u_breathT, (2*Math.PI) / cfg.nebulas.breathPeriod);

        for (const L of nebulae) {
            gl.uniform2f(u_centerN, L.center[0], L.center[1]);
            gl.uniform2f(u_radiusN, L.radius[0], L.radius[1]);
            gl.uniform2f(u_offN, L.offset[0], L.offset[1]);
            gl.uniform3f(u_colorA, L.colorA[0], L.colorA[1], L.colorA[2]);
            gl.uniform3f(u_colorB, L.colorB[0], L.colorB[1], L.colorB[2]);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        gl.bindVertexArray(null);

        // === Stars ===
        gl.useProgram(starProg);
        gl.bindVertexArray(vaoStar);

        const u_resS = gl.getUniformLocation(starProg, 'u_res');
        const u_timeS = gl.getUniformLocation(starProg, 'u_time');
        const u_sizeS = gl.getUniformLocation(starProg, 'u_size');
        const u_speedS = gl.getUniformLocation(starProg, 'u_speed');
        const u_idOffS = gl.getUniformLocation(starProg, 'u_idOff');
        const u_ccS = gl.getUniformLocation(starProg, 'u_clusterCount');
        const u_crS = gl.getUniformLocation(starProg, 'u_clusterRadius');
        const u_chS = gl.getUniformLocation(starProg, 'u_clusterChance');
        const u_dfS = gl.getUniformLocation(starProg, 'u_denseFactor');
        const u_twBase = gl.getUniformLocation(starProg, 'u_twBase');
        const u_twAmp  = gl.getUniformLocation(starProg, 'u_twAmp');

        gl.uniform2f(u_resS, W, H);
        gl.uniform1f(u_timeS, now * 0.001);
        gl.uniform1i(u_ccS, clusterCount);
        for (let i = 0; i < clusterCount; i++) {
            const loc = gl.getUniformLocation(starProg, `u_clusters[${i}]`);
            gl.uniform2f(loc, clusters[i][0], clusters[i][1]);
        }
        gl.uniform2f(u_crS, cfg.stars.clusterRadius[0], cfg.stars.clusterRadius[1]);
        gl.uniform1f(u_twBase, cfg.stars.twinkleBase);
        gl.uniform1f(u_twAmp,  cfg.stars.twinkleAmp);

        // послойно — как в конфиге
        let idOff = 0;
        for (const L of cfg.stars.layers) {
            const cnt = Math.floor(cfg.stars.count * L.share);
            gl.uniform1f(u_sizeS,  L.size);
            gl.uniform1f(u_speedS, L.speed);
            gl.uniform1f(u_idOffS, idOff);
            gl.uniform1f(u_chS,    L.clusterChance);
            gl.uniform1f(u_dfS,    L.denseFactor);
            gl.drawArraysInstanced(gl.POINTS, 0, 1, cnt);
            idOff += cnt;
        }
        gl.bindVertexArray(null);

        // === Meteors ===
        gl.useProgram(metProg);
        gl.bindVertexArray(vaoMet);

        const u_resM   = gl.getUniformLocation(metProg, 'u_res');
        const u_timeM  = gl.getUniformLocation(metProg, 'u_time');
        const u_angleM = gl.getUniformLocation(metProg, 'u_angle');
        const u_trailM = gl.getUniformLocation(metProg, 'u_trail');
        const u_spdR   = gl.getUniformLocation(metProg, 'u_speedRange');
        const u_perR   = gl.getUniformLocation(metProg, 'u_periodRange');
        const u_actR   = gl.getUniformLocation(metProg, 'u_activeRange');
        const u_jitt   = gl.getUniformLocation(metProg, 'u_jitter');
        const u_bright = gl.getUniformLocation(metProg, 'u_brightness');

        gl.uniform2f(u_resM, W, H);
        gl.uniform1f(u_timeM, now * 0.001);
        gl.uniform1f(u_angleM, cfg.meteors.angleDeg * Math.PI / 180);
        gl.uniform1f(u_trailM, cfg.meteors.trailPx * DPR);
        gl.uniform2f(u_spdR,   cfg.meteors.speedMin*DPR, cfg.meteors.speedMax*DPR);
        gl.uniform2f(u_perR,   cfg.meteors.periodMin, cfg.meteors.periodMax);
        gl.uniform2f(u_actR,   cfg.meteors.activeMin, cfg.meteors.activeMax);
        gl.uniform1f(u_jitt,   cfg.meteors.jitterDeg * Math.PI / 180);
        gl.uniform1f(u_bright, cfg.meteors.brightness);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, cfg.meteors.pool);
        gl.bindVertexArray(null);

        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    // Возвращаем cleanup, если понадобится
    return () => {
        window.__starsRunning = false;
        removeEventListener('resize', resize);
        canvas.remove();
    };
}
