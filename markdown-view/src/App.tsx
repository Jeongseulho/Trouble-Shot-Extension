import { vscode } from "./utilities/vscode";
import { VSCodeButton, VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useEffect, useState } from "react";
import * as marked from "marked";
import { GoCopilot } from "react-icons/go";

function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClick, setIsClick] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>("");

  function onHandleInitMessage(event: MessageEvent<any>) {
    const message = event.data;
    switch (message.command) {
      case "setFeedback":
        setIsLoading(false);
        setFeedback(message.feedback);
        break;
    }
  }

  useEffect(() => {
    window.addEventListener("message", onHandleInitMessage);
    return () => {
      window.removeEventListener("message", onHandleInitMessage);
    };
  }, []);

  function getFeedBack() {
    vscode.postMessage({
      command: "getFeedback",
    });
    setIsLoading(true);
    setIsClick(true);
  }

  const htmlString = marked.parse(feedback);
  return (
    <main>
      {!isClick ? (
        <div onClick={getFeedBack}>
          <VSCodeButton>
            <span id="icon">
              <GoCopilot />
            </span>
            AI 피드백 받기
          </VSCodeButton>
        </div>
      ) : isLoading ? (
        <VSCodeProgressRing />
      ) : (
        <div id="markdown" dangerouslySetInnerHTML={{ __html: htmlString }}></div>
      )}
    </main>
  );
}

export default App;
