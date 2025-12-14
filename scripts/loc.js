var cached = null

export async function loc(){
	return new Promise(async resolve => {
		if(cached){
			resolve(cached)
			return
		}
		
		const resp = await fetch('../localization/ru.json')
		resolve(await resp.json())
	})
}