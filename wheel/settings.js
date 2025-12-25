export function settings(wheel) {
	return [
		{
			name: 'pause',
			object: wheel.anim,
			key: 'togglePause',
			onChange(ctrl, gui){
				ctrl.name(gui.loc['pause' + +this.object.isPaused()])
			}
		},
		{
			name: 'restart',
			object: wheel.anim,
		},
		{
			name: 'starter',
			folder: [
				{
					name: 'slope',
					object: wheel.anim,
					interval: [0, 180],
					step: 1,
					value: 90,
					// decimals: 0, ne fixit
				},
				{
					name: 'angular',
					object: wheel.anim,
					key: 'wIni',
					interval: [0.5, 10],
					value: 1,
				},
				{
					name: 'clockwise',
					object: wheel.anim,
					value: false,
				},
				{
					name: 'precess',
					object: wheel.anim,
					interval: [-180, 180],
					step: 1,
					value: 0,
				},
				// {
				// 	name: 'regular',
				// 	object: wheel.anim,
				// 	key: 'regularPrecess',
				// },
			],
		},
		{
			name: 'shape',
			folder: [
				{
					name: 'radius',
					object: wheel,
					interval: [0.5, 5],
					value: 2.5,
				},
				{
					name: 'length',
					object: wheel,
					interval: [1, 10],
					value: 5,
				},
			],
		},
		{
			name: 'trail',
			object: wheel.anim,
			key: 'trailLength',
			interval: [0, 10],
			value: 0
		},
	]
}