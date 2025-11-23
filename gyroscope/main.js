import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';

// --- ПАРАМЕТРЫ СИМУЛЯЦИИ ---
const params = {
    // География и Время
    polarDistance: 30,       // 0 = Сев. Полюс, 180 = Юж. Полюс
    earthSpeedMult: 1000,
    
    // Начальное состояние ротора 
    initAzimuth: 90,         // 0 = Север, 90 = Восток
    initElevation: 0,        // 0 = Горизонт, 90 = Зенит
    
    // Свойства ротора
    rotorSpeed: 50,          
    rotorDirection: 1,       // 1 = Прямое (+L), -1 = Обратное (-L)
    
    // Визуализация
    showTrails: true,
    showEarthAxis: true,
    
    // Действие
    reset: function() { resetGyro(); }
};

// Глобальные переменные
let scene, camera, renderer, controls;
let gimbalGroup, outerRing, innerRing, rotorMesh;
let trailLine, axisHelper; 
let gyroVector = new THREE.Vector3(); // Вектор момента импульса (L)
let earthAxisVector = new THREE.Vector3(); // Вектор угловой скорости Земли (Omega_earth)

// Данные для трейла
const trailPoints = [];
const MAX_TRAIL_POINTS = 600;

// Часы и UI
const clock = new THREE.Clock();
let simulationTime = 0;
const uiAz = document.getElementById('val-az');
const uiEl = document.getElementById('val-el');
const uiTime = document.getElementById('val-time');
const uiInfo = document.getElementById('ui-info'); 

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111115);
    scene.fog = new THREE.Fog(0x111115, 5, 40);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(4, 3, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    const amb = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(5, 10, 5);
    dir.castShadow = true;
    scene.add(dir);

    createLab();
    createGimbalMechanism();

    axisHelper = new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 4, 0x00ff00);
    scene.add(axisHelper);

    const trailGeo = new THREE.BufferGeometry();
    const trailMat = new THREE.LineBasicMaterial({ color: 0xff00ff });
    trailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(trailLine);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    setupGUI();

    updateEarthAxis();
    resetGyro();
}

function createLab() {
    const floor = new THREE.GridHelper(12, 12, 0x666666, 0x222222);
    scene.add(floor);

    const addLabel = (x, z, col) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), new THREE.MeshStandardMaterial({color: col}));
        mesh.position.set(x, 0.5, z);
        scene.add(mesh);
    };
    addLabel(0, -6, 0xff0000); // Север (-Z)
    addLabel(0, 6, 0xffffff);  // Юг (+Z)
    addLabel(6, 0, 0x0000ff);  // Восток (+X)
    addLabel(-6, 0, 0xffff00); // Запад (-X)
}

function createGimbalMechanism() {
    gimbalGroup = new THREE.Group();
    gimbalGroup.position.y = 1.2;
    scene.add(gimbalGroup);

    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 1.2), new THREE.MeshStandardMaterial({color:0x555555}));
    stand.position.y = -0.6;
    gimbalGroup.add(stand);

    outerRing = new THREE.Group();
    gimbalGroup.add(outerRing);
    const geoOut = new THREE.TorusGeometry(1.0, 0.06, 12, 48); geoOut.rotateY(Math.PI/2); 
    outerRing.add(new THREE.Mesh(geoOut, new THREE.MeshStandardMaterial({color: 0xff4444})));

    innerRing = new THREE.Group();
    outerRing.add(innerRing);
    const geoIn = new THREE.TorusGeometry(0.85, 0.06, 12, 48);
    innerRing.add(new THREE.Mesh(geoIn, new THREE.MeshStandardMaterial({color: 0x4444ff})));

    const rotorGroup = new THREE.Group();
    innerRing.add(rotorGroup);

    const geoRot = new THREE.CylinderGeometry(0.65, 0.65, 0.2, 32); geoRot.rotateX(Math.PI/2); 
    
    // Создание текстуры для вращения
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#dda000'; ctx.fillRect(0,0,128,128);
    ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(64,64,60,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.translate(64,64);
    for(let i=0; i<3; i++) { ctx.rotate(Math.PI*2/3); ctx.fillRect(-10, -64, 20, 64); }
    const tex = new THREE.CanvasTexture(canvas);
    const matRot = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, metalness: 0.5 });
    
    rotorMesh = new THREE.Mesh(geoRot, matRot);
    rotorGroup.add(rotorMesh);
    
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4), new THREE.MeshStandardMaterial({color:0x00ffff}));
    axle.rotateX(Math.PI/2);
    rotorGroup.add(axle);
}

// --- ФИЗИКА И МАТЕМАТИКА ---

function updateEarthAxis() {
    // Логика Полярного расстояния (x)
    const xRad = THREE.MathUtils.degToRad(params.polarDistance);
    
    const cosX = Math.cos(xRad);
    const sinX = Math.sin(xRad);
    
    // Y-компонента = cos(x), Z-компонента = -sin(x)
    earthAxisVector.set(0, cosX, -sinX).normalize();

    axisHelper.setDirection(earthAxisVector);
    axisHelper.visible = params.showEarthAxis;
    
    updateInfoUI();
}

