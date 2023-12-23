import { test, expect, Page, ConsoleMessage } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

////////////////////////////////////////////////////////////////////////////////
// 💿 👋 Hola! It's me, Dora the Remix Disc, I'm here to help you write a great
// bug report pull request.
//
// You don't need to fix the bug, this is just to report one.
//
// The pull request you are submitting is supposed to fail when created, to let
// the team see the erroneous behavior, and understand what's going wrong.
//
// If you happen to have a fix as well, it will have to be applied in a subsequent
// commit to this pull request, and your now-succeeding test will have to be moved
// to the appropriate file.
//
// First, make sure to install dependencies and build Remix. From the root of
// the project, run this:
//
//    ```
//    yarn && yarn build
//    ```
//
// Now try running this test:
//
//    ```
//    yarn bug-report-test
//    ```
//
// You can add `--watch` to the end to have it re-run on file changes:
//
//    ```
//    yarn bug-report-test --watch
//    ```
////////////////////////////////////////////////////////////////////////////////

test.beforeEach(async ({ context }) => {
  await context.route(/_data/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    route.continue();
  });
});

test.beforeAll(async () => {
  fixture = await createFixture({
    ////////////////////////////////////////////////////////////////////////////
    // 💿 Next, add files to this object, just like files in a real app,
    // `createFixture` will make an app and run your tests against it.
    ////////////////////////////////////////////////////////////////////////////
    files: {
      "app/routes/_index.tsx": js`
        import { useEffect, useState } from "react";
        import { json } from "@remix-run/node";
        import { useLoaderData, Link, useFetcher } from "@remix-run/react";

        export function loader() {
          return json("pizza");
        }

        export default function Index() {
          let fetcher = useFetcher();

          useEffect(() => {
            // These will error
            fetcher.load("/static/test.json");
            // fetcher.submit({}, { method: "get", action: "/static/test.json" });
          }, [])

          return (
            <div>
              {fetcher.data && <span id="useFetcherID">useFetcher works!</span>}
              <span>Hello World!</span>
            </div>
          )
        }
      `,

      "app/routes/fetch.tsx": js`
        import { useEffect, useState } from "react";
        import { json } from "@remix-run/node";
        import { useLoaderData, Link, useFetcher } from "@remix-run/react";

        export function loader() {
          return json("pizza");
        }

        export default function Index() {
          let [fetchValue, setFetchValue] = useState("");

          useEffect(() => {
            // This will work
            fetch("/static/test.json").then((data) => {
              return data.text();
            }).then((data) => {
              setFetchValue(data);
            })
          }, [])

          return (
            <div>
              {fetchValue && <span id="fetchID">fetch() works!</span>}
              <span>Hello World!</span>
            </div>
          )
        }
      `,

      "public/static/test.json": js`
        {
          "foo": "bar"
        }
      `,
    },
  });

  // This creates an interactive app using playwright.
  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

////////////////////////////////////////////////////////////////////////////////
// 💿 Almost done, now write your failing test case(s) down here Make sure to
// add a good description for what you expect Remix to do 👇🏽
////////////////////////////////////////////////////////////////////////////////

test("expects fetch() to properly load a URL not defined as a route", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/fetch");

  let consoleMessages: any[] = [];
  page.on("console", async (message) => {
    let args = message.args();
    let consoleJson = await args[0].jsonValue();
    consoleMessages.push(await args[0].jsonValue());

    // This test will not show any console errors
    if (consoleJson.status >= 400) {
      console.error("fetch() logs:", consoleJson);
    }
  });

  // #fetchID appears on the page when `fetch` successfully loads data
  expect(await page.locator("#fetchID").textContent()).toContain(
    "fetch() works!"
  );
});

test("expects useFetcher to properly load a URL not defined as a route", async ({
  page,
}) => {
  let app = new PlaywrightFixture(appFixture, page);
  await app.goto("/");

  let consoleMessages: any[] = [];
  page.on("console", async (message) => {
    let args = message.args();
    let consoleJson = await args[0].jsonValue();
    consoleMessages.push(await args[0].jsonValue());

    // Console will show Error: No route matches URL "/static/test.json"
    if (consoleJson.status >= 400) {
      console.error("useFetcher logs:", consoleJson);
    }
  });

  // #useFetcherID appears on the page when useFetcher successfully loads data
  // This will timeout because useFetcher will throw an error.
  expect(await page.locator("#useFetcherID").textContent()).toContain(
    "useFetcher works!"
  );
});

////////////////////////////////////////////////////////////////////////////////
// 💿 Finally, push your changes to your fork of Remix and open a pull request!
////////////////////////////////////////////////////////////////////////////////
