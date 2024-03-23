import * as vscode from "vscode";
import { format } from "timeago.js";

export class Err extends vscode.TreeItem {
  constructor(
    public readonly title: string,
    public readonly createTime: Date,
    public errMsg: string,
    public readonly id: string
  ) {
    super(title);
    this.tooltip = `Created at ${this.createTime.toLocaleString()}\n${this.errMsg}`;
    this.description = format(this.createTime);
  }
}

export class ErrHistoryProvider implements vscode.TreeDataProvider<Err> {
  constructor(readonly globalState: vscode.Memento) {}

  private _onDidChangeTreeData: vscode.EventEmitter<Err | undefined | null | void> =
    new vscode.EventEmitter<Err | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Err | undefined | null | void> =
    this._onDidChangeTreeData.event;

  updateDesc(): void {
    const errHistory = this.globalState.get<Err[]>("errHistory");
    errHistory?.forEach((err) => {
      err.description = format(err.createTime);
    });
    this.globalState.update("errHistory", errHistory);
  }

  refresh(): void {
    this.updateDesc();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Err): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Err): Thenable<Err[]> {
    this.updateDesc();
    const errHistory = this.globalState.get<Err[]>("errHistory") || [];
    return Promise.resolve(errHistory);
  }

  addErr(err: Err) {
    const errHistory = this.globalState.get<Err[]>("errHistory") || [];
    this.globalState.update("errHistory", [err, ...errHistory]);
    this.refresh();
  }

  delErr(err: Err) {
    const errHistory = this.globalState.get<Err[]>("errHistory") || [];
    this.globalState.update(
      "errHistory",
      errHistory.filter((e) => e.id !== err.id)
    );
    this.refresh();
  }

  clearErr() {
    this.globalState.update("errHistory", []);
    this.refresh();
  }
}
