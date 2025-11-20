import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Viewport{
	fow = 75
	distance = 100
	angle1 = 50
	angle2 = 25
	minDistance = 50
	maxDistance = 250
	
	scene = new THREE.Scene()
	camera = new THREE.PerspectiveCamera(this.fow, 1, 0.1, 10000)
	renderer = new THREE.WebGLRenderer({antialias: true})
	composer = new EffectComposer(this.renderer)
	container = null
	controls = null
	objects = []
	
	rendering = false
	lastUpdate = undefined
	
	constructor(){
		this.composer.addPass(new RenderPass(this.scene, this.camera))
		this.composer.addPass(new OutputPass())
	
		const cos1 = Math.cos(this.angle1 * Math.PI / 180)
		const sin1 = Math.sin(this.angle1 * Math.PI / 180)
		const cos2 = Math.cos(this.angle2 * Math.PI / 180)
		const sin2 = Math.sin(this.angle2 * Math.PI / 180)
		this.camera.position.x = this.distance * cos2 * cos1
		this.camera.position.z = this.distance * cos2 * sin1
		this.camera.position.y = this.distance * sin2
	}
	
	displayOn(container){
		this.container = container
		this.container.appendChild(this.renderer.domElement)
	}
	
	updateScale(){
		this.camera.aspect = this.container.clientWidth / this.container.clientHeight
		this.camera.updateProjectionMatrix()
		
		this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
		this.composer.setSize(this.container.clientWidth, this.container.clientHeight)
	}
	
	startRendering(){
		this.rendering = true
		this.nextFrame()
	}
	
	nextFrame(){
		if(this.rendering) window.requestAnimationFrame(t => this.render(t))
	}
	
	render(now){
		now *= 0.001
		this.lastUpdate ??= now
		const dt = now - this.lastUpdate
		
		this.objects.forEach(object => object.update(dt));
		
		this.updateScale()
		this.composer.render(dt)
		
		this.lastUpdate = now
		this.nextFrame()
	}
	
	registerCameraControls(){
		this.container.addEventListener('wheel', event => {
			event.stopImmediatePropagation()
		})
		
		window.addEventListener('contextmenu', event => {
			event.preventDefault()
		})
	
		this.controls = new OrbitControls(this.camera, this.container)
		this.controls.enablePan = false
		this.controls.zoomSpeed = 5
		this.controls.minDistance = this.minDistance
		this.controls.maxDistance = this.maxDistance
		this.controls.mouseButtons = {
			LEFT: THREE.MOUSE.ROTATE,
			RIGHT: THREE.MOUSE.DOLLY
		}
	}
	
	addObject(object){
		this.objects.push(object)
		object.addToScene(this.scene)
	}
	
	quickSetup(container, theme, object){
		theme.applyLight(this.scene)
		
		const resolution = new THREE.Vector2(container.clientWidth, container.clientHeight)
		theme.applyEffects(this.composer, resolution, this.scene, this.camera)
		
		object.createMesh()
		object.setTheme(theme)
		this.addObject(object)
		
		this.displayOn(container)
		this.registerCameraControls()
		this.startRendering()
	}
}