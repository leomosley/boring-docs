import { FunctionType } from "./generate-docs";

export function getFunctions(content: string, extension: string): FunctionType[] {
  let functionRegex: RegExp;

  if (extension === ".ts" || extension === ".js") {
    functionRegex = /\/\*\*\s*([\s\S]*?)\s*\*\/\s*(export\s+)?(async\s+)?(?:function\s+(\w+)\s*\((.*?)\)(?:\s*:\s*(\S+))?|const\s+(\w+)\s*=\s*(async\s+)?\((.*?)\)(?:\s*:\s*(\S+))?\s*=>|let\s+(\w+)\s*=\s*(async\s+)?\((.*?)\)(?:\s*:\s*(\S+))?\s*=>|var\s+(\w+)\s*=\s*(async\s+)?\((.*?)\)(?:\s*:\s*(\S+))?\s*=>)/gs;
  } else if (extension === ".py") {
    functionRegex = /(?:'''([\s\S]*?)'''|"""([\s\S]*?)""")\s*(async\s+)?def\s+(\w+)\s*\((.*?)\)(?:\s*->\s*(\w+))?\s*:/gs;
  } else {
    throw new Error("Unsupported file extension");
  }

  const matches = Array.from(content.matchAll(functionRegex));
  const functions: FunctionType[] = [];

  // Process matches and populate the functions array
  matches.forEach(match => {
    if (extension === ".ts" || extension === ".js") {
      const docstring = match[1]?.trim() || "";
      // Handle different function declaration formats
      const name = match[4] || match[7] || match[11] || match[15] || "";
      const paramsString = match[5] || match[9] || match[13] || match[17] || "";
      const returnType = match[6] || match[10] || match[14] || match[18] || "any";

      if (name) {
        // Parse docstring to extract param descriptions, return description, and throws
        const parsedDocstring = parseJSDocstring(docstring);

        functions.push({
          name,
          params: parseJSParams(paramsString, parsedDocstring.params),
          returns: {
            type: returnType,
            description: parsedDocstring.returns
          },
          throws: parsedDocstring.throws,
          docstring
        });
      }
    } else if (extension === ".py") {
      // For Python, handle either single or triple quoted docstrings
      const docstring = (match[1] || match[2] || "").trim();
      const name = match[4] || "";
      const paramsString = match[5] || "";
      const returnType = match[6] || "any";

      if (name) {
        // Parse docstring to extract param descriptions, return description, and throws
        const parsedDocstring = parsePythonDocstring(docstring);

        functions.push({
          name,
          params: parsePythonParams(paramsString, parsedDocstring.params),
          returns: {
            type: returnType,
            description: parsedDocstring.returns
          },
          throws: parsedDocstring.throws,
          docstring
        });
      }
    }
  });

  return functions;
}

// Function to parse JSDoc-style docstrings
export function parseJSDocstring(docstring: string) {
  const params: Record<string, string> = {};
  let returns = '';
  const throws: Array<{ type: string, description: string }> = [];

  // Extract @param annotations
  const paramMatches = docstring.matchAll(/@param\s+{?([^}]*)}?\s+(\w+)\s+(.*?)(?=@|\n\s*\n|$)/gs);
  for (const match of paramMatches) {
    const paramType = match[1]?.trim();
    const paramName = match[2]?.trim();
    const paramDesc = match[3]?.trim();

    if (paramName) {
      params[paramName] = paramDesc || '';
    }
  }

  // Extract @returns annotation
  const returnsMatch = docstring.match(/@returns?\s+{?([^}]*)}?\s+(.*?)(?=@|\n\s*\n|$)/s);
  if (returnsMatch) {
    returns = returnsMatch[2]?.trim() || '';
  }

  // Extract @throws annotations
  const throwsMatches = docstring.matchAll(/@throws?\s+{?([^}]*)}?\s+(.*?)(?=@|\n\s*\n|$)/gs);
  for (const match of throwsMatches) {
    const throwType = match[1]?.trim() || 'Error';
    const throwDesc = match[2]?.trim() || '';

    throws.push({
      type: throwType,
      description: throwDesc
    });
  }

  return { params, returns, throws };
}

