# R-Law Fly-In

A browser flight sim: fly a Piper J-3 Cub, a Cessna 180K Skywagon, a Lockheed C-130H Hercules, a Grumman F-14A Tomcat or a toy-brick jet into a fictional grass-strip fly-in in the East Texas piney woods on a late-October afternoon, or out to a carrier in the Gulf.

**Play it:** https://mattj3.github.io/flight-sims/

- Single-file page (`index.html`), built on Three.js r128 loaded from cdnjs. No build step.
- Six-degree-of-freedom flight model at 120 Hz with prop slipstream, P-factor, ground effect and spring-damper gear.
- Four aircraft from book figures, plus one that isn't: the 65 hp J-3 Cub (no flaps, solo from the back seat, and, just for fun, two rockets under the wings on J), the 230 hp 180K Skywagon (constant-speed prop, 40° flaps, six-pack panel, stall horn) and the C-130H Hercules (four 4,591 shp turboprops, Fowler flaps, gear that folds into the side pods, eight JATO bottles on J, flown at a 101,000 lb assault-landing weight; pull the throttle past idle on the ground for reverse pitch) and the F-14A Tomcat (two TF30s with afterburner, a wing that sweeps itself from 20° to 68° with Mach, retractable gear and a tailhook, HUD and AoA indexer, 6.5 g). The fifth is the Brick Jet, a toy-brick fighter blown up to full size, with studded black delta wings, teal strakes with pink lightning bolts, twin fins and a minifig pilot. It has a burner and a tailhook, rolls fast and pulls 9 g.
- Auto trim (on by default) holds your speed when you let go of the stick; auto rudder is on by default on phones.
- **Carrier:** USS Theodore Roosevelt (CVN-71) steaming into the wind 80 nm south of Galveston with 27 kt over the deck. Catapult off the bow, then fly the ball on the Fresnel lens at 15 units and catch one of four wires on the 9° angled deck. Paddles talks you down, grades the pass and calls bolters and wave-offs. The Cub, 180 and C-130 can land on the straight deck and take off from it with no cat.
- Calm, light or gusty wind; trees, parked planes, buildings and ponds to avoid. There's a Moon mode too.
- **Machine guns** (menu, off by default): K, the red FIRE button on a phone, gamepad LB or a USB flight stick's trigger fires, and SET FIRE BUTTON in the menu binds any joystick button. The F-14's M61 Vulcan is the real thing: 6,000 rounds a minute and 675 rounds, about seven seconds of trigger. The Cub, 180 and C-130 never carried forward guns, so they get a pair of wing-mounted .50 cals just for fun, and the Brick Jet gets twin brick blasters. Rounds fly ballistic paths with every few a tracer, and the recoil is modelled: a long burst slows a Cub, because two .50s push back harder than its 65 hp pulls.
- **Free fly · kids** (WHERE in the menu): the R-Law scenery with no crashing. Hit the ground or a tree and you bounce back up into the sky. Five slow, brightly painted target planes circle the field, the guns are always on and never run out, and four hits sends one down in a trail of smoke to explode where it hits the ground. The data strip counts your kills.
- **Ultra low** for old computers: open https://mattj3.github.io/flight-sims/?lite or press ULTRA LOW · OLD PCs in the menu. It drops shadows, antialiasing, the depth trick, most trees and the resolution, shortens the view, and caps the frame rate at 30. Flying is identical. The normal version is unchanged.
- Keyboard, mouse, gamepad or phone. On a phone, turn it sideways: throttle slider on the left, stick on the right. On iPhone, Share → Add to Home Screen gives a full-screen view.

The town, field and scenery are fictional and generated, not surveyed.
