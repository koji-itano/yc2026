### Your Exported Project
This zip contains your project source code, assets, image targets, and configuration needed to build and publish your 8th Wall project. It does not connect to any 8th Wall services, so will work even after the 8th Wall servers are shut down.

### Setup
If node/npm are not installed, install using https://github.com/nvm-sh/nvm or https://nodejs.org/en/download.

Run `npm install` in this folder.

### Development
Run `npm run serve` to run the development server.

### iPhone HTTPS development

For camera-based testing on iPhone over the same Wi-Fi:

1. Run `npm install`.
2. Generate local certificates with `npm run cert:dev`.
3. Start the LAN HTTPS server with `npm run serve:iphone`.
4. Open one of the printed `https://<LAN-IP>:8443/` URLs on the iPhone.

Notes:

- `npm run cert:dev` prefers `mkcert` when available and falls back to a self-signed OpenSSL cert.
- Trusted local HTTPS works best with `mkcert`. If Safari blocks camera access, install the local CA on the phone or use a public HTTPS tunnel.
- The local mkcert root CA is typically at `~/Library/Application Support/mkcert/rootCA.pem`. AirDrop it to the iPhone, install the profile, then enable full trust in `Settings > General > About > Certificate Trust Settings`.
- Generated certificates are stored in `certs/` and are ignored by git.
- On iPhone, the default image target profile is `maisen-box-tight`, generated as a `PLANAR` target from the cropped Maisen box front image. Use `?target=all` only if you need to test multiple targets.
- For the best `imagefound` result, keep the Maisen box front flat, upright, evenly lit, and filling roughly 40-60% of the frame.
- The scene camera is configured as `World` / `xrCameraType: world` so 8th Wall image-target tracking can use the AR camera feed on mobile.

This export now includes a WIL-9 tabletop worker overlay in `src/app.js`.
It adds:

- a phone-first canister guidance HUD,
- before / after evidence capture from the live 8th Wall canvas,
- proof JSON generation for dashboard handoff,
- listeners for `reality.imagescanning`, `reality.imagefound`, `reality.imageupdated`,
  `reality.imagelost`, and `reality.trackingstatus`,
- a manual lock fallback when image-target data is not yet configured.

#### Testing on Mobile
To test your project on mobile devices, especially for AR experiences that require camera access, you'll need to serve your development server over HTTPS. We recommend using [ngrok](https://ngrok.com/) to create a secure tunnel to your local server. After setting up ngrok, add the following configuration to `config/webpack.config.js` under the `devServer` section:

```javascript
devServer: {
  // ... existing config
  allowedHosts: ['.ngrok-free.dev']
}
```

### WIL-9 launch flow

1. Run `npm run serve`.
2. Open the printed network URL on the phone over the same Wi-Fi.
3. This export now loads two generated image targets by default:

- `image-targets/maisen-box-tight.json`
- `image-targets/canister-cap.json`

4. If target lock is unstable, use `Lock manual anchor` and continue the same proof flow.

### Mac desktop browser testing

For quick iteration on a Mac browser:

1. Run `npm run serve`.
2. Open `http://localhost:8080/` in Chrome on the same Mac.
3. Click `Enable desktop webcam` in the overlay.
4. Grant camera permission to the page.
5. Confirm the realtime webcam preview appears in the floating canvas at the bottom-right.
6. Use `Lock manual anchor` to keep testing the worker proof flow even before trained image targets
   are ready.

This path uses the browser `getUserMedia()` Web Camera API so you can test the WIL-9 overlay and
before/after capture flow on desktop without waiting for a phone handoff.

### Manual desktop image-target test

Once the desktop webcam preview is live:

1. Hold one of these targets in front of the Mac webcam, or show it on a second screen:
   - `image-targets/maisen-box-tight_original.jpg`
   - `image-targets/canister-cap_original.jpg`
2. Watch the event log in the overlay.
3. A successful target lock should append:
   - `image_found`
   - then repeated `image_updated`
4. If tracking is unstable, try:
   - brighter light
   - filling more of the preview frame with the target
   - reducing glare on the canister-cap photo
   - using the Maisen box first, since it is now the default planar target

The overlay also exposes:

```javascript
window.rpgCanisterDemo.targetFound({ name: 'canister-tabletop-target' })
window.rpgCanisterDemo.targetLost()
window.rpgCanisterDemo.getProofRecord()
```

This is useful if you want to bridge target callbacks from Studio graph logic or a custom script.

### Publishing
Run `npm run build` to generate a production build. The resulting build will be in `dist/`. You can host this bundle on any web server you want.

### Project Overview
- `src/`: Contains all your original project code and assets.
    - Your scene graph is in `src/.expanse.json`. If you are on Mac and don't see this, press `Cmd + Shift + .` to show hidden files.
    - References to asset bundles will need to be updated. Asset bundles are now plain folders. For example,
      - GLTF bundles need to be updated to the `.gltf` file in the folder, i.e., if your model is at `assets/mymodel.gltf/`, update your code to reference `assets/mymodel.gltf/mymodel_file.gltf`.
      - Custom `.font8` fonts need to be updated to the `.font8` file in the folder, i.e., if your font is at `assets/myfont.font8/`, update your code to reference `assets/myfont.font8/myfont_file.font8`.
- `image-targets/`: Contains your project's image targets (if any).
  - The image target with the `_target` suffix is the image target loaded by the engine. The others are used for various display purposes, but are exported for your convenience.
  - To enable image targets, call this in `app.js` or `app.ts` file. (Note: `app.js` or `app.ts` may not be created by default; you will need to create this file yourself.) The autoload targets will have a `"loadAutomatically": true` property in their json file.
```javascript
const onxrloaded = () => {
  XR8.XrController.configure({
    imageTargetData: [
      require('../image-targets/target1.json'),
      require('../image-targets/target2.json'),
    ],
  })
}
window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
```
- `config/`: Contains the necessary webpack configuration and typescript definitions to support project development.
- `external/`: Contains dependencies used by your project, loaded in `index.html`.
  - If you are not using the XR Engine, you can remove the xr.js script tag from `index.html` and delete the `external/xr/` folder to save bandwidth.
  - You can also customize whether `face`, `slam`, or both, are loaded on the `data-preload-chunks` attribute.

### Final Notes
Please reach out to support@8thwall.com with any questions not yet answered in the docs. Thank you for being part of 8th Wall's story!
