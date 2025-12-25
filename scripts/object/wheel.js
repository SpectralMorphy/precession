import * as THREE from 'three'
import { Theme } from '/scripts/theme.js'
import { BaseSceneObject } from './base.js'

export class Wheel extends BaseSceneObject {
	
	#radius = 1
	#length = 1
	
	param = {
		rimThick: 0.16,
		spokes: 8,
		spokeThick: 0.04,
		stickThick: 0.1,
		nodeThick: 0.2,
		ringThick: 0.1,
		planeRadius: 10,
		ropeLen: 500,
		textureSize: 1024,
		stripWidth: 0.04,
		strips: 1,
	}
	
	constructor(){
		super()
	
		const wheel = this.addGroupToBody('wheel')
		wheel.position.z = this.length
		
		const rimGeometry = new THREE.TorusGeometry(this.radius, this.param.rimThick, 12, 16)
		this.addToGroup('wheel', 'rim', new THREE.Mesh(rimGeometry), 'MATERIAL_RIM')
		
		const spokeGeometry = new THREE.CylinderGeometry(this.param.spokeThick, this.param.spokeThick, this.radius)
		for(let i = 0; i < this.param.spokes; ++i){
			const spoke = new THREE.Mesh(spokeGeometry)
			const angle = Math.PI * 2 / this.param.spokes * i
			spoke.quaternion.setFromAxisAngle(new THREE.Vector3(0,0,1), -angle)
			spoke.position.x = this.radius / 2 * Math.sin(angle)
			spoke.position.y = this.radius / 2 * Math.cos(angle)
			this.addToGroup('wheel', 'spoke' + i, spoke, Theme.MATERIAL.SOLID_PRIME)
		}
		
		const stickGeometry = new THREE.CylinderGeometry(this.param.stickThick, this.param.stickThick, this.length)
		const stick = this.addObjectToBody('stick', new THREE.Mesh(stickGeometry), Theme.MATERIAL.SOLID_GRAY)
		stick.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2)
		stick.position.z = this.length / 2
		
		const ropeGeometry = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(0, this.param.ropeLen, 0)
		])
		this.addObject('rope', new THREE.Line(ropeGeometry), Theme.MATERIAL.LINE_DARK)
		
		const nodeGeometry = new THREE.SphereGeometry(this.param.nodeThick)
		this.addObject('node', new THREE.Mesh(nodeGeometry), Theme.MATERIAL.SOLID_DARK)
		
		const planeGeometry = new THREE.TorusGeometry(this.param.planeRadius, this.param.ringThick)
		const plane = this.addObject('plane', new THREE.Mesh(planeGeometry), Theme.MATERIAL.TRANS_DARK)
		plane.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2)
		
		this.addObject('grid', new THREE.PolarGridHelper(this.param.planeRadius, 32, 10, 64))
	}
	
	getSpecialMaterial(tag){
		if(tag == 'MATERIAL_RIM'){
			const material = this.getTheme().getMaterial(Theme.MATERIAL.SOLID_FLAT).clone()
			material.map = this.createStripTexture()
			return material
		}
	}
	
	createStripTexture(){
		const canvas = document.createElement('canvas')
		canvas.width = this.param.textureSize
		canvas.height = this.param.textureSize
		const context = canvas.getContext('2d')
		
		context.fillStyle = 'black'
		context.fillRect(0, 0, canvas.width, canvas.height)
		
		const stripWidth = this.param.textureSize * this.param.stripWidth
		context.fillStyle = 'white'
		context.fillRect(
			stripWidth / 2,
			0,
			canvas.width - stripWidth,
			canvas.height
		)
		
		const texture = new THREE.CanvasTexture(canvas)
		texture.wrapS = THREE.RepeatWrapping
		texture.wrapT = THREE.RepeatWrapping
		texture.offset.set(0.25, 0)
		
		return texture
	}
	
	get dir(){
		return new THREE.Vector3(0, 0, 1).applyQuaternion(this.body.quaternion)
	}
	
	get radius(){
		return this.#radius
	}
	set radius(radius){
		this.#radius = radius
		this.objects.wheel.scale.copy(new THREE.Vector3(radius, radius, radius))
	}
	
	get length(){
		return this.#length
	}
	set length(length){
		this.#length = length
		this.objects.stick.scale.y = length
		this.objects.stick.position.z = length / 2
		this.objects.wheel.position.z = length
	}
	
	// currentSlope(){
	// 	return new THREE.Vector3(0, 1, 0).angleTo(this.dir)
	// }
}