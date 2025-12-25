import * as THREE from 'three'
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
// import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export class CustomLine extends Line2 {
	#points = []
	#maxLength = 0
	#drawRange = 0

	constructor(maxLength = 1000){
		super(
			new LineGeometry(),
			new LineMaterial({
				color: 0x3344ff,
				linewidth: 8,
				resolution: new THREE.Vector2(1920, 1080),
			})
		)
		
		this.#maxLength = maxLength
		this.#drawRange = maxLength
	}
	
	reset(vec){
		this.#points = [vec.x, vec.y, vec.z]
		this.updateBuffer()
	}
	
	get maxLength(){
		return this.#maxLength
	}
	set maxLength(value){
		this.#maxLength = value
		
		if(value < this.length()){
			this.#points.splice(0, (this.length() - value) * 3)
			this.updateBuffer()
		}
	}

	length(){
		return this.#points.length / 3
	}

	push(vec){
		this.#points.push(vec.x)
		this.#points.push(vec.y)
		this.#points.push(vec.z)
		
		if(this.length() > this.maxLength){
			this.#points.shift()
			this.#points.shift()
			this.#points.shift()
		}
		
		this.updateBuffer()
	}
	
	setDrawRange(count){
		this.#drawRange = count
	}
	
	updateBuffer(){
		let start = Math.round(Math.max(0, this.length() - this.#drawRange - 1))
		this.geometry = new LineGeometry().setPositions(this.#points.slice(start*3, this.#points.length))
		this.geometry.applyQuaternion(this.quaternion)
	}
}