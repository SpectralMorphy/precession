import GUI from 'lil-gui';
import { loc } from '/scripts/loc.js'

const LOC = await loc()

export class GuiAdapter {
	constructor(settings, loc_tag){
		if(loc_tag) this.loc = LOC[loc_tag]
		
		this.gui = new GUI({
			width: 500,
			title: this.getLoc('controls'),
		})
		
		this._add_folder(this.gui, settings)
	}
	
	_add_folder(target, folder){
		for(const data of folder){
			this._add_controller(target, data)
		}
	}
	
	_add_controller(target, data){
		const name = data.name
		const key = data.key ?? name
		let ctrl
		
		if(data.folder){
			ctrl = target.addFolder(this.getLoc(name))
			this._add_folder(ctrl, data.folder)
		}
		else{
			if(data.value != undefined){
				data.object[key] = data.value
			}
			
			if(data.interval){
				ctrl = target.add(data.object, key, data.interval[0], data.interval[1])
			}
			else{
				ctrl = target.add(data.object, key)
			}
			
			ctrl.name(this.getLoc(name))
			
			if(typeof(data.object[key]) == 'function'){
				let onChange = () => {
					if(data.onChange) data.onChange(ctrl, this)
				}
			
				ctrl.onChange(() => {
					onChange()
					this.updateDisplay()
				})
				
				onChange()
			}
			
			ctrl.step(data.step ?? 0.01)
			if(data.decimals){
				ctrl.decimals(data.decimals)
			}
		}
	}
	
	getLoc(name){
		return this.loc?.[name] ?? name
	}
	
	updateDisplay(){
		this.gui.controllers.forEach(ctrl => ctrl.updateDisplay())
	}
}