import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SMAAShaderPass } from '/scripts/shader/smaa.js';

export class Viewport{
	fow = 75
	distance = 15
	angle1 = 50
	angle2 = 25
	minDistance = 7.5
	maxDistance = 60
	
	width = 0
	height = 0
	
	scene = new THREE.Scene()
	camera = new THREE.PerspectiveCamera(this.fow, 1, 0.1, 10000)
	renderer = new THREE.WebGLRenderer()
	composer = new EffectComposer(this.renderer)
	container = null
	controls = null
	theme = null
	objects = []
	shaders = []
	
	rendering = false
	lastUpdate = undefined
	maxDT = 0.1
	
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
		
		this.addShader(new SMAAShaderPass())
	}
	
	updateScale(){
		if(this.width == this.container.clientWidth && this.height == this.container.clientHeight) return
		this.width = this.container.clientWidth
		this.height = this.container.clientHeight
	
		this.camera.aspect = this.width / this.height
		this.camera.updateProjectionMatrix()
		
		this.renderer.setSize(this.width, this.height)
		this.composer.setSize(this.width, this.height)
		
		for(let shader of this.shaders){
			shader.updateScale(this.width, this.height)
		}
	}
	
	startRendering(){
		this.rendering = true
		this._frameFlow()
	}
	
	_frameFlow(){
		if(this.rendering) window.requestAnimationFrame(now_msec => {
			this.render(now_msec * 0.001)
			this._frameFlow()
		})
	}
	
	updateTime(now){
		this.lastUpdate ??= now
		let dt = now - this.lastUpdate
		this.lastUpdate = now
		
		if(dt > this.maxDT){
			dt = 0
		}
		
		return dt
	}
	
	render(now){
		const dt = this.updateTime(now)
		
		this.objects.forEach(object => object.update(dt));
		
		this.updateScale()
		this.composer.render(dt)
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
		object.addOnScene(this.scene)
		if(this.theme) object.setTheme(this.theme)
		
		for(let shader of this.shaders){
			this.syncEffectObject(object, shader)
		}
	}
	
	addShader(shader, order){
		order ??= -1
		this.shaders.push(shader)
		shader.setup(this)
		this.composer.insertPass(shader.getPass(), this.composer.passes.length + order)
		
		for(let object of this.objects){
			this.syncEffectObject(object, shader)
		}
	}
	
	syncEffectObject(object, shader){
		shader.addEffectMesh(object.getEffectMesh())
	}
	
	addShaders(list){
		for(let shader of list){
			this.addShader(shader)
		}
	}
	
	applyTheme(theme){
		this.theme = theme
		theme.applyLight(this.scene)
		this.addShaders(theme.getShaders())
		
		for(let object of this.objects){
			object.applyTheme(theme)
		}
	}
	
	quickSetup(container, theme, object){
		this.applyTheme(theme)
		this.addObject(object)
		this.displayOn(container)
		this.registerCameraControls()
		this.startRendering()
	}
}