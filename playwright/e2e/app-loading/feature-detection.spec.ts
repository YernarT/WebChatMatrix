/*
Copyright 2024 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { test, expect } from "../../element-web-test";

test(`shows error page if browser lacks Intl support`, async ({ page }) => {
    await page.addInitScript({ content: `delete window.Intl;` });
    await page.goto("/");

    const header = await page.frameLocator("iframe").getByText("Unsupported browser");
    await expect(header).toBeVisible();

    await expect(page).toMatchScreenshot("unsupported-browser.png");
});
