import * as vscode from "vscode";

export async function getSessionId(context: vscode.ExtensionContext): Promise<number> {
  const sessionId = context.globalState.get<number>("sessionId", -1);
  return sessionId;
}
