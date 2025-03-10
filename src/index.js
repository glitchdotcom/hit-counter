/**
 * THIS COMPUTE CODE RUNS ON THE FASTLY EDGE 🌎🌍🌏
 */

import { KVStore } from "fastly:kv-store";
import { Router } from "@fastly/expressly";

const router = new Router();
let root = "/my-site/"; // Change to your root or "/""
let siteName = "My website";
let backendResponse, store; 

router.use(async (req, res) => {
  store = new KVStore('pagehits');
  backendResponse = await fetch(req.url, {
    backend: "blog"
  });
});

// Synthetic HTML page from KV Store data
router.get(`${root}stats`, async (req, res) => {
  let postList = await store.list({});
  let totals = ``;
  for (const lst of postList.list) {
    if (lst.endsWith("/")) {
      let hits = await store.get(lst);
      let num = await hits.text();
      totals += `<p><a href="${lst}">${lst}</a> – <strong>${num}</strong></p>`;
    }
  }
  res.withStatus(backendResponse.status).html(getPage("Page hits", totals));
});

// Default response
router.all("(.*)", async (req, res) => {
  console.log(req.path);
  let count = 1;
  const postRecord = await store.get(req.path);
  // Increase hits for this page if appropriate
  if (postRecord) {
    let postValue = await postRecord.text();
    count = parseInt(postValue) + 1;
  }
  await store.put(req.path, count);
  res.send(backendResponse);
});

router.listen();

// Synthetic page helper
let getPage = (title, content) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <!-- 🚧 Change CSS location to suit your site 🚧 -->
      <link rel="stylesheet" href="${root}css/index.css"/>
    </head>
    <body>
      <header><a class="home-link" href="${root}">${siteName}</a></header>
      <h2>${title}</h2>
      <div>${content}</div>
    </body>
  </html>`;
}
