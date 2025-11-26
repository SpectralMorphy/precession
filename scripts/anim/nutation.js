import { Vector3, Quaternion } from "three"
import GUI from 'lil-gui';

export class NutationAnimation {
	_getDefaultParam(){
		return {
			
		}
	}
	param;
	sceneRef = null;
	angleL = 0
	rotSpd = 2;
	setupGUI(){
		const gui = new GUI({ width: 300 });
			
			const f1 = gui.addFolder('Колесо');
			f1.add(this.param, 'rotationSpeed', 360, 1200).name('Скорость вращения колеса').listen();
			return f1;
		}
	
	update(target, dt){
		this.param.angle = 9 * 360 / this.param.rotationSpeed;
		const dprec = this.param.precessionSpeed * Math.PI / 180 * dt
		const precQuat = new Quaternion().setFromAxisAngle(this.param.axisY, dprec)
		target.applyQuaternion(precQuat)
		target.quaternion.normalize()
		this.vecL.applyQuaternion(precQuat).normalize()
		
		const sin = Math.sin(this.param.angle * Math.PI / 180)
		const dnut = sin ? (dprec / sin) : 0
		const nutQuat = new Quaternion().setFromAxisAngle(this.vecL, dnut)
		target.applyQuaternion(nutQuat)
		target.quaternion.normalize()
		
		const rotAxis = this.param.axisZ.clone().applyQuaternion(target.quaternion)
		const drot = this.param.rotationSpeed * Math.PI / 180 * dt
		const rotQuat = new Quaternion().setFromAxisAngle(rotAxis, drot)
		target.applyQuaternion(rotQuat)
		target.quaternion.normalize()
	}
	doScene(scene)
	{
		// this.sceneRef = scene;
		scene.add(this.setupGUI());
	}
	constructor(param){
		this.param = param;
		const axisX = new Vector3().crossVectors(this.param.axisY, this.param.axisZ)
		this.vecL = this.param.axisZ.clone().applyAxisAngle(axisX, this.param.angle * Math.PI / 180)
	}
}