import { Vector2 } from 'three'
import { ShaderPass } from '/scripts/shader/base.js'
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

export class OutlineShaderPass extends ShaderPass {
	getReso(width, height){
		return new Vector2(width, height)
	}

	setup(port){
		this.pass = new OutlinePass(
			this.getReso(port.width, port.height),
			port.scene,
			port.camera,
			this.meshes
		)
	}
	
	updateScale(width, height){
		if(this.pass)
			this.pass.resolution = this.getReso(width, height)
	}
	
	_applyParam(name, value){
		if(name.startsWith('overlay_')){
			name = name.replace(/^overlay_/, '')
			this.pass.overlayMaterial[name] = value
		}
		else{
			super._applyParam(name, value)
		}
	}
}