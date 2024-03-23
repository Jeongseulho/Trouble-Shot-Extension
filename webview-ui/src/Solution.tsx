import { VSCodeTextArea, VSCodeButton, VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";
import { useEffect, useState } from "react";
import { BsReplyAll } from "react-icons/bs";
import { VscCopy } from "react-icons/vsc";
import { vscode } from "./utilities/vscode";
import { GoCopilot } from "react-icons/go";

interface Props {
  sessionId: number;
  troubleId: string | undefined;
  solution: string | undefined;
}

const Solution = ({ sessionId, troubleId, solution }: Props) => {
  const [articleInfo, setArticleInfo] = useState({
    description: "",
    code: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClick, setIsClick] = useState<boolean>(false);

  useEffect(() => {
    setArticleInfo((prev) => ({
      ...prev,
      description: solution || "",
    }));
    if (solution) setIsLoading(false);
  }, [solution]);

  const { description, code } = articleInfo;
  function onChange(e: any) {
    const { name, value } = e.target;
    setArticleInfo({
      ...articleInfo,
      [name]: value,
    });
  }

  function onCreateMarkdown() {
    const { description, code } = articleInfo;

    let markdownText = `## SOLUTION\n\n`;
    markdownText += `---------------------------------------\n\n`;
    markdownText += `### 해결 코드\n\`\`\`\n${code}\n\`\`\`\n\n`;
    markdownText += `### 해결 설명\n${description}\n\n`;

    return markdownText;
  }

  function checkValid() {
    const { description } = articleInfo;
    if (description.trim().length < 2) {
      vscode.postMessage({
        command: "showMessage",
        type: "error",
        content: "Description must be at least 2 characters",
      });
      return false;
    }
    return true;
  }

  async function onCopyMarkdown() {
    try {
      await navigator.clipboard.writeText(onCreateMarkdown());
      vscode.postMessage({
        command: "showMessage",
        type: "info",
        content: "Copied to clipboard!",
      });
    } catch (error) {
      vscode.postMessage({
        command: "showMessage",
        type: "error",
        content: "Failed to copy to clipboard!",
      });
    }
  }

  function onSolveTrouble() {
    if (!checkValid()) return;
    vscode.postMessage({
      command: "solveTrouble",
      articleInfo: {
        content: onCreateMarkdown(),
        troubleId,
      },
    });
  }

  function onGetSolution() {
    vscode.postMessage({
      command: "getSolution",
      troubleId,
    });
    setIsClick(true);
    setIsLoading(true);
  }

  return (
    <section className="flex flex-col w-2/3 gap-1 ">
      <VSCodeTextArea value={code} onInput={onChange} name="code" rows={7}>
        Solution Code
      </VSCodeTextArea>
      <VSCodeTextArea value={description} onInput={onChange} name="description" rows={4}>
        Solution Description
      </VSCodeTextArea>
      <div className="flex items-center justify-center gap-5 mt-5">
        <div onClick={onCopyMarkdown}>
          <VSCodeButton>
            <VscCopy className="mr-3 " />
            Copy Markdown Source
          </VSCodeButton>
        </div>

        <div onClick={onSolveTrouble}>
          <VSCodeButton>
            <BsReplyAll className="mr-3 " />
            Reply Solution
          </VSCodeButton>
        </div>
        {!isClick ? (
          <div onClick={onGetSolution}>
            <VSCodeButton>
              <GoCopilot className="mr-3 " />
              Recommended Solution by AI
            </VSCodeButton>
          </div>
        ) : isLoading ? (
          <VSCodeProgressRing />
        ) : null}
      </div>
    </section>
  );
};
export default Solution;
