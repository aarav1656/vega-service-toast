import {parse} from 'smol-toml';

export const POST_PRIVILEGE = 'com.amazon.notification.privilege.post';
export const HEADLESS_MODULE_PREFIX = '/com.amazon.kepler.headless_task_manager_1@';

type Rows = Array<Record<string, unknown>>;
const rows = (v: unknown): Rows => (Array.isArray(v) ? (v as Rows) : []);
const ids = (v: unknown): string[] => rows(v).map(r => String(r.id));

/**
 * The pieces of manifest.toml a toast-raising service needs, as the working Clutch service ships them.
 * Returns what is missing; an empty list means the manifest carries the whole block.
 */
export function checkManifest(toml: string, serviceId: string): string[] {
  const m = parse(toml) as Record<string, any>;
  const problems: string[] = [];
  if (!ids(m.components?.service).includes(serviceId)) problems.push(`[[components.service]] with id "${serviceId}" is missing`);
  if (!ids(m.wants?.service).includes(serviceId)) problems.push(`[[wants.service]] with id "${serviceId}" is missing: the app cannot start a service it does not want`);
  if (!ids(m.offers?.service).includes(serviceId)) problems.push(`[[offers.service]] with id "${serviceId}" is missing`);
  if (!ids(m.wants?.privilege).includes(POST_PRIVILEGE)) problems.push(`[[wants.privilege]] "${POST_PRIVILEGE}" is missing: post() is refused without it`);
  if (!ids(m.needs?.module).some(id => id.startsWith(HEADLESS_MODULE_PREFIX))) problems.push(`[[needs.module]] "${HEADLESS_MODULE_PREFIX}..." (headless task manager) is missing`);
  const grouped = rows(m.processes?.group).some(g => Array.isArray(g.component_ids ?? g['component-ids']) && ((g.component_ids ?? g['component-ids']) as string[]).includes(serviceId));
  if (!grouped) problems.push(`no [[processes.group]] lists "${serviceId}" in component-ids`);
  return problems;
}
