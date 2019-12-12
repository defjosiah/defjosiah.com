import {} from "@cloudflare/workers-types";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import * as mime from "mime";

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false;

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

async function handleEvent(event: FetchEvent) {
  let options = { mapRequestToAsset: customMapRequestToAsset } as any;

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true
      };
    }
    await new Promise(resolve => {
      const timeout = Number(
        new URL(event.request.url).searchParams.get("delay") || 0
      );
      setTimeout(() => resolve(), timeout);
    });
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
