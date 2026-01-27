// Parse interactive elements from AI chat messages

export interface InteractiveElement {
  type: 'radio' | 'checkbox';
  field: string;
  options: string[];
}

export interface ParsedMessage {
  textBefore: string;
  interactiveElement?: InteractiveElement;
  textAfter: string;
}

/**
 * Parse a message for interactive elements using the <<<OPTIONS>>> format
 *
 * Format:
 * <<<OPTIONS:radio:fieldName>>>
 * ["Option 1", "Option 2", "Option 3"]
 * <<<END>>>
 */
export function parseMessageForInteractiveElements(content: string): ParsedMessage {
  // Match the OPTIONS block pattern
  const pattern = /<<<OPTIONS:(radio|checkbox):(\w+)>>>\s*\n?\s*\[([\s\S]*?)\]\s*\n?\s*<<<END>>>/;
  const match = content.match(pattern);

  if (!match) {
    return {
      textBefore: content,
      textAfter: '',
    };
  }

  const [fullMatch, type, field, optionsStr] = match;
  const matchIndex = content.indexOf(fullMatch);
  const textBefore = content.substring(0, matchIndex).trim();
  const textAfter = content.substring(matchIndex + fullMatch.length).trim();

  // Parse the options array
  let options: string[] = [];
  try {
    // Try to parse as JSON array
    options = JSON.parse(`[${optionsStr}]`);
  } catch {
    // Fallback: split by comma and clean up
    options = optionsStr
      .split(',')
      .map(s => s.trim().replace(/^["']|["']$/g, ''))
      .filter(s => s.length > 0);
  }

  return {
    textBefore,
    interactiveElement: {
      type: type as 'radio' | 'checkbox',
      field,
      options,
    },
    textAfter,
  };
}

/**
 * Remove the OPTIONS block from a message content for display
 * (used when we want to show the text without the raw markup)
 */
export function stripInteractiveMarkup(content: string): string {
  return content.replace(
    /<<<OPTIONS:(radio|checkbox):(\w+)>>>\s*\n?\s*\[[\s\S]*?\]\s*\n?\s*<<<END>>>/g,
    ''
  ).trim();
}
