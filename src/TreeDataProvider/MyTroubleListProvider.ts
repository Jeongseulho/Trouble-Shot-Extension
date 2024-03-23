import * as vscode from "vscode";
import { format } from "timeago.js";

export class Trouble extends vscode.TreeItem {
  constructor(
    public readonly title: string,
    public readonly createTime: Date,
    public content: string,
    public readonly id: string,
    public contextValue: string
  ) {
    super(title);
    this.tooltip = `Created at ${this.createTime.toLocaleString()}`;
    this.description = `${format(this.createTime)}, ${this.contextValue}`;
    this.command = {
      command: "view.trouble",
      title: "View trouble shooting",
      arguments: [this.id],
    };
  }
}

export abstract class MyTroubleListProvider implements vscode.TreeDataProvider<Trouble> {
  constructor(readonly globalState: vscode.Memento) {}

  protected _onDidChangeTreeData: vscode.EventEmitter<Trouble | undefined | null | void> =
    new vscode.EventEmitter<Trouble | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Trouble | undefined | null | void> =
    this._onDidChangeTreeData.event;

  updateDesc(): void {
    const prevTroubleList = this.globalState.get<Trouble[]>("troubleList");
    const newTroubleList = prevTroubleList?.map((trouble) => {
      trouble.description = `${format(trouble.createTime)}, ${trouble.contextValue}`;
      return trouble;
    });
    this.globalState.update("troubleList", newTroubleList);
  }

  refresh(): void {
    this.updateDesc();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Trouble): vscode.TreeItem {
    return element;
  }

  abstract getChildren(): Thenable<Trouble[]>;
}
