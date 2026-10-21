/**
 * Builds and posts the system toast from code that has no React tree, such as a headless service.
 * The documented route is the useToastKepler hook; this builds the same NotificationContent the hook
 * builds and hands it to the same NotificationManager TurboModule.
 */

// Metro (the Vega bundler) provides require; resolving lazily keeps this module importable outside a Vega runtime.
declare const require: (id: string) => unknown;

/** The channel name is the render template selector. Any other name posts successfully and draws nothing. */
export const MENU_TOAST = 'MenuToastRenderTemplate';
export const SIMPLE_TOAST = 'SimpleToastRenderTemplate';
export const TOAST_TEMPLATES: readonly string[] = [MENU_TOAST, SIMPLE_TOAST];

export interface ToastOptions {
  title: string;
  description: string;
  /** http(s) URL. The system renderer is another process: it draws a remote icon and leaves a package path or data URI blank. */
  iconUri: string;
  /** App to open from the toast's action, for example `pkg://com.example.app.main`. Adds the Menu action and picks the menu template. */
  launchUri?: string;
  launchTitle?: string;
  /** Seconds on screen. Default 8. */
  seconds?: number;
  /** Override the template. Only a name in TOAST_TEMPLATES draws. */
  channel?: string;
}

/** The SDK classes the content needs, resolved lazily: the module looks its TurboModule up at import and throws outside a Vega runtime. */
export interface ToastSdk {
  ToastKind: new () => unknown;
  AppLaunchTarget: new (appUri: string, title: string, iconUri: string) => unknown;
}

export interface ToastContent {
  mTitle: string;
  mDescription: string;
  mIconUri: string;
  mTimeout: number;
  mLaunchTargets: unknown[];
  mChannel: {importance: {importance: string}; kind: unknown; name: string};
}

const UTILS = '@amazon-devices/react-native-kepler/Libraries/Components/ToastKepler/NotificationManagerUtils';
const MANAGER = '@amazon-devices/react-native-kepler/Libraries/Components/ToastKepler/NativeNotificationManager';

export function loadSdk(): ToastSdk {
  return require(UTILS) as ToastSdk;
}

export function buildToast(opts: ToastOptions, sdk: ToastSdk = loadSdk()): ToastContent {
  const menu = opts.launchUri !== undefined;
  return {
    mTitle: opts.title,
    mDescription: opts.description,
    mIconUri: opts.iconUri,
    mTimeout: opts.seconds ?? 8,
    mLaunchTargets: menu ? [new sdk.AppLaunchTarget(opts.launchUri as string, opts.launchTitle ?? 'Open', 'not_used')] : [],
    mChannel: {
      importance: {importance: 'NORMAL'},
      kind: new sdk.ToastKind(),
      name: opts.channel ?? (menu ? MENU_TOAST : SIMPLE_TOAST),
    },
  };
}

/** Posts the toast and resolves with the notification id. A resolved post means accepted, not drawn: see README. */
export async function postToast(content: ToastContent): Promise<unknown> {
  const manager = (require(MANAGER) as {default: {post(c: ToastContent): Promise<unknown>}}).default;
  return manager.post(content);
}
