import { Vector3, Quaternion } from "three"
import { ParamHolder } from "/scripts/param.js"

export class NutationAnimation extends ParamHolder {
	_getDefaultParam(){
		return {
			axisY: new Vector3(0, 1, 0),
			axisZ: new Vector3(0, 0, 1),
			angle: 12,
			precessionSpeed: 24,
			rotationSpeed: 360,
		}
	}
	
	angleL = 0
	
	update(target, dt){
		const dprec = this.param.precessionSpeed * Math.PI / 180 * dt
		const precQuat = new Quaternion().setFromAxisAngle(this.param.axisY, dprec)
		target.applyQuaternion(precQuat)
		target.quaternion.normalize()
		this.vecL.applyQuaternion(precQuat).normalize()
		
		const sin = Math.sin(this.param.angle * Math.PI / 180)
		const dnut = sin ? dprec / sin : 0
		const nutQuat = new Quaternion().setFromAxisAngle(this.vecL, dnut)
		target.applyQuaternion(nutQuat)
		target.quaternion.normalize()
		
		const rotAxis = this.param.axisZ.clone().applyQuaternion(target.quaternion)
		const drot = this.param.rotationSpeed * Math.PI / 180 * dt
		const rotQuat = new Quaternion().setFromAxisAngle(rotAxis, drot)
		target.applyQuaternion(rotQuat)
		target.quaternion.normalize()
	}
	
	constructor(param){
		super(param)
		
		const axisX = new Vector3().crossVectors(this.param.axisY, this.param.axisZ)
		this.vecL = this.param.axisZ.clone().applyAxisAngle(axisX, this.param.angle * Math.PI / 180)
	}
}