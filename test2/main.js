import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';

// --- ПАРАМЕТРЫ СИМУЛЯЦИИ ---
const params = {
    // Физика
    spinSpeed: 30,         // Рад/сек (скорость колеса вокруг своей оси)
    wheelMass: 2.0,        // кг
    wheelRadius: 0.6,      // м
    
    // Геометрия
    ropeLength: 1.2,       // Длина веревки
    wheelDistance: 0.8,    // Расстояние от точки крепления веревки до центра колеса (плечо рычага)
    
    // Начальные условия
    tiltAngle: 80,         // Угол оси относительно вертикали (90 - горизонтально)
    
    // Нутация (колебания)
    nutation: true,
    nutationAmp: 2.5,      // Амплитуда в градусах
    
    // Вид
    showAxleLine: true,
    timeScale: 1.0
};

// Глобальные переменные
let scene, camera, renderer, controls;
let pivotPoint, precessionGroup, ropeLine;
let axleGroup, axleMesh, wheelMesh, arrowHelper;

// Часы
const clock = new THREE.Clock();
let nutationTime = 0;

init();
animate();

function init() {
    // 1. Сцена и Камера
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222225);
    scene.fog = new THREE.Fog(0x222225, 5, 50);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(5, 3, 6);

    // 2. Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // 3. Свет
    const ambi = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambi);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    grid.position.y = -3; // Опустим пол
    scene.add(grid);

    // 4. Создание объектов (Механизм)
    createMechanism();

    // 5. Контролы камеры
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);

    // 6. GUI
    setupGUI();
}

function createMechanism() {
    // --- А. Точка подвеса (Потолок) ---
    const pivotGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2);
    const pivotMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    pivotPoint = new THREE.Mesh(pivotGeo, pivotMat);
    pivotPoint.position.set(0, 4, 0);
    pivotPoint.rotation.z = Math.PI / 2;
    scene.add(pivotPoint);

    // --- Б. Группа Прецессии (Вращается вокруг Y) ---
    // Центр группы совпадает с точкой подвеса
    precessionGroup = new THREE.Group();
    precessionGroup.position.copy(pivotPoint.position);
    scene.add(precessionGroup);

    // --- В. Веревка ---
    // Веревка визуально соединяет (0,0,0) группы прецессии с точкой крепления оси
    // Геометрию будем обновлять в animate, так как "Tilt" будет менять положение конца веревки
    // (В упрощенной модели веревка висит вертикально в системе прецессии, но мы сделаем красивее)
    const ropeGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,-1,0)]);
    const ropeMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
    ropeLine = new THREE.Line(ropeGeo, ropeMat);
    precessionGroup.add(ropeLine);

    // --- Г. Группа Наклона Оси (Axle Group) ---
    // Находится на конце веревки. 
    // Мы будем смещать эту группу вниз на params.ropeLength
    axleGroup = new THREE.Group();
    precessionGroup.add(axleGroup);

    // --- Д. Сама Ось (Цилиндр) ---
    // Ось идет вдоль локальной оси X.
    // Левый конец оси (0,0,0) - это точка крепления к веревке.
    const axleRadius = 0.04;
    // Создадим цилиндр длиной 1, но сместим его, чтобы начало было в 0
    const axleGeo = new THREE.CylinderGeometry(axleRadius, axleRadius, 1, 16);
    // Поворачиваем геометрию, чтобы цилиндр лежал вдоль X
    axleGeo.rotateZ(-Math.PI / 2); 
    // Сдвигаем геометрию так, чтобы pivot (0,0,0) был на левом краю
    axleGeo.translate(0.5, 0, 0); 
    
    const axleMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
    axleMesh = new THREE.Mesh(axleGeo, axleMat);
    axleMesh.castShadow = true;
    axleGroup.add(axleMesh);

    // Декоративный "Крюк" на начале оси
    const hookMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06), new THREE.MeshStandardMaterial({color:0xffaa00}));
    axleGroup.add(hookMesh);

    // --- Е. Колесо ---
    // Колесо "нанизано" на ось. Оно вращается вокруг оси X.
    // Радиус зададим через scale
    const wheelGeo = new THREE.CylinderGeometry(1, 1, 0.15, 32);
    wheelGeo.rotateZ(Math.PI / 2); // Поворачиваем, чтобы ось вращения была X

    // Текстура для колеса (спицы)
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111'; ctx.fillRect(0,0,256,256);
    ctx.fillStyle = '#ff5500'; 
    ctx.translate(128,128);
    for(let i=0; i<8; i++) {
        ctx.rotate(Math.PI/4);
        ctx.fillRect(-10, -128, 20, 110); // Спицы
        ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill(); // Центр
    }
    // Обод
    ctx.beginPath(); ctx.arc(0,0,120,0,Math.PI*2); 
    ctx.lineWidth=15; ctx.strokeStyle='#ff5500'; ctx.stroke();

    const wheelTex = new THREE.CanvasTexture(canvas);
    const wheelMat = new THREE.MeshStandardMaterial({ map: wheelTex, roughness: 0.5 });
    
    wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
    wheelMesh.castShadow = true;
    
    // Колесо добавляем внутрь axleGroup, но оно должно быть отдельным объектом,
    // чтобы мы могли его вращать независимо от наклона оси.
    // Но позиция колеса привязана к оси.
    axleGroup.add(wheelMesh);

    // Вектор L (зеленая стрелка из центра колеса)
    arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 1, 0x00ff00);
    wheelMesh.add(arrowHelper); // Крепим к колесу, чтобы двигалась с ним
}

