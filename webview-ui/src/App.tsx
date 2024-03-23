import "./index.css";
import { vscode } from "./utilities/vscode";
import Trouble from "./Trouble";
import { useEffect, useState } from "react";
import Solution from "./Solution";
import LoginForm from "./LoginForm";
import { VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";

export const TROUBLE_SHOOTING_TYPE = {
  LOADING: -1 as const,
  TROUBLE: 0 as const,
  SOLUTION: 1 as const,
  LOGIN_FORM: 2 as const,
  TROUBLE_WITH_ERROR: 3 as const,
};

type TroubleShootingType = typeof TROUBLE_SHOOTING_TYPE[keyof typeof TROUBLE_SHOOTING_TYPE];

interface Message {
  command: string;
  sessionId: number;
  troubleShootingType: TroubleShootingType;
  defaultSkills?: string;
  troubleId?: string;
  defaultErrorMsg?: string;
  defaultCode?: string;
  solution?: string;
}

function App() {
  const [sessionId, setSessionId] = useState<number>(-1);
  const [troubleShootingType, setTroubleShootingType] = useState<TroubleShootingType>(
    TROUBLE_SHOOTING_TYPE.LOADING
  );
  const [defaultSkills, setDefaultSkills] = useState<any>();
  const [troubleId, setTroubleId] = useState<string>();
  const [errorMsg, setErrorMsg] = useState<any>();
  const [defaultCode, setDefaultCode] = useState<string>();
  const [solution, setSolution] = useState<string>();

  useEffect(() => {
    window.addEventListener("message", onHandleInitMessage);
    return () => {
      window.removeEventListener("message", onHandleInitMessage);
    };
  }, []);

  useEffect(() => {
    vscode.postMessage({
      command: "getInitialStatus",
    });
  }, []);

  function onHandleInitMessage(event: MessageEvent<Message>) {
    const message = event.data;
    switch (message.command) {
      case "getInitialStatus":
        setTroubleShootingType(message.troubleShootingType);

        if (message.troubleShootingType === TROUBLE_SHOOTING_TYPE.TROUBLE) {
          setDefaultSkills(message.defaultSkills);
          setSessionId(message.sessionId);
        }
        if (message.troubleShootingType === TROUBLE_SHOOTING_TYPE.SOLUTION) {
          setTroubleId(message.troubleId);
          setSessionId(message.sessionId);
        }
        if (message.troubleShootingType === TROUBLE_SHOOTING_TYPE.TROUBLE_WITH_ERROR) {
          setSessionId(message.sessionId);
          setDefaultSkills(message.defaultSkills);
          setErrorMsg(message.defaultErrorMsg);
          setDefaultCode(message.defaultCode);
        }
        break;
      case "setSolution":
        setSolution(message.solution);
        break;
    }
  }

  return (
    <main className="flex items-center justify-center">
      {troubleShootingType === TROUBLE_SHOOTING_TYPE.TROUBLE ? (
        <Trouble sessionId={sessionId} defaultSkills={defaultSkills} />
      ) : troubleShootingType === TROUBLE_SHOOTING_TYPE.SOLUTION ? (
        <Solution sessionId={sessionId} troubleId={troubleId} solution={solution} />
      ) : troubleShootingType === TROUBLE_SHOOTING_TYPE.LOGIN_FORM ? (
        <LoginForm />
      ) : troubleShootingType === TROUBLE_SHOOTING_TYPE.TROUBLE_WITH_ERROR ? (
        <Trouble
          sessionId={sessionId}
          defaultSkills={defaultSkills}
          errMsg={errorMsg}
          defaultCode={defaultCode}
        />
      ) : (
        <VSCodeProgressRing />
      )}
    </main>
  );
}

export default App;
