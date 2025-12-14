import * as THREE from "three"

export class CustomArrow extends THREE.Group {

	_AddComponent(object, pos){
		object.position.z = pos
		object.rotation.x = Math.PI / 2
		this.add(object)
		return object
	}
	
	_InitMaterials(){
		this.innerMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			depthTest: true,
			depthWrite: true
		});
		
		this.outlineMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			depthTest: false,
			depthWrite: false,
			transparent: true,
			opacity: 0.4
		});
	}
	
	constructor(length = 20, bodyWidth = 1, headLengthM = 0.15, headWidthM = 4) {
		super()
		
		const bodyLen = 1 - headLengthM
		const headLen = headLengthM
		
		const bodyPos = bodyLen / 2
		const headPos = bodyLen + headLen / 2
		
		const bodyGeometry = new THREE.CylinderGeometry(bodyWidth / 2, bodyWidth / 2, bodyLen);
		const headGeometry = new THREE.ConeGeometry(bodyWidth * headWidthM / 2, headLen);
		
		this._InitMaterials()
		
		this.innerBody = this._AddComponent(new THREE.Mesh(bodyGeometry, this.innerMaterial), bodyPos)
		this.outerBody = this._AddComponent(new THREE.Mesh(bodyGeometry, this.outlineMaterial), bodyPos)
		this.innerHead = this._AddComponent(new THREE.Mesh(headGeometry, this.innerMaterial), headPos)
		this.outerHead = this._AddComponent(new THREE.Mesh(headGeometry, this.outlineMaterial), headPos)
		
		this.length = length
	}
	
	set length(value){
		this.scale.set(1, 1, value)
	}
	
	get length(){
		return this.scale.z
	}
	
	fromVector(vec){
		this.lookAt(vec)
		this.length = vec.length()
	}
}