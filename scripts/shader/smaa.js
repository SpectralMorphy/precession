import { ShaderPass } from '/scripts/shader/base.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';

export class SMAAShaderPass extends ShaderPass {
	setup(port){
		// this.pass = new SMAAPass(port.width, port.height);
		this.pass = new FXAAPass();
	}
	
	updateScale(width, height){
		// this.pass.setSize(width, height)
	}
}