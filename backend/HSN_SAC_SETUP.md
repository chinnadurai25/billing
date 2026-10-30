# HSN/SAC catalog provider

The registration flow intentionally fails closed: it does not treat a numeric-looking code or a client-submitted result as verified. With no provider configuration, Node and PHP now query a public 22,473-code HSN/SAC master from [India-HSN-SAC-Master](https://github.com/vikasrami/India-HSN-SAC-Master), cache it server-side for six hours, and filter suggestions locally. The repository is MIT-licensed and states that its code descriptions are based on CBIC masters and its GST rates on GST Council notifications effective 2025–26. It is a community-maintained mirror, not a government API; confirm classifications/rates against current CBIC notifications for compliance-sensitive use.

If you have a preferred current provider, set `HSN_SAC_API_URL` in the Node/PHP server environment to override the default. The configured URL is called server-side with `type=HSN|SAC`, `query=<typed code/prefix>`, and `limit=10`. It must return JSON in one of these forms: an array of records, or an object containing a `results`, `items`, `data`, or `codes` array. Each record must provide:

- `code` (or `hsn`, `hsnCode`, `hsn_code`, `sac`, `sacCode`, `sac_code`)
- `name` (or `title`, `productName`, `serviceName`, `label`, `description`)
- Optional `description` and `gstRate` (or `gst_rate`, `taxPercent`, `tax_percent`, `rate`, `gst`)
- Optional `type`/`kind`/`classification`, if the response contains both goods and services

If the provider requires a bearer token, set `HSN_SAC_API_KEY` on the server. Do not expose provider credentials in Vite environment variables or browser code. The provider should use an HTTPS endpoint and be sourced from current official Indian tariff/CBIC data; verify the provider's licensing, update cadence, and GST-rate semantics before production use.

The UI searches after two digits, debounces requests, and requires selecting an exact result. The Node and PHP product APIs re-query the same catalog on create/update and reject codes that cannot be verified. A catalog GST rate is auto-filled; otherwise the user-selected rate is retained.
