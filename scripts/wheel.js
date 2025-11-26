import * as THREE from 'three'
import { Vector3, Quaternion } from "three"	
import { Theme } from '/scripts/theme.js'

export class Wheel {
	body = null
	anim = null
	_rim = null
	_stick = null
	_spokes = []
	_rope = null
	_node = null
	_plane = null
	_theme = null
	
	param = {
		radius: 16,
		rimThick: 2.5,
		stickThick: 1,
		stickLen: 40,
		spokes: 8,
		spokeThick: 0.66,
		ropeLen: 5000,
		ropeThick: 0.6,
		nodeThick: 2,
		planeRadius: 60,
		axisY: new Vector3(0, 1, 0),
		axisZ: new Vector3(0, 0, 1),
		angle: 12,
		precessionSpeed: 24,
		rotationSpeed: 360,
	}

	createMesh(){
		this.body = new THREE.Group()
		
		const material = new THREE.MeshBasicMaterial()
		
		const rimGeometry = new THREE.TorusGeometry(this.param.radius, this.param.rimThick, 12, 16)
		this._rim = new THREE.Mesh(rimGeometry, material)
		this._rim.position.z = this.param.stickLen
		this.body.add(this._rim)
		
		const stickGeometry = new THREE.CylinderGeometry(this.param.stickThick, this.param.stickThick, this.param.stickLen)
		this._stick = new THREE.Mesh(stickGeometry, material)
		this.body.add(this._stick)
		this._stick.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2)
		this._stick.position.z = this.param.stickLen / 2
		
		const spokeGeometry = new THREE.CylinderGeometry(this.param.spokeThick, this.param.spokeThick, this.param.radius)
		for(let i = 0; i < this.param.spokes; ++i){
			const spokeMesh = new THREE.Mesh(spokeGeometry, material)
			this.body.add(spokeMesh)
			const angle = Math.PI * 2 / this.param.spokes * i
			spokeMesh.quaternion.setFromAxisAngle(new THREE.Vector3(0,0,1), -angle)
			spokeMesh.position.x = this.param.radius / 2 * Math.sin(angle)
			spokeMesh.position.y = this.param.radius / 2 * Math.cos(angle)
			spokeMesh.position.z = this.param.stickLen
			this._spokes.push(spokeMesh)
		}
		
		const ropeGeometry = new THREE.CylinderGeometry(this.param.ropeThick, this.param.ropeThick, this.param.ropeLen)
		this._rope = new THREE.Mesh(ropeGeometry, material)
		this._rope.position.y = this.param.ropeLen / 2
		
		const nodeGeometry = new THREE.SphereGeometry(this.param.nodeThick)
		this._node = new THREE.Mesh(nodeGeometry, material)
		
		const planeGeometry = new THREE.TorusGeometry(this.param.planeRadius, this.param.ropeThick)
		this._plane = new THREE.Mesh(planeGeometry)
		this._plane.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2)
		
		if(this._theme){
			this.setTheme(this._theme)
		}
	}

	setTheme(theme){
		this._theme = theme
		
		if(!this.body) return
		theme.addEffectObject(this.body)
		this._rim.material = theme.getMaterial(Theme.MATERIAL.SOLID_FLAT)
		this._stick.material = theme.getMaterial(Theme.MATERIAL.SOLID_GRAY)
		this._spokes.forEach(spoke => spoke.material = theme.getMaterial(Theme.MATERIAL.SOLID_PRIME))
		this._rope.material = theme.getMaterial(Theme.MATERIAL.DARK)
		this._node.material = theme.getMaterial(Theme.MATERIAL.DARK)
		this._plane.material = theme.getMaterial(Theme.MATERIAL.DARK_TRANS)
	}
	
	addToScene(scene){
		scene.add(this.body)
		scene.add(this._rope)
		scene.add(this._node)
		scene.add(this._plane)
		if (this.anim != null)
		{
			this.anim.doScene(scene);
		}
	}
	
	update(dt){
		// for(let i = 0; i < 50; ++i)
		this.anim?.update(this.body, dt)
	}
}