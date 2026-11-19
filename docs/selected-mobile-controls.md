# Selected mobile-control audit

This audit covers the 33 selected games. The shared shell should not put a generic movement pad over games that are controlled by tapping, dragging, swiping, or selecting on-screen UI. For games that need simultaneous movement and actions, movement stays on the left and actions stay on the right.

| Game | Mobile control decision |
|---|---|
| Excruciating Phone | Uses its own drawing, typing and pass-the-device interface; no movement overlay. |
| Undertale | Keep the game's native left joystick and Z / X / Shift action controls. |
| Deltarune | Left virtual joystick; right-side Confirm (Z), Cancel (X) and Menu (Esc). |
| Papa's Pizzeria | Native tap-and-drag order workflow; no movement overlay. |
| BitLife | Native tap-driven menus; no movement overlay. |
| Jetpack Joyride | One right-side Fly button (Space); holding it controls lift. |
| Moto X3M | Right-side Gas, Brake and left/right Flip buttons; no joystick. |
| Rooftop Snipers | Left directional pad; right-side Jump and Shoot buttons. |
| OvO | Left virtual joystick; right-side Jump (Space). |
| PolyTrack | Right-side steering, Accelerate and Brake buttons; no joystick. |
| Draw the Hill | Native pointer drawing interaction; no movement overlay. |
| Bad Time Simulator | Left directional pad; right-side Confirm (Z), Cancel (X) and Focus (Shift). |
| Five Nights at Freddy's 1 | Native tap/click for doors, lights and cameras; no movement overlay. |
| Five Nights at Freddy's 2 | Native tap/click for cameras, mask and flashlight; no movement overlay. |
| Five Nights at Freddy's 3 | Native tap/click for cameras and systems; no movement overlay. |
| Five Nights at Freddy's 4 | Native tap/click and hold interactions; no movement overlay. |
| Drift Boss | One right-side Turn button (Space); no joystick. |
| Drive Mad | Right-side Gas and Brake buttons; no joystick. |
| Cut the Rope | Native swipe/drag interaction; no movement overlay. |
| Paper.io 2 | Native directional swipe/drag interaction; no duplicate movement overlay. |
| Stickman Hook | One right-side Hook / Release button (Space); no joystick. |
| Tiny Fishing | Native cast, drag and reel interaction; no movement overlay. |
| Subway Surfers | Left virtual joystick for lane changes and movement; right-side Jump and Roll actions. |
| Friday Night Funkin' | Left four-direction note pad; right-side Accept (Enter) and Back (Esc). |
| Backflip Dive 3D | Right-side Left, Right and Jump buttons; no joystick. |
| Monkey Mart | Left virtual joystick; right-side Interact (E). |
| Henry Stickmin: Breaking the Bank | Native tap/click choice interface; no movement overlay. |
| Henry Stickmin: Escaping the Prison | Native tap/click choice interface; no movement overlay. |
| Henry Stickmin: Stealing the Diamond | Native tap/click choice interface; no movement overlay. |
| Henry Stickmin: Infiltrating the Airship | Native tap/click choice interface; no movement overlay. |
| Henry Stickmin: Fleeing the Complex | Native tap/click choice interface; no movement overlay. |
| Google Feud | Native text entry and tap selection; no movement overlay. |
| EaglercraftX 1.8 | Left Minecraft movement joystick and right-side look surface, Jump, Sprint, Sneak, Inventory, Mine, Use, Chat, Menu and 1–9 hotbar. |

## Verification checklist

- Keep the catalogue at 33 selected titles without removing or hiding other games.
- Check each selected game's browser-tab icon against its page's local favicon link.
- Check that shell controls are shown only on coarse-pointer devices and can be hidden.
- Check that held keys and mouse buttons release on pointer cancellation, blur and page hiding.
- Test each control profile in the actual game, not just by checking that the buttons render.
