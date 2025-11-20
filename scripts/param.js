export class ParamHolder {
	_getDefaultParam(){ return {} }
	
	get param(){
		return this._param
	}
	
	set param(v){
		this._param = Object.assign({}, this._getDefaultParam(), v)
	}
	
	constructor(param){
		this.param = param ?? {}
	}
}