#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleAuth } from "google-auth-library";
import * as z from "zod/v4";

const DEFAULT_SITE = process.env.GSC_SITE_URL || "sc-domain:rankmyprop.in";
const CREDENTIAL_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!CREDENTIAL_PATH) {
  console.error("GOOGLE_APPLICATION_CREDENTIALS is required.");
  process.exit(1);
}

const auth = new GoogleAuth({
  keyFile: CREDENTIAL_PATH,
  scopes: ["https://www.googleapis.com/auth/webmasters.readonly"]
});

const server = new McpServer({
  name: "rankmyprop-search-console",
  version: "1.0.0"
});

function result(data) {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data
  };
}

function errorResult(error) {
  const status = Number(error?.response?.status || error?.code || 0) || undefined;
  const apiMessage = error?.response?.data?.error?.message;
  const message = String(apiMessage || error?.message || "Google Search Console request failed");
  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify({ error: message, status }, null, 2) }]
  };
}

async function request(config) {
  const client = await auth.getClient();
  const response = await client.request(config);
  return response.data;
}

server.registerTool("gsc_list_sites", {
  description: "List Search Console properties available to the Rank My Prop service account.",
  inputSchema: {}
}, async () => {
  try {
    return result(await request({ url: "https://www.googleapis.com/webmasters/v3/sites" }));
  } catch (error) {
    return errorResult(error);
  }
});

server.registerTool("gsc_search_analytics", {
  description: "Query Search Console performance metrics such as clicks, impressions, CTR, position, query, page, country, device, and date.",
  inputSchema: {
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Inclusive start date in YYYY-MM-DD format"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Inclusive end date in YYYY-MM-DD format"),
    siteUrl: z.string().optional().describe("Search Console property; defaults to sc-domain:rankmyprop.in"),
    dimensions: z.array(z.enum(["date", "query", "page", "country", "device", "searchAppearance", "hour"])).max(5).default(["date"]),
    type: z.enum(["web", "image", "video", "news", "discover", "googleNews"]).default("web"),
    dataState: z.enum(["final", "all", "hourly_all"]).default("final"),
    rowLimit: z.number().int().min(1).max(25000).default(1000),
    startRow: z.number().int().min(0).default(0)
  }
}, async ({ startDate, endDate, siteUrl = DEFAULT_SITE, dimensions, type, dataState, rowLimit, startRow }) => {
  try {
    const data = await request({
      method: "POST",
      url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      data: { startDate, endDate, dimensions, type, dataState, rowLimit, startRow, aggregationType: "auto" }
    });
    return result({ siteUrl, startDate, endDate, dimensions, ...data });
  } catch (error) {
    return errorResult(error);
  }
});

server.registerTool("gsc_list_sitemaps", {
  description: "List submitted and discovered sitemaps for a Search Console property.",
  inputSchema: {
    siteUrl: z.string().optional().describe("Search Console property; defaults to sc-domain:rankmyprop.in"),
    sitemapIndex: z.string().url().optional().describe("Optional sitemap-index URL used to list its child sitemaps")
  }
}, async ({ siteUrl = DEFAULT_SITE, sitemapIndex }) => {
  try {
    const data = await request({
      url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`,
      params: sitemapIndex ? { sitemapIndex } : undefined
    });
    return result({ siteUrl, ...data });
  } catch (error) {
    return errorResult(error);
  }
});

server.registerTool("gsc_inspect_url", {
  description: "Inspect a Rank My Prop URL's current Google index status. This is read-only and does not request indexing.",
  inputSchema: {
    inspectionUrl: z.string().url().refine(value => {
      try {
        const hostname = new URL(value).hostname;
        return hostname === "rankmyprop.in" || hostname.endsWith(".rankmyprop.in");
      } catch {
        return false;
      }
    }, "URL must belong to rankmyprop.in"),
    siteUrl: z.string().optional().describe("Search Console property; defaults to sc-domain:rankmyprop.in"),
    languageCode: z.string().default("en-US")
  }
}, async ({ inspectionUrl, siteUrl = DEFAULT_SITE, languageCode }) => {
  try {
    const data = await request({
      method: "POST",
      url: "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
      data: { inspectionUrl, siteUrl, languageCode }
    });
    return result({ inspectionUrl, siteUrl, ...data });
  } catch (error) {
    return errorResult(error);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Rank My Prop Search Console MCP running in read-only mode.");
}

main().catch(error => {
  console.error("Search Console MCP startup failed:", error?.message || error);
  process.exit(1);
});
