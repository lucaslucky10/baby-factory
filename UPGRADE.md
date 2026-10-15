# Illustrated life edition

The original factory and genetics discussion remain the entry point in `index.html`. `preview.html` is a responsive, playable introduction to the new characters and four connected stories.

## What changed

- Larger expressive faces, softer palettes, fuller garment silhouettes, illustrated shoes and cheek shading. Sleeve roots are behind the torso, forearms in front, and thinking hands in front of the face. Arms and held props share wrist coordinates.
- Wrist-targeted arm posing, speaking mouth animation, gaze, staggered blinks, and a complete thoughtful pose while waiting for a choice. Pause and reduced-motion behavior remain supported.
- Five original vector environments: nursery, classroom, first home, living room and park. New plant, letter and camera props, plus details on the existing handheld objects. No new image, font, framework or runtime dependency.
- Four stories carry a childhood interest through setbacks, relationships and old age. Three choices affect later scenes. Interests are selected independently of purchases, IQ, sex and disability. New everyday scenes avoid treating test scores or career success as the whole of a life.
- QR version 3 stores all three choices. Versions 1 and 2 preserve their existing outcomes and stories. An unanswered choice uses a deterministic seed-based continuation, including when playback is skipped. A choice does not alter genetics, prices or earlier events.
- The mobile result page includes chapter shortcuts and selected-choice records. New character art also appears in the incubator, results, export cards and printed labels through the shared renderer.

## Run and verify

Serve this directory with a static HTTP server. Open `index.html` for the full game or `preview.html` for a quick playthrough. The Pages deployment still uses static files; there is no build step.

From a full Git checkout with Node.js:

```sh
node tests/regression.cjs
node tests/story.cjs
```

Open `tests/lifetime.html` and run the lifetime test, then open `tests/occlusion.html` and run the prop test. These use the browser's actual SVG bounds. The lifetime test covers 17 professions, three mobility conditions, desktop/mobile stage layouts and beginning/middle/end poses. The prop test covers 16 objects, five ages, three sex values, three mobility conditions, two hair textures and nine pose/time combinations.

Manually verify the full order → birth → three decisions → result flow, pause/resume, skip, the 390px layout, and the generated result card. Automated bounds checks detect clipping and unwanted overlap; they do not establish whether a drawing is appealing or a story is fun. Those require visual review and player feedback.

## Design references

The implementation is original. No third-party character artwork, game stories or runtime code were copied. The following official documentation informed the general approach:

- [Spine: inverse kinematics constraints](https://us.esotericsoftware.com/spine-ik-constraints) — make the hand reach a target, instead of positioning an object independently.
- [inkle: ink](https://www.inklestudios.com/ink/) — use remembered choices and later consequences to connect story beats.

This version is a new 2D vector art direction, not a photorealistic 3D character system.
