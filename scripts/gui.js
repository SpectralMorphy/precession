import GUI from 'lil-gui';
import { loc } from '/scripts/loc.js'

const LOC = await loc()

export class GuiAdapter {
	constructor(settings, loc_tag){
		this.gui = new GUI({width: 500})
		if(loc_tag) this.loc = LOC[loc_tag]
		
		for(const data of settings){
			this._add_controller(this.gui, data, loc)
		}
	}
	
	_add_controller(target, data, loc){
		const name = data.name
		const key = data.key ?? name
		const step = data.step ?? 0.01
		let ctrl
		
		if(data.value != undefined){
			data.object[key] = data.value
		}
		
		if(data.interval){
			ctrl = target.add(data.object, key, data.interval[0], data.interval[1])
		}
		else{
			ctrl = target.add(data.object, key)
		}
		
		if(typeof(data.object[key]) == 'function'){
			ctrl.onChange(() => this.updateDisplay())
		}
		
		ctrl.step(step)
		if(data.decimals){
			ctrl.decimals(data.decimals)
		}
		
		if(this.loc?.[name]){
			ctrl.name(this.loc[name])
		}
	}
	
	updateDisplay(){
		this.gui.controllers.forEach(ctrl => ctrl.updateDisplay())
	}
}