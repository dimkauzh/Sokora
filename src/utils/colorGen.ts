import { getColor } from "colorthief";
import { ColorResolvable, type User } from "discord.js";
import { kominator } from "./kominator";

/** Sokolors, colors of Sokora, get it? */
export enum Sokolors {
  Red = 30,
  Yellow = 110,
  Green = 140,
  Blue = 240,
  Purple = 300,
}

/**
 * Randomizes a color and outputs hex (or RGB for CV2 containers).
 * @param hue Hue of the color to randomize.
 * @returns Color in hex (or RGB).
 */
function genColor(hue: Sokolors, cv2?: boolean): ColorResolvable | [number, number, number] | null {
  if (cv2)
    return Bun.color(
      `oklch(${70 + 10 * Math.random()}% ${0.09 + 0.02 * Math.random()} ${hue + 10 * Math.random()})`,
      "[rgb]",
    );

  return Bun.color(
    `oklch(${70 + 10 * Math.random()}% ${0.09 + 0.02 * Math.random()} ${hue + 10 * Math.random()})`,
    "hex",
  ) as ColorResolvable;
}

/**
 * Outputs the most vibrant color from the image.
 * @param {?string} url Image URL.
 * @returns {Promise<ColorResolvable | undefined>} The color in HEX, or undefined if both URLs are missing.
 */
export async function genImageColor(
  url: string,
  cv2?: boolean,
): Promise<ColorResolvable | [number, number, number] | null | undefined> {
  if (!url) return;

  // todo: make this more reliable
  const [r, g, b] = (await getColor(Buffer.from(await (await fetch(url)).arrayBuffer()), {
    quality: 1,
  })) || [null, null, null];
  if (!r || !g || !b) return;
  console.log(r, g, b);

  const hsl = kominator(Bun.color([r, g, b], "hsl")!);
  const trueHue = hsl[0].replace("hsl(", "");
  const h = parseInt(trueHue == "nan" ? "0" : trueHue) + 15 * Math.random();
  const s = parseFloat(hsl[1]) * 100 + 20 * Math.random();
  const l = Math.max(
    ((Math.abs(r - g) < 15 && Math.abs(g - b) < 15) || (r == g && g == b)
      ? 0.7
      : parseFloat(hsl[2].replace(")", ""))) *
      100 +
      15 * Math.random(),
    32.5,
  );

  console.log(`hsl(${h}, ${s}%, ${l}%)`);

  if (cv2) return Bun.color(`hsl(${h}, ${s}%, ${l}%)`, "[rgb]");
  return Bun.color(`hsl(${h}, ${s}%, ${l}%)`, "hex") as ColorResolvable;
}

export async function colorize(options: {
  hue: Sokolors;
  user?: User;
  avatar?: string;
  cv2?: boolean;
}) {
  const { user, avatar, hue, cv2 } = options;
  return (await genImageColor(avatar!, cv2)) ?? user?.hexAccentColor ?? genColor(hue, cv2);
}
