/**
 * Capitalizes the first letter of every sentence in an HTML string.
 * Handles text after periods, exclamation marks, question marks,
 * and the very first character of the content.
 */
export function capitalizeHtmlSentences(html) {
  if (!html) return html;
  // Match text outside of HTML tags and capitalize first letter of each sentence
  return html.replace(/>([^<]+)</g, (match, text) => {
    const capitalized = capitalizeSentences(text);
    return `>${capitalized}<`;
  }).replace(/^([^<]+)/, (match) => capitalizeSentences(match));
}

function capitalizeSentences(text) {
  // Capitalize first non-whitespace character
  let result = text.replace(/^\s*\S/, (m) => m.toUpperCase());
  // Capitalize after sentence-ending punctuation followed by whitespace
  result = result.replace(/([.!?])\s+([a-z])/g, (m, punct, letter) => {
    return punct + m.slice(punct.length, -1) + letter.toUpperCase();
  });
  return result;
}