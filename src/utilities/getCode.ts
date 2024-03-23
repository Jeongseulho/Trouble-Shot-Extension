import * as vscode from "vscode";
import { getRootPath } from "./getRootPath";

export async function getCode(errMsg: string | undefined) {
  if (!errMsg) {
    return;
  }

  const fileLinePattern = /\n(.*\.(ts|tsx|js|jsx))\nSyntax error:.*\((\d+)/;
  const match1 = errMsg.match(fileLinePattern);

  const linePattern = /(.+\.(ts|tsx|js|jsx))\n\s*Line\s(\d+)/;
  const match2 = errMsg.match(linePattern);

  const match = match1 || match2;

  if (match) {
    const filePath = match[1];
    const lineString = match[3];
    const line = parseInt(lineString, 10);
    const rootPath = getRootPath();
    const document = await vscode.workspace.openTextDocument(`${rootPath}/${filePath}`);

    // Calculate the range of lines to extract.
    const startLine = Math.max(line - 4, 0); // Ensure we don't go before the start of the document.
    const endLine = Math.min(line + 2, document.lineCount - 1); // Ensure we don't go past the end of the document.

    // Get the text for the specified range.
    let codeSnippet = "";
    for (let i = startLine; i <= endLine; i++) {
      const textLine = document.lineAt(i);
      codeSnippet += textLine.text + "\n"; // Add a newline character after each line.
    }

    // Return the extracted text.
    return codeSnippet.trim();
  }
}
