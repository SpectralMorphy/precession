export function settings(wheel) {
	return [
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
		}
	]
}