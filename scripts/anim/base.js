export class BaseAnimation {

	dt = 0.0001
	timeBuffer = 0
	#tracking = {}
	
	constructor(object){
		this.object = object
	}
	
	addOnScene(scene){
	}
	
	update(dt){
		this.timeBuffer += dt
		
		this.checkChanges()
		
		while(this.timeBuffer > this.dt){
			this.updateStep()
			this.timeBuffer -= this.dt
		}
	}
	
	updateStep(){
	}
	
	watch(object, key){
		if(!this.#tracking[key]){
			this.#tracking[key] = []
		}
		
		this.#tracking[key].push({
			object: object,
			value: object[key]
		})
	}
	
	checkChanges(){
		let change = false
	
		for(let [key, list] of Object.entries(this.#tracking)){
			for(let info of list){
				const value = info.object[key]
				if(value != info.value){
					this.onChange(info.object, key, info.value, value)
					info.value = value
					change = true
				}
			}
		}
		
		if(change){
			this.onChangeGlobal()
		}
	}
	
	onChange(object, key, old, newer){
	}
	
	onChangeGlobal(){
	}
}