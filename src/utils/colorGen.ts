import { ColorResolvable, type User } from "discord.js";
import { Vibrant } from "node-vibrant/node";
import sharp from "sharp";
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
 * Randomizes a color and outputs HEX.
 * @param hue Hue of the color to randomize. `0` and `360` are red, `120` is green, `240` is blue. Value should be between `0` and `360`.
 * @returns Color in HEX.
 */
function genColor(hue: Sokolors): ColorResolvable {
  return Bun.color(
    `oklch(${70 + 10 * Math.random()}% ${0.09 + 0.02 * Math.random()} ${hue + 10 * Math.random()})`,
    "hex",
  ) as ColorResolvable;
}

/**
 * Randomizes a color and outputs RGB for the accent color of CV2 containers.
 * @param hue Hue of the color to randomize. `0` and `360` are red, `120` is green, `240` is blue. Value should be between `0` and `360`.
 * @returns Color in RGB.
 */
function genColorCV2(hue: Sokolors) {
  return Bun.color(
    `oklch(${70 + 10 * Math.random()}% ${0.09 + 0.02 * Math.random()} ${hue + 10 * Math.random()})`,
    "[rgb]",
  );
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
  // todo: make this support OKLCH like the rest of the functions
  if (!url) return;

  const imageBuffer = await (await fetch(url)).arrayBuffer();
  const { r, g, b } = (
    await new Vibrant(await sharp(imageBuffer).toFormat("jpg").toBuffer()).getPalette()
  ).Vibrant!;
  const hsl = kominator(Bun.color([r, g, b], "hsl")!);
  const h = parseInt(hsl[0].replace("hsl(", "")) + 15 * Math.random();
  const s = parseFloat(hsl[1]) * 100 + 20 * Math.random();
  const l = parseFloat(hsl[2].replace(")", "")) * 100 + 15 * Math.random();

  if (cv2) return Bun.color(`hsl(${h}, ${s}%, ${l}%)`, "[rgb]");
  return Bun.color(`hsl(${h}, ${s}%, ${l}%)`, "hex") as ColorResolvable;
}

export async function colorize(options: {
  user?: User;
  avatar?: string;
  hue?: Sokolors;
  cv2?: boolean;
}) {
  const { user, avatar, hue, cv2 } = options;

  return (
    (await genImageColor(avatar!, cv2)) ??
    user?.hexAccentColor ??
    (cv2 ? genColorCV2(hue!) : genColor(hue!))
  );
}