function updateInfoUI() {
    const latitude = 90 - params.polarDistance;
    let hemisphere;
    
    if (latitude > 0) {
        hemisphere = `Северное (N) ${latitude.toFixed(0)}°`;
    } else if (latitude < 0) {
        hemisphere = `Южное (S) ${Math.abs(latitude).toFixed(0)}°`;
    } else {
        hemisphere = 'Экватор';
    }
    
    if (uiInfo) {
        const hemisphereLine = `<div class="row"><span>Широта:</span> <span class="val hl">${hemisphere}</span></div>`;
        const timeLine = uiInfo.querySelector('#val-time').closest('.row').outerHTML;
        const azLine = uiInfo.querySelector('#val-az').closest('.row').outerHTML;
        const elLine = uiInfo.querySelector('#val-el').closest('.row').outerHTML;

        // Пересобираем блок информации
        uiInfo.innerHTML = `
            <h1>Текущее состояние</h1>
            ${hemisphereLine}
            ${azLine}
            ${elLine}
            ${timeLine}
            <div style="margin-top:10px; font-size:0.8rem; color:#aaa;">
                Зеленая линия — ось Земли.<br>
                Нажмите <span class="hl">Сброс</span> для применения новых углов.
            </div>
        `;
    }
}

function resetGyro() {
    const azRad = THREE.MathUtils.degToRad(params.initAzimuth);
    const elRad = THREE.MathUtils.degToRad(params.initElevation);

    // Расчет вектора направления ротора без учета направления спина
    let L_x = Math.cos(elRad) * Math.sin(azRad);
    let L_y = Math.sin(elRad);
    let L_z = -Math.cos(elRad) * Math.cos(azRad);

    // !!! ГЛАВНОЕ ИЗМЕНЕНИЕ: Умножаем на направление спина (1 или -1)
    gyroVector.set(
        L_x * params.rotorDirection,
        L_y * params.rotorDirection,
        L_z * params.rotorDirection
    ).normalize();

    trailPoints.length = 0;
    trailLine.geometry.setFromPoints([]);
    simulationTime = 0;
}

function solveInverseKinematics() {
    const target = gyroVector.clone().normalize();
    
    const beta = -Math.asin(THREE.MathUtils.clamp(target.y, -1, 1));
    const alpha = Math.atan2(target.x, target.z);
    
    if (isNaN(alpha) || isNaN(beta)) {
        console.warn("IK Solver returned NaN. Resetting Gyro.");
        resetGyro();
        return;
    }
    
    outerRing.rotation.y = alpha;
    innerRing.rotation.x = beta;
}

function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();
    
    // 1. Визуальное вращение ротора
    if (rotorMesh) {
        // !!! ГЛАВНОЕ ИЗМЕНЕНИЕ: Умножаем на направление спина (1 или -1)
        rotorMesh.rotation.z -= params.rotorSpeed * params.rotorDirection * dt;
    }

    // 2. Дрейф гироскопа (Кинематика: L x Omega_earth)
    if (params.earthSpeedMult > 0) {
        const omega = (2 * Math.PI / 86400) * params.earthSpeedMult;
        const dAngle = omega * dt;
        
        // Прецессия: Вращаем вектор L вокруг оси EarthAxis в ОБРАТНУЮ сторону.
        // Эффект обратного вращения ротора уже учтен в самом векторе L (gyroVector).
        gyroVector.applyAxisAngle(earthAxisVector, -dAngle);
        
        simulationTime += dt * params.earthSpeedMult;
    }

    solveInverseKinematics();

    if (params.showTrails) {
        const tipPos = gyroVector.clone().multiplyScalar(1.5).add(gimbalGroup.position);
        if (trailPoints.length === 0 || trailPoints[trailPoints.length-1].distanceTo(tipPos) > 0.01) {
            trailPoints.push(tipPos);
            if (trailPoints.length > MAX_TRAIL_POINTS) trailPoints.shift();
            trailLine.geometry.setFromPoints(trailPoints);
        }
    }

    updateUI();

    controls.update();
    renderer.render(scene, camera);
}

function updateUI() {
    const azDeg = THREE.MathUtils.radToDeg(outerRing.rotation.y);
    const elDeg = THREE.MathUtils.radToDeg(-innerRing.rotation.x);
    
    let azDisp = azDeg % 360;
    if (azDisp < 0) azDisp += 360;

    uiAz.innerText = azDisp.toFixed(1) + "°";
    uiEl.innerText = elDeg.toFixed(1) + "°";
    
    const h = Math.floor((simulationTime / 3600) % 24);
    const m = Math.floor(((simulationTime / 3600) % 1) * 60);
    uiTime.innerText = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function setupGUI() {
    const gui = new GUI({ width: 340 });
    
    const f1 = gui.addFolder('Начальные условия ротора');
    f1.add(params, 'initAzimuth', 0, 360, 1).name('Азимут (град)');
    f1.add(params, 'initElevation', -90, 90, 1).name('Высота (град)');
    f1.add(params, 'rotorSpeed', 0, 200).name('Скорость ротора (Спин)');
    
    // !!! НОВОЕ: Выбор направления спина
    f1.add(params, 'rotorDirection', { 'Против часовой (+L)': 1, 'По часовой (-L)': -1 })
      .name('Направление спина');
      
    f1.add(params, 'reset').name('ПРИМЕНИТЬ / СБРОС');
    f1.open();

    const f2 = gui.addFolder('География и Время');
    f2.add(params, 'polarDistance', 0, 180, 1).name('Полярное расстояние (x)').onChange(updateEarthAxis);
    f2.add(params, 'earthSpeedMult', 0, 20000).name('Скорость Земли (x)');
    f2.open();

    const f3 = gui.addFolder('Вид');
    f3.add(params, 'showEarthAxis').name('Ось Земли (Зеленая)').onChange(v => axisHelper.visible = v);
    f3.add(params, 'showTrails').name('Рисовать путь');
    
    updateEarthAxis();
}