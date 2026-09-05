/**
 * Coordinate Precision Truncation Module
 * Robustly parses and truncates numeric values in SVG paths and coordinate attributes.
 */

function roundTo(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/**
 * Robustly parses an SVG path data string, avoiding arc flag truncation.
 * Injects spaces before ambiguous numbers to maintain syntax validity.
 */
export function truncatePath(d: string, decimals: number): string {
  let result = '';
  let i = 0;
  const len = d.length;
  let cmd = '';
  let argCount = 0;

  while (i < len) {
    let char = d[i];

    // Skip whitespace and commas
    if (char === ' ' || char === ',' || char === '\n' || char === '\r' || char === '\t') {
      result += char;
      i++;
      continue;
    }

    // Is it a command letter?
    if (/[a-zA-Z]/.test(char)) {
      cmd = char.toUpperCase();
      // Reset argument count for the new command
      argCount = 0;
      result += char;
      i++;
      continue;
    }

    // Is it an Arc flag? 
    // Arc arguments: rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y
    // Indices 3 and 4 are flags
    if (cmd === 'A' && (argCount % 7 === 3 || argCount % 7 === 4)) {
      if (char === '0' || char === '1') {
        result += char;
        argCount++;
        i++;
        continue;
      } else {
        // Fallback for invalid syntax
        result += char;
        i++;
        continue;
      }
    }

    // Parse a number
    let numStr = '';
    if (char === '+' || char === '-') {
      numStr += char;
      i++;
      char = d[i];
    }
    
    let hasDot = false;
    while (i < len && /[0-9.]/.test(char)) {
      if (char === '.') {
        if (hasDot) break;
        hasDot = true;
      }
      numStr += char;
      i++;
      char = d[i];
      
      // Scientific notation (e.g. 1e-5)
      if (char === 'e' || char === 'E') {
        numStr += char;
        i++;
        char = d[i];
        if (char === '+' || char === '-') {
          numStr += char;
          i++;
          char = d[i];
        }
        while (i < len && /[0-9]/.test(char)) {
          numStr += char;
          i++;
          char = d[i];
        }
        break; // Once exponent is parsed, number is complete
      }
    }

    if (numStr.length > 0 && numStr !== '+' && numStr !== '-') {
      const val = parseFloat(numStr);
      if (!isNaN(val)) {
        const formatted = roundTo(val, decimals).toString();
        
        // Prevent ambiguous numeric adjacency by injecting a space 
        // if the previous char in the output is a digit/dot and the new number doesn't start with a sign
        if (result.length > 0) {
           const lastChar = result[result.length - 1];
           if (/[0-9.]/.test(lastChar) && !/^[+-]/.test(formatted)) {
               result += ' ';
           }
        }
        result += formatted;
      } else {
        result += numStr;
      }
      argCount++;
    } else if (numStr.length > 0) {
       result += numStr; // isolated sign
    } else {
      // Unrecognized character
      if (i < len && d[i] !== undefined) {
        result += d[i];
        i++;
      }
    }
  }

  return result;
}

/**
 * Truncates space or comma delimited number lists (e.g., viewBox, points, cx, etc.)
 */
export function truncateNumberStrings(str: string, decimals: number): string {
  // Simple regex tokenizer for general coordinate attributes
  // Matches floats, integers, and scientific notation
  const regex = /([+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)/g;
  return str.replace(regex, (match) => {
    const val = parseFloat(match);
    if (isNaN(val)) return match;
    return roundTo(val, decimals).toString();
  });
}
