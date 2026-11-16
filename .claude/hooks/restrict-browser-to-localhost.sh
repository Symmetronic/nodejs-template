#!/bin/sh

readonly EXIT_CODE_THAT_ALLOWS_TOOL_USE=0
readonly EXIT_CODE_THAT_BLOCKS_TOOL_USE=2

url_is_local() {
  node --input-type=module --eval '
    import { text } from "node:stream/consumers";
    const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
    const WEB_PROTOCOLS = new Set(["http:", "https:"]);
    const hookInput = JSON.parse((await text(process.stdin)) || "{}");
    const url = hookInput.tool_input?.url;
    if (url === undefined) process.exit(0);
    const parsed = URL.parse(String(url));
    const isLocalWebPage =
      WEB_PROTOCOLS.has(parsed?.protocol) && LOCAL_HOSTNAMES.has(parsed?.hostname);
    const isInlinePage = parsed?.protocol === "data:" || parsed?.href === "about:blank";
    process.exit(isLocalWebPage || isInlinePage ? 0 : 1);
  '
}

if ! url_is_local; then
  echo "Blocked: the browser may only open localhost, 127.0.0.1, [::1], data: and about:blank URLs, so that it stays inside the Dev Container." >&2
  exit "$EXIT_CODE_THAT_BLOCKS_TOOL_USE"
fi

exit "$EXIT_CODE_THAT_ALLOWS_TOOL_USE"
