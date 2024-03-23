import { VSCodeButton, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { BiLogIn } from "react-icons/bi";
import { useState } from "react";
import { vscode } from "./utilities/vscode";

const LoginForm = () => {
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  function onChange(e: any) {
    setLoginForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }
  function onLogin() {
    vscode.postMessage({
      command: "onLogin",
      body: {
        ...loginForm,
        type: 2,
      },
    });
  }
  return (
    <section className="flex flex-col w-2/3 gap-3 ">
      <VSCodeTextField value={loginForm.email} name="email" onInput={onChange}>
        ID
      </VSCodeTextField>
      <VSCodeTextField
        value={loginForm.password}
        name="password"
        onInput={onChange}
        type="password">
        PASS WORD
      </VSCodeTextField>
      <div onClick={onLogin}>
        <VSCodeButton>
          <BiLogIn className="mr-3 " />
          LOGIN
        </VSCodeButton>
      </div>
    </section>
  );
};
export default LoginForm;
