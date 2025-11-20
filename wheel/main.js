import { Viewport } from '/scripts/core.js'
import { Theme } from '/scripts/theme.js'
import { Wheel } from '/scripts/wheel.js'
import { NutationAnimation } from '/scripts/anim/nutation.js'

const viewport = new Viewport()
const theme = new Theme()
const wheel = new Wheel()
wheel.anim = new NutationAnimation()

viewport.quickSetup(document.body, theme, wheel)