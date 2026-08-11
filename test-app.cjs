const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`, { url: "http://localhost/", resources: "usable" });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
global.lucide = { createIcons: () => {} };

import('./js/app.js').then(app => {
    console.log("App loaded successfully!");
}).catch(err => {
    console.error("Error loading app:", err);
});
