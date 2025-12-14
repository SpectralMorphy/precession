import * as THREE from 'three'
import { OutlineShaderPass } from '/scripts/shader/outline.js'

export class Theme {
	solidMaterial = null
	solidFlatMaterial = null
	
	outline = new OutlineShaderPass({
		downSampleRatio: 0.5,
		edgeThickness: 8,
		edgeStrength: 9,
		visibleEdgeColor: new THREE.Color('white'),
		hiddenEdgeColor: new THREE.Color('black'),
		overlay_blending: THREE.SubtractiveBlending,
		overlay_premultipliedAlpha: true,
	})
	
	static COLORS = {
		BACKGROUND: 0,
		PRIME: 1,
		FLAT: 2,
		GRAY: 3,
		DARK: 4,
	}
	
	static MATERIAL = {
		BACKGROUND: 0,
		SOLID_PRIME: 1,
		SOLID_FLAT: 2,
		SOLID_GRAY: 3,
		SOLID_DARK: 4,
		TRANS_DARK: 5,
		LINE_DARK: 6,
	}
	
	hsl_colors = {
		[Theme.COLORS.BACKGROUND]:	[0.15, 0.90, 0.90],
		[Theme.COLORS.PRIME]:		[0.10, 0.50, 0.77],
		[Theme.COLORS.FLAT]:		[0.10, 0.50, 0.85],
		[Theme.COLORS.GRAY]:		[0.10, 0.25, 0.45],
		[Theme.COLORS.DARK]:		[0.10, 0.50, 0.07],
	}
	
	color_map = {
		[Theme.MATERIAL.BACKGROUND]: Theme.COLORS.BACKGROUND,
		[Theme.MATERIAL.SOLID_PRIME]: Theme.COLORS.PRIME,
		[Theme.MATERIAL.SOLID_FLAT]: Theme.COLORS.FLAT,
		[Theme.MATERIAL.SOLID_GRAY]: Theme.COLORS.GRAY,
		[Theme.MATERIAL.SOLID_DARK]: Theme.COLORS.DARK,
		[Theme.MATERIAL.TRANS_DARK]: Theme.COLORS.DARK,
		[Theme.MATERIAL.LINE_DARK]: Theme.COLORS.DARK,
	}
	
	materials = []
	
	constructor(){
		this.material_extras = {
			[Theme.MATERIAL.SOLID_FLAT]: {
				flatShading: true,
			},
			[Theme.MATERIAL.TRANS_DARK]: {
				_proto: THREE.MeshBasicMaterial,
				transparent: true,
				opacity: 0.5,
			},
			[Theme.MATERIAL.LINE_DARK]: {
				_proto: THREE.LineBasicMaterial,
				linewidth: 5,
			},
		}
	}
	
	getColor(matId){
		const colId = this.color_map[matId]
		const hsl = this.hsl_colors[colId]
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
	
	getShaders(){
		return [this.outline]
	}
	
	updateScale(container){
		if(this.outlinePass) this.outlinePass.resolution = new THREE.Vector2(container.clientWidth, container.clientHeight)
	}
}