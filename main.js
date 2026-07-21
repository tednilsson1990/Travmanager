import { render } from "preact";
import { html } from "htm/preact";
import App from "./ui-app.js";

render(html`<${App} />`, document.getElementById("root"));
