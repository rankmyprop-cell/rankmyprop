# Rank My Prop Search Console MCP

Private, read-only MCP server for the `sc-domain:rankmyprop.in` Google Search Console property.

Exposed tools:

- `gsc_list_sites`
- `gsc_search_analytics`
- `gsc_list_sitemaps`
- `gsc_inspect_url`

The service-account JSON is intentionally stored outside this repository. The server requests only the `webmasters.readonly` OAuth scope. It cannot submit/delete sitemaps, add/remove properties, or request indexing.
