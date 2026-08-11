// OpenNext (Cloudflare) 設定。キャッシュは既定のまま = ISR/Data Cache 用の
// R2/KV バインディングは付けていない。ポータルは毎リクエスト GitHub/レジストリ
// を引いて鮮度を出す作りなので、永続キャッシュを挟む利点が薄いため。
// https://opennext.js.org/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
