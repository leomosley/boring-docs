import { FunctionType, ParamType, ThrowsType } from "./generate-docs";

export function cleanString(str: string) {
  if (!str) return;
  str = str.replace(/[\r\n]+/g, " ");  // Strip \n and \r
  str = str.replace(/^[\s\-*]+|[\s\-*]+$/g, ""); // Strip leading/trailing spaces, hyphens, and asterisks
  return str;
}

export const PY_REGEX = /def\s+(\w+)\s*\(.*?\)\s*(?:->\s*[\w\[\], ]+)?\s*:\s*\n\s*(?:(?:"""([\s\S]*?)"""|'''([\s\S]*?)'''))/gs;

export const JS_REGEX = /\/\*\*\s*([\s\S]*?)\s*\*\/\s*(export\s+)?(async\s+)?(?:function\s+(\w+)\s*\((.*?)\)(?:\s*:\s*(\S+))?|const\s+(\w+)\s*=\s*(async\s+)?\((.*?)\)(?:\s*:\s*(\S+))?\s*=>|let\s+(\w+)\s*=\s*(async\s+)?\((.*?)\)(?:\s*:\s*(\S+))?\s*=>|var\s+(\w+)\s*=\s*(async\s+)?\((.*?)\)(?:\s*:\s*(\S+))?\s*=>)/gs;

export function extractFunctions(
  content: string,
  extension: string,
): RegExpExecArray[] {
  let functionRegex: RegExp;

  if (extension === ".ts" || extension === ".js") {
    functionRegex = JS_REGEX;
  } else if (extension === ".py") {
    functionRegex = PY_REGEX;
  } else {
    throw new Error("Unsupported file extension");
  }

  return [...content.matchAll(functionRegex)];
}

export function parseMatch(
  match: RegExpExecArray,
  extension: string,
): FunctionType | undefined {
  if (extension === ".ts" || extension === ".js") {
    return parseJSFunction(match);
  } else if (extension === ".py") {
    return parsePythonFunction(match);
  } else {
    throw new Error("Unsupported file extension");
  }
}

export function parsePythonFunction(match: RegExpExecArray): FunctionType | undefined {
  const name = match[1];
  const docstring = match[2];

  const params: ParamType = [];
  const throws: ThrowsType = [];
  const returns: ThrowsType = [];

  const docstringContent = docstring.split(/[\r\n]+/g);

  const description = cleanString(docstringContent[1]);

  const annotations = docstringContent
    .slice(1)
    .map((annotation) => cleanString(annotation))
    .filter(Boolean);

  for (const annotation of annotations) {
    if (!annotation) continue;
    const splitted = annotation.split(" ");

    if (splitted[0] === ":param") {
      const [, name, ...desc] = splitted;
      params.push({
        name: name.replace(":", ""),
        type: "",
        description: cleanString(desc.join(" ")),
      });
    } else if (splitted[0] === ":type") {
      const [, name, type] = splitted;
      params.map((param) => {
        if (param.name === name.replace(":", "")) {
          param.type = type;
        }
      });
    } else if (splitted[0] === ":return:") {
      const [, ...desc] = splitted;
      returns.push({
        type: "",
        description: cleanString(desc.join(" ")),
      });
    } else if (splitted[0] === ":raise") {
      const [, type, ...desc] = splitted;
      throws.push({
        type,
        description: cleanString(desc.join(" ")),
      });
    } else if (splitted[0] === ":rtype:") {
      const [, type] = splitted;
      returns.map((ret) => {
        ret.type = type;
      });
    }
  }

  return {
    name,
    description,
    params,
    throws,
    returns,
    docstring,
  }
}

export function parseJSFunction(match: RegExpExecArray): FunctionType | undefined {
  const name = match[4];
  const docstring = match[0];

  const params: ParamType = [];
  const throws: ThrowsType = [];
  const returns: ThrowsType = [];

  const docstringContent = match[1].split(/[\r\n]+/g);

  const description = cleanString(docstringContent[0]);

  const annotations = docstringContent
    .slice(1)
    .map((annotation) => cleanString(annotation))
    .filter(Boolean);

  for (const annotation of annotations) {
    if (!annotation) continue;
    const splitted = annotation.split(" ");

    if (splitted[0] === "@param") {
      const [, type, name, ...desc] = splitted;
      params.push({
        name,
        type: type.replace(/[{}]/g, ""),
        description: cleanString(desc.join(" ")),
      });
    } else if (splitted[0] === "@returns") {
      const [, type, ...desc] = splitted;
      returns.push({
        type: type.replace(/[{}]/g, ""),
        description: cleanString(desc.join(" ")),
      });
    } else if (splitted[0] === "@throws") {
      const [, type, ...desc] = splitted;
      throws.push({
        type: type.replace(/[{}]/g, ""),
        description: cleanString(desc.join(" ")),
      });
    }
  }

  return {
    name,
    description,
    params,
    throws,
    returns,
    docstring,
  }
}

export function getFunctions(
  content: string,
  extension: string,
): FunctionType[] {
  const matches = extractFunctions(content, extension);
  const functions: FunctionType[] = [];

  for (const match of matches) {
    const parsed = parseMatch(match, extension);
    if (parsed) functions.push(parsed);
  }

  return functions;
}