import { Viewport } from '/scripts/core.js'
import { Theme } from '/scripts/theme.js'
import { Wheel } from '/scripts/object/wheel.js'
import { NutationAnimation } from '/scripts/anim/nutation.js'
import { settings } from './settings.js'
import { GuiAdapter } from '/scripts/gui.js'

const viewport = new Viewport()
const theme = new Theme()
const wheel = new Wheel()
wheel.setAnimProto(NutationAnimation)
viewport.quickSetup(document.getElementById('canvas'), theme, wheel)
new GuiAdapter(settings(wheel), 'wheel')