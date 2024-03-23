import * as vscode from "vscode";
import { TroubleShotPanel } from "./panels/TroubleShotPanel";
import { getSessionId } from "./utilities/getSessionId";
import { NodeDependenciesProvider } from "./TreeDataProvider/NodeDependenciesProvider";
import { getRootPath } from "./utilities/getRootPath";
import { MyTroubleListProviderWithoutLogin } from "./TreeDataProvider/MyTroubleListProviderWithoutLogin";
import { Trouble } from "./TreeDataProvider/MyTroubleListProvider";
import { exec } from "child_process";
import { parsingErrMsg } from "./utilities/parsingErrMsg";
import { ErrHistoryProvider, Err } from "./TreeDataProvider/ErrHistoryProvider";
import { v4 as uuidv4 } from "uuid";
import { MyTroubleListProviderLogin } from "./TreeDataProvider/MyTroubleListProviderLogin";
import { isOffLineTrouble } from "./utilities/isOnline";
import { MarkdownViewPanel } from "./panels/MarkdownViewPanel";

export const TROUBLE_SHOOTING_TYPE = {
  TROUBLE: 0 as const,
  SOLUTION: 1 as const,
  LOGIN_FORM: 2 as const,
  TROUBLE_WITH_ERROR: 3 as const,
};

export async function activate(context: vscode.ExtensionContext) {
  const rootPath = getRootPath();
  const sessionId = await getSessionId(context);
  const isLogin = sessionId !== -1;
  vscode.commands.executeCommand("setContext", "isLogin", isLogin);

  context.subscriptions.push(
    vscode.commands.registerCommand("logout.trouble.shot", async () => {
      const body = { seq: sessionId, type: 2 };
      try {
        await fetch("https://orientalsalad.kro.kr/api/user/login/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        vscode.commands.executeCommand("setContext", "isLogin", false);
        context.globalState.update("sessionId", -1);
        vscode.window.showInformationMessage("Logout success!");
      } catch (error) {
        vscode.window.showErrorMessage("Failed to logout!");
      }
    })
  );

  const errHistoryProvider = new ErrHistoryProvider(context.globalState);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("error-history", errHistoryProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("delete.error", (error) => {
      errHistoryProvider.delErr(error);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("clear.error", () => {
      errHistoryProvider.clearErr();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("refresh.trouble.error.history", () => {
      errHistoryProvider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      exec("npm run build", { cwd: rootPath }, (error, stdout, stderr) => {
        if (error) {
          const errMsg = parsingErrMsg(stdout);
          const err = new Err(errMsg.title, new Date(), errMsg.errMsg, uuidv4());
          errHistoryProvider.addErr(err);
        }
      });
    })
  );

  // trouble webview panel
  context.subscriptions.push(
    vscode.commands.registerCommand("create.trouble", () => {
      TroubleShotPanel.render(
        context.extensionUri,
        TROUBLE_SHOOTING_TYPE.TROUBLE,
        context.globalState
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("create.trouble.with.error", (error) => {
      TroubleShotPanel.render(
        context.extensionUri,
        TROUBLE_SHOOTING_TYPE.TROUBLE_WITH_ERROR,
        context.globalState,
        undefined,
        error.id
      );
    })
  );

  // trouble webview panel
  context.subscriptions.push(
    vscode.commands.registerCommand("solve.trouble", (trouble) => {
      TroubleShotPanel.render(
        context.extensionUri,
        TROUBLE_SHOOTING_TYPE.SOLUTION,
        context.globalState,
        trouble.id
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("copy.markdown", (trouble) => {
      try {
        vscode.env.clipboard.writeText(trouble.content);
        vscode.window.showInformationMessage("Copied to clipboard!");
      } catch (error) {
        vscode.window.showErrorMessage("Failed to copy to clipboard!");
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("login.trouble.shot", () => {
      TroubleShotPanel.render(
        context.extensionUri,
        TROUBLE_SHOOTING_TYPE.LOGIN_FORM,
        context.globalState
      );
    })
  );

  // dependencies tree view
  const nodeDependenciesProvider = new NodeDependenciesProvider(rootPath);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("node-dependencies", nodeDependenciesProvider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("node.dependencies.refreshEntry", () => {
      nodeDependenciesProvider.refresh();
    })
  );

  // trouble list without login tree view
  const myTroubleListProviderWithoutLogin = new MyTroubleListProviderWithoutLogin(
    context.globalState
  );

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "my-trouble-list-without-login",
      myTroubleListProviderWithoutLogin
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("refresh.trouble.list.without.login", () => {
      myTroubleListProviderWithoutLogin.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("view.trouble", async (troubleShootId: string) => {
      if (isOffLineTrouble(troubleShootId)) {
        const troubleList = context.globalState.get<Trouble[]>("troubleList");
        const trouble = troubleList?.find((troubleShoot) => troubleShoot.id === troubleShootId);
        if (!trouble) return;
        // const panel = vscode.window.createWebviewPanel(
        //   "viewTroubleShooting",
        //   trouble.title,
        //   vscode.ViewColumn.One,
        //   {
        //     enableScripts: true,
        //     localResourceRoots: [Uri.joinPath(context.extensionUri, "src/panels/assets")],
        //   }
        // );
        // panel.webview.html = getMarkdownView(panel, trouble.content, context.extensionUri);
        MarkdownViewPanel.render(
          context.extensionUri,
          trouble.content,
          trouble.title,
          context.globalState
        );
      } else {
        const res = await fetch(
          `https://orientalsalad.kro.kr/api/troubleshooting/trouble-shootings/${Number(
            troubleShootId
          )}?loginSeq=0&type=2`
        );
        const resJson = await res.json();
        const { troubleShooting } = resJson;
        if (!troubleShooting) return;
        // const panel = vscode.window.createWebviewPanel(
        //   "viewTroubleShooting",
        //   troubleShooting.title,
        //   vscode.ViewColumn.One,
        //   {
        //     enableScripts: true,
        //   }
        // );
        let solvedContent = "";
        troubleShooting.answers.forEach((answer: any) => {
          solvedContent += answer.context;
        });

        // panel.webview.html = getMarkdownView(
        //   panel,
        //   troubleShooting.context + solvedContent,
        //   context.extensionUri
        // );
        MarkdownViewPanel.render(
          context.extensionUri,
          troubleShooting.context + solvedContent,
          troubleShooting.title,
          context.globalState
        );
      }
    })
  );

  // trouble list without login tree view
  const myTroubleListProviderLogin = new MyTroubleListProviderLogin(context.globalState);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("my-trouble-list", myTroubleListProviderLogin)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("refresh.trouble.list", () => {
      myTroubleListProviderLogin.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("delete.trouble", (trouble) => {
      if (isOffLineTrouble(trouble.id)) {
        myTroubleListProviderWithoutLogin.deleteTroubleShooting(trouble);
      } else {
        myTroubleListProviderLogin.deleteTroubleShooting(trouble);
      }
    })
  );
}
