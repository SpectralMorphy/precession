import { Vector3, Quaternion, Vector2, Matrix3 } from "three"
import { CustomArrow } from '/scripts/shape/arrow.js'
import { CustomLine } from '/scripts/shape/line.js'
import { BaseAnimation } from "./base.js"

var log = false

export class NutationAnimation extends BaseAnimation {
	
	m = 1
	g = 10
	wIni = 1
	slope = 90
	clockwise = false
	precess = 0
	
	phase = 0
	circle = []
	
	trailDT = 0.01
	trailMax = 10
	#trailLength = 0

	constructor(object){
		super(object)
		
		this.arrow = new CustomArrow(1, 0.05)
		this.trail = new CustomLine(this.trailMax / this.trailDT)
		
		this.watch(object, 'radius')
		this.watch(object, 'length')
		this.watch(this, 'slope')
		this.watch(this, 'wIni')
		this.watch(this, 'clockwise')
		this.watch(this, 'precess')
		
		this.restart()
		this.togglePause()
	}
	
	restart(){
		const m = this.m
		const r = this.object.radius
		const g = this.g
		
		this.vF = new Vector3(0, - m * g, 0)
		this.kLVisual = 1 / (r**2 * Math.PI)
		
		this.phase = 0
		this.circle = []
		
		this.qS = this.getIniQ()
		this.vL = this.getIniL()
		
		this.trail.reset(this._vS())
		this.trailBufferT = 0
		
		this.updateObjects()
	}
	
	getIniQ(){
		const slope = (this.slope - 90) / 180 * Math.PI
		
		return new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), slope)
	}
	
	getIniL(){
		const m = this.m
		const r = this.object.radius
		const s = this.object.length
		const vS = this._vS(this.getIniQ())
		
		const precess = this.precess / 180 * Math.PI
		const wIni = this.wIni * Math.PI * 2 * (this.clockwise ? -1 : 1)
		const Iprec = m * (r**2 / 2 + s**2)
		const vLprec = new Vector3(0, precess * Iprec, 0)
		
		return new Vector3(0, 0, 1)
			.applyQuaternion(this.getIniQ())
			.multiplyScalar(m * wIni * r**2)
			.add(vLprec)
	}
	
	regularPrecess(){
		const vM = this._vS(this.getIniQ()).cross(this.vF)
		const vLhor = this.getIniL()
		vLhor.y = 0
		
		const precess = vM.clone().cross(vLhor).length() / vLhor.length()**2
		this.precess = precess / Math.PI * 180
	}
	
	addOnScene(scene){
		scene.add(this.arrow)
		scene.add(this.trail)
	}
	
	updateStep(){
		const dt  = this.dt
		const r = this.object.radius
		const s = this.object.length
		const vF = this.vF
	
		const vS = this._vS()
		const vM = vS.clone().cross(vF)
		const vdL = vM.clone().multiplyScalar(dt)
		const vdLn = this.vL.clone().cross(vdL).divideScalar(this.vL.length()**2)
		const vdLt = vdL.clone().projectOnVector(this.vL)
		
		this.vL.add(vdLt)
		this.vL.applyAxisAngle(vdLn.clone().normalize(), vdLn.length())
		
		const angl = vS.angleTo(this.vL)
		const dist = s * Math.sin(angl)
		const I0 = this.m * r**2
		const Ia = I0 * (1 + Math.cos(angl)**2) / 2
		const I = Ia + this.m * dist**2
		const vw = this.vL.clone().divideScalar(I)
		const vdQ = vw.clone().multiplyScalar(dt)
		const qdQ = new Quaternion().setFromAxisAngle(vdQ.clone().normalize(), vdQ.length())
		
		this.qS.premultiply(qdQ)
		
		this.calcPhase()
		this.updateTrail()
		this.updateObjects()
	}
	
	get trailLength(){
		return this.#trailLength
	}
	set trailLength(value){
		this.#trailLength = value
		this.trail.setDrawRange(value / this.trailDT)
	}
	
	updateTrail(){
		this.trailBufferT += this.dt
		if(this.trailBufferT >= this.trailDT){
			this.trailBufferT -= this.trailDT
			
			this.trail.push(this._vS())
		}
	}
	
	updateObjects(){
		this.object.getEffectMesh().quaternion.copy(this.qS)
		this.arrow.fromVector(this.vL.clone().multiplyScalar(this.kLVisual))
	}
	
	calcPhase(){
		const preq = this._getPreq(this.vL)
		const vNormPos = this._vS().clone().applyQuaternion(preq.invert())
		const vNormPos2D = new Vector2(vNormPos.x, vNormPos.y)
		this.circle.push(vNormPos2D)
		
		if(this.circle.length > 3){
			this.circle.shift()
			
			const vCenter = this._circleCenter()
			const vDelta = vNormPos2D.clone().sub(vCenter)
			this.phase = Math.atan2(vDelta.x, -vDelta.y) / (Math.PI * 2) + 0.5
		}
		else{
			this.phase = 0
		}
	}
	
	_vS(q = this.qS){
		return new Vector3(0, 0, this.object.length).applyQuaternion(q)
	}
	
	_getPreq(vec){
		const vStart = new Vector3(0, 0, 1)
		const vProj = vec.clone()
		vProj.y = 0
		if(vProj.length() == 0) vProj.z = 1
		const vPrecDir = vStart.clone().cross(vProj).normalize()
		if(vPrecDir.length() == 0) vPrecDir.y = 1
		const precAngle = vStart.angleTo(vProj)
		return new Quaternion().setFromAxisAngle(vPrecDir, precAngle)
	}
	
	_circleCenter(){
		const v1 = this.circle[0]
		const v2 = this.circle[1]
		const v3 = this.circle[2]
		const r1 = v1.length()**2
		const r2 = v2.length()**2
		const r3 = v3.length()**2
		
		const xM = new Matrix3(
			r1, v1.y, 1,
			r2, v2.y, 1,
			r3, v3.y, 1
		)
		
		const yM = new Matrix3(
			v1.x, r1, 1,
			v2.x, r2, 1,
			v3.x, r3, 1
		)
		
		const mM = new Matrix3(
			v1.x, v1.y, 1,
			v2.x, v2.y, 1,
			v3.x, v3.y, 1
		)
		
		const den = mM.determinant() * 2
		
		return new Vector2(xM.determinant() / den, yM.determinant() / den)
	}
	
	onChangeGlobal(){
		this.refresh()
	}
	
	refresh(){
		const oldPreq = this._getPreq(this._vS())
		const oldPhase = this.phase
		
		this.restart()
		this.reachPhase(oldPhase)
		
		const preq = this._getPreq(this._vS())
		const fixPreq = oldPreq.clone().multiply(preq.invert())
		
		this.qS.premultiply(fixPreq)
		this.vL.applyQuaternion(fixPreq)
		this.trail.reset(this._vS())
		
		this.updateObjects()
	}
	
	reachPhase(phase){
		let oldphase = 0
		let repeat = 0
		let iter = 0
		const repeatLimit = 100
		
		while(true){
			if(this.phase >= phase){
				return
			}
			
			this.updateStep()
			
			if(this.phase < oldphase - 0.01){
				return
			}
			
			if(this.phase == oldphase){
				if(repeat > repeatLimit){
					return
				}
				repeat++
			}
			else{
				repeat = 0
			}
			
			oldphase = this.phase
			iter++
		}
	}
}