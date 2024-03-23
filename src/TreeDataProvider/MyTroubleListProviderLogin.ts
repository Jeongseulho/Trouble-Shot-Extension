import { MyTroubleListProvider, Trouble } from "./MyTroubleListProvider";
import * as vscode from "vscode";

export class MyTroubleListProviderLogin extends MyTroubleListProvider {
  constructor(readonly globalState: vscode.Memento) {
    super(globalState);
  }
  static curTroubleList: Trouble[] = [];

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  async getChildren(): Promise<Trouble[]> {
    const sessionId = this.globalState.get<number>("sessionId");
    const res = await fetch(
      `https://orientalsalad.kro.kr/api/troubleshooting/trouble-shootings?pageSize=10&writerSeq=${sessionId}&loginSeq=${sessionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const resJson = await res.json();
    const troubleList = resJson.troubleShootingList.map((trouble: any) => {
      return new Trouble(
        trouble.title,
        new Date(trouble.createTime),
        trouble.context,
        trouble.seq.toString(),
        trouble.solved ? "solved" : "unSolved"
      );
    });
    MyTroubleListProviderLogin.curTroubleList = troubleList;
    return troubleList;
  }

  async deleteTroubleShooting(trouble: Trouble) {
    const sessionId = this.globalState.get<number>("sessionId");
    const res = await fetch(
      `https://orientalsalad.kro.kr/api/troubleshooting/trouble-shootings/${
        trouble.id
      }?loginSeq=${sessionId}&type=${2}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const resJson = await res.json();
    if (resJson.success) {
      this.refresh();
      vscode.window.showInformationMessage("Delete trouble shooting success");
    } else {
      vscode.window.showErrorMessage("Delete trouble shooting failed");
    }
  }

  static getTroubleContent(id: string) {
    const trouble = MyTroubleListProviderLogin.curTroubleList.find((trouble) => trouble.id === id);
    return trouble?.content;
  }
}
