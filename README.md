# vega-service-toast

A system toast over whatever app is on screen, raised from a headless service on Vega OS (Fire TV). The service holds a socket, a timer or a push channel while another app plays video, and when it has something to say the toast appears on top.

Measured on the Vega Virtual Device (SDK 0.24) over a playing video app: 20 of 20 toasts reached the screen, median 50 ms and p95 75 ms from the send (`evidence/renders-template-name.csv`, column `send_to_render_ms`). The same 20 sends with any other channel name drew nothing (`evidence/renders-other-name.csv`).

```ts
import {buildToast, postToast} from 'vega-service-toast';

await postToast(
  buildToast({
    title: 'Cavaliers at Knicks is coming down to the wire',
    description: '4th quarter, 4:09 left. Press Menu to open Close One.',
    iconUri: 'https://clutch.example.com/assets/clutch-icon.png',
    launchUri: 'pkg://com.clutch.tv.main',
    launchTitle: 'Open Close One',
  }),
);
```

## The three things a service needs

1. **Start it by URI.** Nothing on Vega starts a `[[components.service]]` by itself. The app starts its own service when it mounts and the service then outlives the screen: `startService('com.example.toast.service', Linking)` opens `pkg://com.example.toast.service` (`src/service.ts`, `example/src/App.tsx`).
2. **Name the channel after a render template.** The channel `name` selects the renderer. `MenuToastRenderTemplate` (a toast with an action) and `SimpleToastRenderTemplate` draw; any other name makes `post()` resolve with an id and draws nothing. `buildToast` picks the template from whether you pass a `launchUri` (`src/toast.ts`).
3. **Declare the block in the manifest.** The service component, the process group, `wants.service`, `offers.service`, the `com.amazon.notification.privilege.post` privilege and the headless task manager module. `templates/manifest-service.toml` is the block to paste, `example/manifest.toml` is a complete manifest, and the checker reads yours:

```bash
npx vega-service-toast check manifest.toml com.example.toast.service
# missing: [[wants.privilege]] "com.amazon.notification.privilege.post" is missing: post() is refused without it
```

The service's own entry file registers its start and stop handlers under the names the runtime looks up, `<service id>::onStartService` and `<service id>::onStopService`: `registerService(id, {onStart, onStop}, HeadlessEntryPointRegistry)` (`example/service.js`). A start that has not returned in about 8 seconds is ended by the system, so open the socket and return.

## API

| Export | What it does |
|---|---|
| `buildToast(options)` | The `NotificationContent` the SDK's own `useToastKepler` hook builds, without needing a React tree |
| `postToast(content)` | Hands it to the NotificationManager TurboModule |
| `startService(id, Linking)` | Starts the service by its `pkg://` URI |
| `registerService(id, handlers, registry)` | Registers the start and stop entry points |
| `checkManifest(toml, id)` | The list of manifest pieces still missing, empty when the block is complete |
| `MENU_TOAST`, `SIMPLE_TOAST`, `TOAST_TEMPLATES` | The template names that draw |

The icon must be an `https` URL: the renderer is another process that fetches the icon itself over https; a cleartext `http` URL, a package path or a data URI is left blank.

## Tests

```bash
npm install
npm test    # build, 15 tests, then 13 mutations of the recipe that must each turn them red
```

`test/toast.test.mjs` pins the template names, the launch target and the entry point names. `test/manifest.test.mjs` removes each manifest piece in turn and requires the checker to name it. `test/mutate.mjs` breaks the built code and requires red.

## Used by

Close One, the Fire TV entry that cues a household when a game they follow turns into a one possession finish. Its service posts through this recipe.

## License

MIT. See `LICENSE`.
