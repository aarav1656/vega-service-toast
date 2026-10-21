/**
 * Nothing on Vega starts a `[[components.service]]` by itself. The app starts its own service by the
 * service's pkg:// URI, and the service then outlives the app's screen.
 */

export interface Linker {
  openURL(url: string): Promise<unknown>;
}

export const serviceUri = (serviceId: string): string => `pkg://${serviceId}`;

/** Call once when the app mounts. `linking` is react-native's Linking. */
export function startService(serviceId: string, linking: Linker): Promise<unknown> {
  return linking.openURL(serviceUri(serviceId));
}

export interface Registry {
  registerHeadlessEntryPoint2(name: string, factory: () => () => Promise<void>): void;
}

export interface ServiceHandlers {
  /** The system ends a service whose start has not returned in about 8 s: open sockets and return. */
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
}

/** The entry point names the runtime looks for are `<service id>::onStartService` and `<service id>::onStopService`. */
export const entryPointNames = (serviceId: string) => ({
  start: `${serviceId}::onStartService`,
  stop: `${serviceId}::onStopService`,
});

/** Call from the service's JS entry file (`service.js`). `registry` is HeadlessEntryPointRegistry from @amazon-devices/headless-task-manager. */
export function registerService(serviceId: string, handlers: ServiceHandlers, registry: Registry): void {
  const names = entryPointNames(serviceId);
  registry.registerHeadlessEntryPoint2(names.start, () => handlers.onStart);
  registry.registerHeadlessEntryPoint2(names.stop, () => handlers.onStop);
}