function updateGeometry() {
    // 1. Позиция точки крепления оси (конец веревки)
    // В локальных координатах PrecessionGroup веревка висит вниз
    axleGroup.position.set(0, -params.ropeLength, 0);

    // Обновляем линию веревки
    const positions = ropeLine.geometry.attributes.position.array;
    positions[3] = 0;
    positions[4] = -params.ropeLength;
    positions[5] = 0;
    ropeLine.geometry.attributes.position.needsUpdate = true;

    // 2. Длина и положение оси
    // Ось визуально должна быть чуть длиннее, чем дистанция до колеса
    const totalAxleLen = params.wheelDistance + 0.3;
    axleMesh.scale.set(1, totalAxleLen, 1); // Y-scale тут влияет на длину по X из-за ротации геометрии? Нет, мы повернули геометрию, а не меш.
    // Мы сделали cylinder вдоль Y, потом rotateZ. Значит Y ось цилиндра стала X осью мира.
    // Scale(1, L, 1) растянет длину. Но так как мы сделали translate(0.5), это растяжение будет корректным от 0.
    
    // В ThreeJS scale применяется к осям объекта. Исходный цилиндр вдоль Y. Мы повернули геометрию. 
    // Теперь ось цилиндра лежит вдоль X. Scale.x будет масштабировать "толщину"? 
    // Давайте пересоздадим масштаб проще: 
    // Исходная ось Y стала X. Значит scale.y растянет длину? Нет, геометрия "запеклась".
    // Проще всего: scale.x растягивает по X.
    axleMesh.scale.set(totalAxleLen, 1, 1); 

    // 3. Положение колеса на оси
    wheelMesh.position.set(params.wheelDistance, 0, 0);
    
    // 4. Размер колеса
    wheelMesh.scale.set(params.wheelRadius, params.wheelRadius, 1); // Z - это толщина в локальных координатах колеса (которое повернуто)
    // Стоп. WheelGeo повернута. Исходная Y стала X. Радиус это X и Z исходного цилиндра?
    // Исходный цилиндр: radiusTop, radiusBottom. Это плоскость XZ. Высота Y.
    // Мы повернули на 90 по Z. Теперь Высота вдоль X. Круг в плоскости YZ.
    // Значит радиус масштабируется по Y и Z.
    wheelMesh.scale.set(1, params.wheelRadius, params.wheelRadius);
}

