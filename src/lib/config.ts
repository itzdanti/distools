/**
 * The app's view of `DISTOOLS_CONFIG`.
 *
 * The value is replaced at build time by Vite (`build/distools-config.ts`), so importing this
 * costs nothing at runtime and the config cannot be edited by a visitor. The parser and the
 * helper functions live in `core/config.ts` so both this and the build scripts share one
 * definition of the format.
 */
import { deployOrigin, hrefFor, isEmail, type DistoolsConfig } from "./core/config";

declare const __DISTOOLS_CONFIG__: DistoolsConfig;

/**
 * Vite replaces `__DISTOOLS_CONFIG__` with the parsed file during a build. When this module is
 * loaded outside that build — `vite.client.config.ts` imports the API handler in Node to bake the
 * discovery files — the identifier does not exist, so fall back to an empty object. Callers in
 * that context pass an explicit config rather than relying on the injection.
 */
const injected: DistoolsConfig | undefined =
  typeof __DISTOOLS_CONFIG__ === "undefined" ? undefined : __DISTOOLS_CONFIG__;

export const config: DistoolsConfig = injected ?? ({} as DistoolsConfig);

/** The deploy domain as a full origin, e.g. `https://distools.itzdanti.dev`. */
export const serviceOrigin = config.service_deploy_domain
  ? deployOrigin(config.service_deploy_domain)
  : "";

export { deployOrigin, hrefFor, isEmail };
export type { DistoolsConfig };
