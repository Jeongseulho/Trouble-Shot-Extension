import { isOffLineTrouble } from "./../utilities/isOnline";
import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import * as vscode from "vscode";
import { NodeDependenciesProvider } from "../TreeDataProvider/NodeDependenciesProvider";
import { Trouble } from "../TreeDataProvider/MyTroubleListProvider";
import { v4 as uuidv4 } from "uuid";
import { TROUBLE_SHOOTING_TYPE } from "../extension";
import { Err } from "../TreeDataProvider/ErrHistoryProvider";
import { getCode } from "../utilities/getCode";
import { MyTroubleListProviderLogin } from "../TreeDataProvider/MyTroubleListProviderLogin";

type TroubleShootingType = typeof TROUBLE_SHOOTING_TYPE[keyof typeof TROUBLE_SHOOTING_TYPE];

/**
 * This class manages the state and behavior of HelloWorld webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering HelloWorld webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class TroubleShotPanel {
  public static currentPanel: TroubleShotPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];
  private readonly _troubleShootingType: TroubleShootingType;
  private readonly _globalState: vscode.Memento;
  private readonly _troubleId?: string;
  private readonly _errorId?: string;

  /**
   * The HelloWorldPanel class private constructor (called only from the render method).
   *
   * @param panel A reference to the webview panel
   * @param extensionUri The URI of the directory containing the extension
   */
  private constructor(
    panel: WebviewPanel,
    extensionUri: Uri,
    troubleShootingType: TroubleShootingType,
    globalState: vscode.Memento,
    troubleId?: string,
    errorId?: string
  ) {
    this._panel = panel;

    // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
    // the panel or when the panel is closed programmatically)
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Set the HTML content for the webview panel
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview);

    this._troubleShootingType = troubleShootingType;

    this._globalState = globalState;

    this._troubleId = troubleId;

    this._errorId = errorId;
  }

  /**
   * Renders the current webview panel if it exists otherwise a new webview panel
   * will be created and displayed.
   *
   * @param extensionUri The URI of the directory containing the extension.
   */
  public static render(
    extensionUri: Uri,
    troubleShootingType: TroubleShootingType,
    globalState: vscode.Memento,
    troubleId?: string,
    errorId?: string
  ) {
    if (TroubleShotPanel.currentPanel) {
      // If the webview panel already exists reveal it
      TroubleShotPanel.currentPanel._panel.reveal(ViewColumn.One);
    } else {
      // If a webview panel does not already exist create and show a new one
      const panel = window.createWebviewPanel(
        // Panel view type
        "createTroubleShooting",
        // Panel title
        "Create Trouble Shooting",
        // The editor column the panel should be displayed in
        ViewColumn.One,
        // Extra panel configurations
        {
          // Enable JavaScript in the webview
          enableScripts: true,
          // Restrict the webview to only load resources from the `out` and `webview-ui/build` directories
          localResourceRoots: [
            Uri.joinPath(extensionUri, "out"),
            Uri.joinPath(extensionUri, "webview-ui/build"),
          ],
        }
      );

      TroubleShotPanel.currentPanel = new TroubleShotPanel(
        panel,
        extensionUri,
        troubleShootingType,
        globalState,
        troubleId,
        errorId
      );
    }
  }

  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    TroubleShotPanel.currentPanel = undefined;

    // Dispose of the current webview panel
    this._panel.dispose();

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   *
   * @remarks This is also the place where references to the React webview build files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.css"]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "index.js"]);

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none';
          style-src 'self' ${webview.cspSource} 'nonce-${nonce}'; 
          script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Trouble Shot</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  /**
   * Sets up an event listener to listen for messages passed from the webview context and
   * executes code based on the message that is recieved.
   *
   * @param webview A reference to the extension webview
   * @param context A reference to the extension context
   */
  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      async (message: any) => {
        const command = message.command;

        switch (command) {
          case "getInitialStatus":
            if (this._troubleShootingType === TROUBLE_SHOOTING_TYPE.TROUBLE) {
              webview.postMessage({
                command: "getInitialStatus",
                troubleShootingType: this._troubleShootingType,
                sessionId: this._globalState.get<string>("sessionId"),
                defaultSkills: JSON.stringify(NodeDependenciesProvider.allDependencies),
              });
            }

            if (this._troubleShootingType === TROUBLE_SHOOTING_TYPE.SOLUTION) {
              webview.postMessage({
                command: "getInitialStatus",
                troubleShootingType: this._troubleShootingType,
                sessionId: this._globalState.get<string>("sessionId"),
                troubleId: this._troubleId,
              });
            }

            if (this._troubleShootingType === TROUBLE_SHOOTING_TYPE.LOGIN_FORM) {
              webview.postMessage({
                command: "getInitialStatus",
                troubleShootingType: this._troubleShootingType,
              });
            }

            if (this._troubleShootingType === TROUBLE_SHOOTING_TYPE.TROUBLE_WITH_ERROR) {
              const allErrors = this._globalState.get<Err[]>("errHistory");
              const error = allErrors?.find((error) => error.id === this._errorId);
              webview.postMessage({
                command: "getInitialStatus",
                troubleShootingType: this._troubleShootingType,
                sessionId: this._globalState.get<string>("sessionId"),
                defaultSkills: JSON.stringify(NodeDependenciesProvider.allDependencies),
                defaultErrorMsg: error?.errMsg.replace(/\n/g, " "),
                defaultCode: await getCode(error?.errMsg),
              });
            }

            return;
          case "showMessage":
            if (message.type === "error") {
              vscode.window.showErrorMessage(message.content);
            }
            if (message.type === "info") {
              vscode.window.showInformationMessage(message.content);
            }
            return;
          case "addTrouble":
            try {
              const newTrouble = new Trouble(
                message.articleInfo.title,
                message.articleInfo.createTime,
                message.articleInfo.content,
                uuidv4(),
                "unSolved"
              );
              const prevTroubleList = this._globalState.get<Trouble[]>("troubleList");
              await this._globalState.update(
                "troubleList",
                prevTroubleList ? [...prevTroubleList, newTrouble] : [newTrouble]
              );
              vscode.commands.executeCommand("refresh.trouble.list.without.login");
              vscode.window.showInformationMessage("Added to trouble list!");
              this.dispose();
            } catch (error) {
              vscode.window.showErrorMessage("Failed to add to trouble list!");
            }
            return;
          case "solveTrouble":
            if (isOffLineTrouble(message.articleInfo.troubleId)) {
              try {
                const prevTroubleList = this._globalState.get<Trouble[]>("troubleList");
                const newTroubleList = prevTroubleList?.map((trouble) => {
                  if (trouble.id === message.articleInfo.troubleId) {
                    trouble.content += "\n\n";
                    trouble.content += message.articleInfo.content;
                    trouble.contextValue = "solved";
                  }
                  return trouble;
                });
                await this._globalState.update("troubleList", newTroubleList);
                vscode.commands.executeCommand("refresh.trouble.list.without.login");
                vscode.window.showInformationMessage("Trouble solved!");
                this.dispose();
              } catch (error) {
                vscode.window.showErrorMessage("Failed to solve!");
              }
            } else {
              const sessionId = this._globalState.get<string>("sessionId");
              const res = await fetch(
                `https://orientalsalad.kro.kr/api/troubleshooting/trouble-shootings/${message.articleInfo.troubleId}/answers`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    loginSeq: sessionId,
                    type: 2,
                    troubleShootingAnswer: {
                      title: message.articleInfo.title,
                      context: message.articleInfo.content,
                      writer: {
                        seq: sessionId,
                      },
                      troubleSeq: message.articleInfo.troubleId,
                      selected: true,
                    },
                  }),
                }
              );
              const resJson = await res.json();
              if (resJson.success) {
                vscode.commands.executeCommand("refresh.trouble.list");
                vscode.window.showInformationMessage("Trouble solved!");
                this.dispose();
              } else {
                vscode.window.showErrorMessage("Failed to solve!");
              }
            }
            return;
          case "onLogin":
            fetch("https://orientalsalad.kro.kr/api/user/login/login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(message.body),
            })
              .then((res) => {
                if (!res.ok) {
                  throw new Error("Network response was not ok");
                }
                return res.json();
              })
              .then((data) => {
                if (data.success) {
                  this._globalState.update("sessionId", data.member.seq);
                  vscode.commands.executeCommand("setContext", "isLogin", true);
                  vscode.window.showInformationMessage("Login success!");
                  vscode.commands.executeCommand("refresh.trouble.list");
                  this.dispose();
                } else {
                  vscode.window.showErrorMessage("Invalid Email or Password!");
                }
              })
              .catch((error) => {
                console.error("Error:", error);
              });
            return;
          case "uploadTrouble":
            const body = {
              loginSeq: this._globalState.get<string>("sessionId"),
              type: 2,
              troubleShooting: {
                title: message.articleInfo.title,
                category: "VSCode",
                context: message.articleInfo.content,
                dependency: message.articleInfo.dependency,
                scope:
                  message.articleInfo.scope === "1"
                    ? this._globalState.get<string>("sessionId")
                    : 0,
                writer: {
                  seq: this._globalState.get<string>("sessionId"),
                },
                solved: false,
                tags: [],
              },
            };
            fetch("https://orientalsalad.kro.kr/api/troubleshooting/trouble-shootings", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
            })
              .then((res) => {
                if (!res.ok) {
                  throw new Error("Network response was not ok");
                }
                return res.json();
              })
              .then((data) => {
                if (data.success) {
                  vscode.window.showInformationMessage("Trouble uploaded!");
                  vscode.commands.executeCommand("refresh.trouble.list");
                  this.dispose();
                } else {
                  vscode.window.showErrorMessage("Failed to upload!");
                }
              })
              .catch((error) => {
                console.error("Error:", error);
              });
            return;
          case "getSolution":
            if (isOffLineTrouble(message.troubleId)) {
              // const troubleList = this._globalState.get<Trouble[]>("troubleList");
              // const trouble = troubleList?.find((trouble) => trouble.id === message.troubleId);
              // if (!trouble) return;
              // const res = await fetch("https://orientalsalad.kro.kr:8102/gpt/error-feedback", {
              //   method: "POST",
              //   headers: {
              //     "Content-Type": "application/json",
              //   },
              //   body: JSON.stringify({
              //     context: trouble.content,
              //     loginSeq: this._globalState.get<string>("sessionId"),
              //     type: 2,
              //   }),
              // });
              // const resJson = await res.json();
              // if (resJson.success) {
              //   webview.postMessage({
              //     command: "setSolution",
              //     solution: resJson.context,
              //   });
              //   return;
              // }
              // vscode.window.showErrorMessage("Failed to get solution!");
              webview.postMessage({
                command: "setSolution",
                solution: "AI service need to be logged in!",
              });
              vscode.window.showErrorMessage("AI service need to be logged in!");
            } else {
              const context = MyTroubleListProviderLogin.getTroubleContent(message.troubleId);
              if (!context) return;
              const res = await fetch(
                "https://orientalsalad.kro.kr/api/troubleshooting/gpt/error-feedback",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    context,
                    loginSeq: this._globalState.get<string>("sessionId"),
                    type: 2,
                  }),
                }
              );
              const resJson = await res.json();
              if (resJson.success) {
                webview.postMessage({
                  command: "setSolution",
                  solution: resJson.context,
                });
                return;
              }
              vscode.window.showErrorMessage("Failed to get solution!");
            }
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
        }
      },
      undefined,
      this._disposables
    );
  }
}