function updatePhysics(dt) {
    const timeStep = dt * params.timeScale;

    // 1. Вращение Колеса (Спин)
    wheelMesh.rotation.x -= params.spinSpeed * timeStep;

    // Параметры
    const g = 9.81;
    const r = params.wheelDistance;
    // Момент инерции колеса (I_spin) = 0.5 * m * R^2
    const I_spin = 0.5 * params.wheelMass * Math.pow(params.wheelRadius, 2);
    // Момент инерции прецессии (упрощенно как точечная масса на расстоянии r) = m * r^2
    const I_prec = params.wheelMass * Math.pow(r, 2); 

    const omega = Math.abs(params.spinSpeed);
    const L_spin = I_spin * omega;
    const torque = params.wheelMass * g * r;

    let precessionOmega = 0;
    
    // --- ПРОВЕРКА УСЛОВИЯ БЫСТРОГО ВОЛЧКА ---
    // Критерий: L_spin должен быть существенно больше импульса от прецессии.
    // Или проще: используем дискриминант квадратного уравнения прецессии.
    // D = (I_spin * w)^2 - 4 * I_prec * m * g * r * cos(theta)
    // Но для простоты визуала, мы можем использовать отношение энергий или сил.
    
    // Если "фактор качества" гироскопа высок, используем формулу.
    // Если низок — прецессия затухает и переходит в падение.
    
    // Соотношение моментов: насколько спин доминирует над гравитационным опрокидыванием
    // Это эвристический коэффициент устойчивости
    const stabilityFactor = L_spin / Math.sqrt(torque * I_prec + 0.001);

    // Управление углом наклона
    let currentTiltDeg = params.tiltAngle;

    if (stabilityFactor > 2.0) {
        // --- ЗОНА СТАБИЛЬНОСТИ (Работает формула быстрого волчка) ---
        
        // Классическая формула: Omega = Torque / L_spin
        precessionOmega = (torque / L_spin) * Math.sign(params.spinSpeed);
        
        // Нутация (дрожание) добавляется поверх стабильного состояния
        if (params.nutation) {
            nutationTime += (omega * 1.5) * timeStep;
            currentTiltDeg += Math.cos(nutationTime) * params.nutationAmp;
        }

    } else {
        // --- ЗОНА НЕСТАБИЛЬНОСТИ (Формула врет) ---
        // Колесо вращается слишком медленно. 
        // Вместо бесконечного ускорения прецессии, она должна срываться.
        
        // Плавное падение прецессии к нулю при потере скорости
        const blend = Math.max(0, stabilityFactor - 0.5) / 1.5; // от 0 до 1
        
        // "Смягченная" формула прецессии
        precessionOmega = (torque / (L_spin + 0.1)) * Math.sign(params.spinSpeed) * blend;

        // Колесо падает (угол стремится к 0 - вертикально вниз)
        // Чем меньше stabilityFactor, тем быстрее падает
        const fallSpeed = (1.0 - blend) * 20.0 * timeStep;
        params.tiltAngle = THREE.MathUtils.lerp(params.tiltAngle, 0, fallSpeed * 0.05);
    }

    // Применяем наклон
    // (напомню: в нашей модели 90 - горизонт, 0 - вниз)
    const tiltRad = THREE.MathUtils.degToRad(currentTiltDeg - 90);
    axleGroup.rotation.z = tiltRad;

    // Вращение группы вокруг вертикали
    precessionGroup.rotation.y += precessionOmega * timeStep;

    // Визуализация вектора
    if (arrowHelper) {
        const arrowLen = L_spin * 0.2;
        arrowHelper.setLength(Math.max(0.5, arrowLen));
        arrowHelper.setDirection(new THREE.Vector3(Math.sign(params.spinSpeed), 0, 0));
    }
}

function setupGUI() {
    const gui = new GUI({ width: 300 });
    
    const f1 = gui.addFolder('Колесо и Спин');
    f1.add(params, 'spinSpeed', -60, 60).name('Скорость вращения').listen();
    f1.add(params, 'wheelRadius', 0.2, 1.5).name('Радиус колеса').onChange(updateGeometry);
    f1.add(params, 'wheelMass', 0.5, 10).name('Масса (кг)');

    const f2 = gui.addFolder('Конструкция');
    f2.add(params, 'ropeLength', 0.5, 3.0).name('Длина веревки').onChange(updateGeometry);
    f2.add(params, 'wheelDistance', 0.3, 2.0).name('Плечо (Ось)').onChange(updateGeometry);
    
    const f3 = gui.addFolder('Состояние');
    f3.add(params, 'tiltAngle', 0, 130).name('Угол наклона').listen();
    f3.add(params, 'nutation').name('Нутация вкл/выкл');
    f3.add(params, 'nutationAmp', 0, 10).name('Амплитуда нутации');

    updateGeometry(); // Применить начальные настройки
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    updatePhysics(dt);
    controls.update();
    renderer.render(scene, camera);
}

// Ресайз окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});