// Function to parse Python docstrings (supports Google style, NumPy style, and reST)
export function parsePythonDocstring(docstring: string) {
  const params: Record<string, string> = {};
  let returns = '';
  const throws: Array<{ type: string, description: string }> = [];

  // Look for Parameters section (Google style)
  const paramSection = docstring.match(/Args:|Parameters:?\s*([\s\S]*?)(?=Returns:|Raises:|Yields:|Examples:|$)/i);
  if (paramSection) {
    const paramLines = paramSection[1].split('\n');
    let currentParam = '';
    let currentDesc = '';

    for (const line of paramLines) {
      const paramMatch = line.match(/^\s*(\w+)(?:\s*\(([^)]+)\))?:\s*(.*)/);
      if (paramMatch) {
        // Save previous param if exists
        if (currentParam) {
          params[currentParam] = currentDesc.trim();
        }
        currentParam = paramMatch[1];
        currentDesc = paramMatch[3] || '';
      } else if (currentParam && line.trim()) {
        // Continuation of description
        currentDesc += ' ' + line.trim();
      }
    }

    // Save the last param
    if (currentParam) {
      params[currentParam] = currentDesc.trim();
    }
  }

  // Look for Returns section
  const returnsSection = docstring.match(/Returns:|Return:?\s*([\s\S]*?)(?=Raises:|Yields:|Examples:|$)/i);
  if (returnsSection) {
    returns = returnsSection[1].trim();
  }

  // Look for Raises section (exceptions)
  const raisesSection = docstring.match(/Raises:|Exceptions:?\s*([\s\S]*?)(?=Returns:|Yields:|Examples:|$)/i);
  if (raisesSection) {
    const raiseLines = raisesSection[1].split('\n');
    let currentEx = '';
    let currentDesc = '';

    for (const line of raiseLines) {
      const exMatch = line.match(/^\s*(\w+Error):\s*(.*)/);
      if (exMatch) {
        // Save previous exception if exists
        if (currentEx) {
          throws.push({
            type: currentEx,
            description: currentDesc.trim()
          });
        }
        currentEx = exMatch[1];
        currentDesc = exMatch[2] || '';
      } else if (currentEx && line.trim()) {
        // Continuation of description
        currentDesc += ' ' + line.trim();
      }
    }

    // Save the last exception
    if (currentEx) {
      throws.push({
        type: currentEx,
        description: currentDesc.trim()
      });
    }
  }

  return { params, returns, throws };
}

// Parse JS/TS parameters with their types and merge with extracted descriptions
export function parseJSParams(paramsString: string, paramDescriptions: Record<string, string>) {
  if (!paramsString.trim()) {
    return [];
  }

  return paramsString.split(',')
    .map(param => {
      param = param.trim();
      // Handle TypeScript/JavaScript type annotations
      const [nameWithDefault, typeAnnotation] = param.includes(':')
        ? param.split(':').map(p => p.trim())
        : [param, 'any'];

      // Clean up parameter name (remove default values)
      const name = nameWithDefault.replace(/\s*=\s*.*$/, '').trim();
      // Clean up type (remove spaces, trailing semicolons, etc.)
      const type = typeAnnotation ? typeAnnotation.replace(/[;,]$/, '').trim() : 'any';

      return {
        name,
        type,
        description: paramDescriptions[name] || ''
      };
    });
}

// Parse Python parameters with their types and merge with extracted descriptions
function parsePythonParams(paramsString: string, paramDescriptions: Record<string, string>) {
  if (!paramsString.trim()) {
    return [];
  }

  return paramsString.split(',')
    .map(param => {
      param = param.trim();
      if (param === 'self' || param === 'cls') {
        return null; // Skip self/cls parameters in class methods
      }

      // Handle Python 3 type annotations (param: type)
      const [nameWithDefault, typeAnnotation] = param.includes(':')
        ? param.split(':').map(p => p.trim())
        : [param, ''];

      // Clean up parameter name (remove default values)
      const name = nameWithDefault.includes('=')
        ? nameWithDefault.split('=')[0].trim()
        : nameWithDefault.trim();

      // Get type and clean it
      let type = typeAnnotation || 'any';
      if (type.includes('=')) {
        type = type.split('=')[0].trim();
      }

      return {
        name,
        type,
        description: paramDescriptions[name] || ''
      };
    })
    .filter(Boolean) as Array<{ name: string, type: string, description: string }>;
}