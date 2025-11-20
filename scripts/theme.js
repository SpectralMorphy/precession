import * as THREE from 'three'
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

export class Theme {
	solidMaterial = null
	solidFlatMaterial = null
	outlinePass = null
	effectTargets = []
	
	static MATERIAL = {
		BACKGROUND: 0,
		SOLID_PRIME: 1,
		SOLID_FLAT: 2,
		SOLID_GRAY: 3,
		DARK: 4,
		DARK_TRANS: 5,
	}
	
	hsl_colors = {
		[Theme.MATERIAL.BACKGROUND]:	[0.15, 0.90, 0.90],
		[Theme.MATERIAL.SOLID_PRIME]:	[0.10, 0.50, 0.77],
		[Theme.MATERIAL.SOLID_FLAT]:	[0.10, 0.50, 0.85],
		[Theme.MATERIAL.SOLID_GRAY]:	[0.10, 0.25, 0.55],
		[Theme.MATERIAL.DARK]:			[0.10, 0.50, 0.07],
		[Theme.MATERIAL.DARK_TRANS]:	[0.10, 0.50, 0.07],
	}
	
	materials = []
	
	constructor(){
		this.material_extras = {
			[Theme.MATERIAL.SOLID_FLAT]: {
				flatShading: true,
			},
			[Theme.MATERIAL.DARK_TRANS]: {
				_proto: THREE.MeshBasicMaterial,
				transparent: true,
				opacity: 0.5,
			},
		}
	}
	
	getColor(i){
		const hsl = this.hsl_colors[i]
		return new THREE.Color().setHSL(hsl[0], hsl[1], hsl[2])
	}
	
	getMaterial(i){
		if(this.materials[i]) return this.materials[i]
		
		const extras = Object.assign({}, this.material_extras[i] ?? {})
		const proto = extras._proto ?? THREE.MeshStandardMaterial
		delete extras._proto
		extras.color = this.getColor(i)
		
		const material = new proto(extras)
		this.materials[i] = material
		return material
	}
	
	applyLight(scene){
		scene.background = this.getColor(Theme.MATERIAL.BACKGROUND);
		
		const directionalLight = new THREE.DirectionalLight(0xffffff, 1.50);
		directionalLight.position.set(10, 20, 5);
		scene.add(directionalLight);
		
		const ambientLight = new THREE.AmbientLight(0xffffff, 1.65);
		scene.add(ambientLight);
	}
	
	applyEffects(container, composer, scene, camera){
		const resolution = new THREE.Vector2(container.clientWidth, container.clientHeight)
		
		this.outlinePass = new OutlinePass(
			resolution,
			scene,
			camera,
			this.effectTargets
		)
		
		this.outlinePass.downSampleRatio = 1
		this.outlinePass.edgeThickness = 4
		this.outlinePass.edgeStrength = 4
		this.outlinePass.hiddenEdgeColor = new THREE.Color('black')
		this.outlinePass.overlayMaterial.premultipliedAlpha = true
		this.outlinePass.overlayMaterial.blending = THREE.SubtractiveBlending
		
		composer.insertPass(this.outlinePass, composer.passes.length - 1)
	}
	
	updateScale(container){
		if(this.outlinePass) this.outlinePass.resolution = new THREE.Vector2(container.clientWidth, container.clientHeight)
	}
	
	addEffectObject(object){
		this.effectTargets.push(object)
	}
}