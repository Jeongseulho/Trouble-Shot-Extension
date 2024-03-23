import * as marked from "marked";
import * as vscode from "vscode";
import { getNonce } from "../utilities/getNonce";
import { ViewColumn, window, Uri } from "vscode";
import { getUri } from "../utilities/getUri";
import { WebviewPanel } from "vscode";

export function getMarkdownView(
  panel: WebviewPanel,
  markdownContent: string,
  extensionUri: vscode.Uri
): string {
  panel.webview.onDidReceiveMessage((message) => {
    switch (message.command) {
      case "alert":
        window.showErrorMessage(message.text);
        return;
    }
  }, undefined);

  const htmlString = marked.parse(markdownContent);
  const nonce = getNonce();
  const stylesUri = getUri(panel.webview, extensionUri, ["src", "panels", "assets", "index.css"]);
  const scriptUri = getUri(panel.webview, extensionUri, ["src", "panels", "assets", "index.js"]);

  return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none';
          style-src 'self' ${panel.webview.cspSource} 'nonce-${nonce}';
          script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Mark Down View</title>
        </head>
        <body>
          <div id="content">${htmlString}</div>
          <button id="myButton">Get Feedback by AI</button>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
}
