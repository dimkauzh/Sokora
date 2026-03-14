type TVer = `${number}/${number}/${number}` | "Work in progress";
type TParsedVersion = { minor: boolean; ver: string; codename: null | string; date: TVer };
const changelog = await Bun.file("./CHANGELOG.md").text();

/**
 * Gets the changelog of a specified Sokora version (directly from CHANGELOG.md).
 *
 * @param ver Version to get changelog for.
 * @returns An object with changelog data.
 */
export function getChangelog(ver: string): TParsedVersion & {
  body: string;
} {
  const _ = changelog.split("\n").filter(s => !s.startsWith("<!--"));
  const i = _.findIndex(s => s.startsWith(`## ${ver}`));
  const i2 = _.slice(i).filter(Boolean);
  const i3 = i2.slice(1).findIndex(s => s.startsWith("## "));
  const lines = i2.slice(0, (i3 === -1 ? i2.length - 1 : i3) + 1);

  return {
    ...parseVersion(lines[0]),
    body: lines.slice(1).join("\n"),
  };
}

function parseVersion(str: string): TParsedVersion {
  const [ver, codename, date] = str.replace("## ", "").split(" - ");
  const minor = ver.endsWith(".0");
  if (!date) return { ver, date: codename as any, minor, codename: null };
  return { ver, date: date as any, codename, minor };
}

/**
 * Gets a list of all released versions.
 *
 * @returns An array of objects telling you the version, the date, and whether it's a minor or a patch release (SemVer-wise).
 */
export function getVersions(): TParsedVersion[] {
  const res: TParsedVersion[] = [];

  changelog
    .split("\n")
    .filter(s => s.startsWith("## "))
    .map(s => {
      res.push(parseVersion(s));
    });

  return res;
}
