import { KVNamespace } from "@cloudflare/workers-types";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import * as mime from "mime";

declare global {
  const REDIRECTS: KVNamespace;
}

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = true;

addEventListener("fetch", event => {
  try {
    event.respondWith(handleEvent(event));
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500
        })
      );
    }
    event.respondWith(new Response("Internal Error", { status: 500 }));
  }
});

const customMapRequestToAsset = (request: Request) => {
  const parsedUrl = new URL(request.url);
  let pathname = parsedUrl.pathname;
  console.log(pathname);

  // root
  if (pathname === "/") {
    pathname = pathname.concat("index.html");
  } else if (!mime.getType(pathname)) {
    if (pathname.endsWith("/")) {
      pathname = pathname.slice(0, pathname.length - 1);
    }
    pathname = pathname.concat(".html");
  }
  parsedUrl.pathname = pathname;
  // @ts-ignore
  return new Request(parsedUrl.toString(), request);
};

async function writeStuff(writable: WritableStream) {
  let i = 0;
  const encoder = new TextEncoder();
  const writer = writable.getWriter();
  while (true) {
    await writer.write(encoder.encode("event: ping\n"));
    await writer.write(encoder.encode(`data: {"number": ${i}}\n\n`));
    i++;
    await new Promise(resolve => {
      setTimeout(() => resolve(), 5000);
    });
  }
}

async function handleEvent(event: FetchEvent) {
  let options = { mapRequestToAsset: customMapRequestToAsset } as any;
  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true
      };
    }
    const { pathname } = new URL(event.request.url);
    if (pathname.startsWith("/api")) {
      if (pathname.startsWith("/api/sse")) {
        let { readable, writable } = new TransformStream();
        writeStuff(writable);
        return new Response(readable, {
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "text/event-stream",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      if (pathname.startsWith("/api/redirect")) {
        if (pathname === "/api/redirect") {
          const allKeys = (await REDIRECTS.list({})).keys.map(x => x.name);
          return new Response(JSON.stringify(allKeys), {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
        const rest = pathname.substr("/api/redirect".length);
        const method = event.request.method;
        if (method === "GET") {
          const result = await REDIRECTS.get(rest);
          if (!result) {
            return new Response(`${rest} key not found.`, { status: 404 });
          }
          return new Response(JSON.stringify({ from: rest, to: result }), {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
        if (method === "POST") {
          const requestBody: {
            to: string;
          } = await event.request.json();
          await REDIRECTS.put(rest, requestBody.to);
          return new Response(JSON.stringify({ worked: true }), {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }
      }
    }

    const redirect = await REDIRECTS.get(pathname);
    if (redirect) {
      return Response.redirect(redirect);
    }

    return await getAssetFromKV(event, options);
  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: (req: Request) =>
            // @ts-ignore
            new Request(`${new URL(req.url).origin}/404.html`, req)
        });

        return new Response(notFoundResponse.body, {
          ...notFoundResponse,
          status: 404
        });
      } catch (e) {}
    }

    return new Response(e.message || e.toString(), { status: 500 });
  }
}
