/**
 * Handles role mentions, channel mentions, timestamps, and more.
 *
 * @param {string | number} who Who to mention? If it's a timestamp, pass `Date.now()`.
 * @param {(| "USER"
 *     | "ROLE"
 *     | "CHANNEL"
 *     | "DEFAULT_TIMESTAMP"
 *     | "SIMPLE_TIMESTAMP"
 *     | "DETAILED_TIMESTAMP")} type What to mention?
 * @returns {string} A `<@MENTION>` string.
 */
export function mention(
  who: string | number,
  type:
    | "USER"
    | "ROLE"
    | "CHANNEL"
    | "DEFAULT_TIMESTAMP"
    | "SIMPLE_TIMESTAMP"
    | "DETAILED_TIMESTAMP",
): string {
  switch (type) {
    case "CHANNEL":
      return `<#${who}>`;
    case "USER":
      return `<@${who}>`;
    case "ROLE":
      return `<@&${who}>`;
    case "DEFAULT_TIMESTAMP":
    case "DETAILED_TIMESTAMP":
    case "SIMPLE_TIMESTAMP": {
      if (typeof who !== "number" || isNaN(Number(who))) {
        // TODO - if i add errorEmbed here, too much stuff breaks because of async/await
        console.error(
          "Asked to format a timestamp but provided a string. You should provide timestamps as a number by using Date.now() (without flooring whatsoever). You were given back the string untouched.",
        );
        return who.toString();
      }
      switch (type) {
        case "DEFAULT_TIMESTAMP":
          return `<t:${Math.floor(who / 1000)}:D>`;
        case "SIMPLE_TIMESTAMP":
          return `<t:${Math.floor(who / 1000)}:d>`;
        case "DETAILED_TIMESTAMP":
          return `<t:${Math.floor(who / 1000)}>`;
      }
    }
  }
}
