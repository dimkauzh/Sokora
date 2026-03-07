import { Color, getColor, getSwatches } from "colorthief";
import { ColorResolvable, type User } from "discord.js";

/** Sokolors, colors of Sokora, get it? */
export enum Sokolors {
  Red = 30,
  Yellow = 110,
  Green = 140,
  Blue = 240,
  Purple = 300,
}

export type ColorOptions = {
  hue: Sokolors;
  user?: User;
  avatar?: string;
  cv2?: boolean;
};

export async function colorize(
  options: ColorOptions,
): Promise<ColorResolvable | [number, number, number] | null> {
  const { user, avatar, hue, cv2 } = options;

  function genColor(): ColorResolvable | [number, number, number] | null {
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

  function randomizeColor(hue: number, saturation: number, lightness: number) {
    const [h, s, l] = [
      hue + 10 * Math.random(),
      saturation + 15 * Math.random(),
      lightness + 15 * Math.random(),
    ];
    if (cv2) return Bun.color(`hsl(${h}, ${s}%, ${l}%)`, "[rgb]");
    return Bun.color(`hsl(${h}, ${s}%, ${l}%)`, "hex") as ColorResolvable;
  }

  if (!avatar) return genColor();
  const buffer = Buffer.from(await (await fetch(avatar!)).arrayBuffer());
  if (!buffer) return genColor();

  let color = (await getSwatches(buffer, { quality: 5 })).Vibrant?.color;
  if (!color) color = (await getColor(buffer, { quality: 5 })) as Color | undefined;
  if (!color)
    if (user) {
      const accentColor = user.hexAccentColor;
      if (!accentColor) return genColor();
      const hsl = Bun.color(accentColor, "hsl")!;
      return randomizeColor(
        parseInt(hsl[0].replace("hsl(", "")),
        parseInt(hsl[1]),
        parseInt(hsl[2].replace(")", "")),
      );
    } else return genColor();

  const [r, g, b] = color.array();
  const hsl = color.hsl();
  return randomizeColor(
    hsl.h,
    hsl.s,
    (Math.abs(r - g) < 15 && Math.abs(g - b) < 15) || (r == g && g == b) ? 70 : hsl.l,
  );
}
