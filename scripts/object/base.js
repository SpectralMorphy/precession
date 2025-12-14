import * as THREE from 'three'

export class BaseSceneObject {
	body = new THREE.Group()
	#scene = null
	#theme = null
	#anim = null
	#objects = {}
	#scened = {}
	#materials = {}
	
	addObject(name, object, materialTag){
		this.#objects[name] = object
		
		this.#materials[name] = materialTag
		this.#setObjectTheme(name)
		
		this.#scened[name] = true
		this.#scene?.add(object)
		
		return object
	}
	
	addObjectToBody(name, object, materialTag){
		this.#objects[name] = object
		
		this.#materials[name] = materialTag
		this.#setObjectTheme(name)
		
		this.body.add(object)
		
		return object	
	}
	
	addGroup(name){
		const group = new THREE.Group()
		this.#objects[name] = group
		
		this.#scened[name] = true
		this.#scene?.add(group)
		
		return group
	}
	
	addGroupToBody(name){
		const group = new THREE.Group()
		this.#objects[name] = group
		
		this.body.add(group)
		
		return group
	}
	
	addToGroup(groupName, name, object, materialTag){
		this.#objects[name] = object
		
		this.#materials[name] = materialTag
		this.#setObjectTheme(name)
		
		this.#objects[groupName].add(object)
		
		return object
	}
	
	get objects(){
		return this.#objects
	}
	
	getEffectMesh(){
		return this.body
	}
	
	get scene(){
		return this.#scene
	}	
	addOnScene(scene){
		this.#scene = scene
		
		scene.add(this.body)
		for(let name in this.#scened){
			scene.add(this.#objects[name])
		}
		
		this.#anim?.addOnScene(scene)
	}
	
	setTheme(theme){
		this.#theme = theme
		for(let name in this.#objects){
			this.#setObjectTheme(name)
		}
	}
	#setObjectTheme(name){
		if(!this.#theme) return
		const materialTag = this.#materials[name]
		if(materialTag == undefined) return
		this.#objects[name].material = this.#theme.getMaterial(materialTag)
	}
	
	setAnimProto(anim){
		this.#anim = new anim(this)
	}
	get anim(){
		return this.#anim
	}
	
	update(dt){
		this.#anim?.update(dt)
	}
}