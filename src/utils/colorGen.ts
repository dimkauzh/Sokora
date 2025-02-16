import { ColorResolvable } from "discord.js";
import Vibrant from "node-vibrant";
import sharp from "sharp";
import { kominator } from "./kominator";

/**
 * Randomizes a color and outputs HEX.
 * @param hue Color to randomize.
 * @returns Color in HEX.
 */

export function genColor(hue: number) {
  return Bun.color(
    `hsl(${hue + 15 * Math.random()}, 100%, ${50 + 25 * Math.random()}%)`,
    "hex",
  ) as ColorResolvable;
}

/**
 * Outputs the most vibrant color from the image.
 * @param guild Guild image.
 * @param member Member image.
 * @returns The color in HEX.
 */

export async function genImageColor(guildURL?: string, memberURL?: string) {
  if (!guildURL || !memberURL) return;

  const imageBuffer = await (await fetch(guildURL ?? memberURL)).arrayBuffer();
  const { r, g, b } = (
    await new Vibrant(await sharp(imageBuffer).toFormat("jpg").toBuffer()).getPalette()
  ).Vibrant!;
  const hsl = kominator(Bun.color([r, g, b], "hsl")!);
  const h = Math.round(parseInt(hsl[0].replace("hsl(", "")) + 15 * Math.random());
  const l = Math.round(parseFloat(hsl[2].replace(")", "")) * 100 + 15 * Math.random());

  return Bun.color(`hsl(${h}, 100%, ${l}%)`, "hex") as ColorResolvable;
}
