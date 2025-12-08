export class ShaderPass {
	param = null
	applied = false
	pass = null
	meshes = []
	
	constructor(param){
		this.param = param ?? {}
	}
	
	_applyParams(){
		if(this.applied) return
		this.applied = true
		
		if(!this.pass){
			throw 'pass have not been set up yet'
		}
		
		for(let [name, value] of Object.entries(this.param)){
			this._applyParam(name, value)
		}
	}
	
	updateParam(name, value){
		this.param[name] = value
		
		if(this.pass)
			this._applyParam(name, value)
	}
	
	_applyParam(name, value){
		this.pass[name] = value
	}
	
	getPass(){
		this._applyParams()
		return this.pass
	}
	
	setup(port){
		throw '"setup" is not overriden'
	}
	
	updateScale(width, height){
		
	}
	
	addEffectMesh(mesh){
		this.meshes.push(mesh)
	}
}