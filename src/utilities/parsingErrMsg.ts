export function parsingErrMsg(stdout: string): { title: string; errMsg: string } {
  const errorIndicator = "Failed to compile.";
  const errorIndex = stdout.indexOf(errorIndicator);

  if (errorIndex !== -1) {
    const errorSection = stdout.substring(errorIndex + errorIndicator.length);

    const eslintIndex = errorSection.indexOf("[eslint]");

    if (eslintIndex !== -1) {
      const errMsgStart = eslintIndex;
      const errMsgEnd = errorSection.indexOf("\n\n", eslintIndex);
      const errMsg =
        errMsgEnd !== -1
          ? errorSection.substring(errMsgStart, errMsgEnd).trim()
          : errorSection.substring(errMsgStart).trim();

      return { title: "Syntax error", errMsg };
    }

    const moduleErrMatch = errorSection.match(/(Module not found: Error:|Error:)/i);
    if (moduleErrMatch) {
      const title = moduleErrMatch[0].trim().replace(/:/gi, "");
      const errMsg = errorSection.substring(errorSection.indexOf(title)).trim();
      return { title, errMsg };
    }

    const refErrMatch = errorSection.match(/\[eslint][\s\S]*?no-undef/);
    if (refErrMatch) {
      const errMsg = refErrMatch[0];
      return { title: "Reference Error", errMsg };
    }

    const propertyErrRegex =
      /Property '\w+' does not exist on type '[\s\S]*?\r\n.*?\r\n.*?\r\n.*?\r\n/;
    const propertyErrMatch = errorSection.match(propertyErrRegex);
    if (propertyErrMatch && propertyErrMatch.index) {
      const endOfMessageMatch = errorSection.substring(propertyErrMatch.index).match(/^\s*$/m);
      if (endOfMessageMatch && endOfMessageMatch.index) {
        const errMsg = errorSection
          .substring(propertyErrMatch.index, propertyErrMatch.index + endOfMessageMatch.index)
          .trim();
        return { title: "Property Error", errMsg };
      }
    }
  }

  return { title: "", errMsg: "" };
}
