// OpenNext (Cloudflare) config. Caching is left at the defaults, i.e. no R2/KV bindings
// for ISR/Data Cache. The portal stays fresh by querying GitHub / the registries on every
// request, so putting a persistent cache in between has little benefit.
// https://opennext.js.org/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
