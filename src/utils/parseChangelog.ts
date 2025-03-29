/**
 * Takes a MarkDown string that follows Sokora's CHANGELOG format and turns it into a Discord's-limited-markdown-friendly string containing only the latest release.
 *
 * @export
 * @param {string} string MarkDown string.
 * @returns {string} Parsed string.
 */
export function parseChangelogString(string: string): string {
    const array = string.split("\n")
        .filter((s) => s.trim() !== "")
        .filter((s) => !s.trim().startsWith("<!--"))

    const start = array.findIndex((s) => s.trim().startsWith("## "))
    const end = array.findIndex((s, i) => s.trim().startsWith("## ") && i > start)

    const newArray = array
        .splice(start, end - 1)
        .map((s) => s.replace("##", "#"))
    console.debug(newArray)
    return newArray.join("\n")
}
