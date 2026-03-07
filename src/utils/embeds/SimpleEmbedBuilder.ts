import {
  ContainerBuilder,
  RGBTuple,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from "discord.js";
import { colorize, ColorOptions } from "utils/colorGen";

type textProp = {
  name: string;
  value: string;
};

// ComponentsV2 doesn't have small icons for author and footer yet
/* type textAndIcon = {
    name: string,
    iconURL?: string,
} */

type separatorProp = {
  divider?: boolean;
  spacing?: SeparatorSpacingSize;
};

const isSeparator = (f: any): f is separatorProp => !f["name"];

type embedProperties = {
  author?: string;
  thumb?: string;
  title?: string;
  desc?: string;
  fields?: (textProp | separatorProp)[];
  footer?: string;
  timestamp?: number;
  color?: ColorOptions;
};

export async function SimpleEmbedBuilder(content: embedProperties): Promise<ContainerBuilder> {
  const embed = new ContainerBuilder();

  if (content.author) content.author = `**${content.author}**`;
  if (content.title) content.title = `## ${content.title}`;
  if (content.timestamp)
    content.footer = [content.footer, new Date(content.timestamp).toLocaleString()]
      .filter(Boolean)
      .join(" • ");

  // Order matters here btw, the footer won't be a footer anymore if you put it before the fields in the object
  const headerSection = new SectionBuilder(); // for thumbnails
  if (content.thumb)
    headerSection.setThumbnailAccessory(new ThumbnailBuilder().setURL(content.thumb));

  let buildingHeader: boolean = content.thumb ? true : false;

  for (const prop of Object.keys(content) as Array<keyof embedProperties>) {
    if (!content[prop]) continue;
    if (prop == "color" || prop == "timestamp" || prop == "thumb") continue;

    let container = buildingHeader ? headerSection : embed;

    if (prop == "fields") {
      for (const field of content[prop]) {
        if (isSeparator(field)) {
          const separator = new SeparatorBuilder();
          if (field.divider) separator.setDivider(field.divider);
          if (field.spacing) separator.setSpacing(field.spacing);
          if (buildingHeader) {
            embed.addSectionComponents(headerSection);
            buildingHeader = false;
            container = embed;
          }
          embed.addSeparatorComponents(separator);
        } else {
          if (field.name) field.name = `**${field.name}**`;
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `${[field.name, field.value].filter(s => s).join("\n")}`,
            ),
          );
        }
        // Sections can only have a max of 3 components
        if (buildingHeader && headerSection.components.length >= 3) {
          embed.addSectionComponents(headerSection);
          buildingHeader = false;
          container = embed;
        }
      }
    } else
      container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${content[prop]}`));

    if (buildingHeader && headerSection.components.length >= 3) {
      embed.addSectionComponents(headerSection);
      buildingHeader = false;
    }
  }

  if (buildingHeader) embed.addSectionComponents(headerSection);
  if (content.color) embed.setAccentColor((await colorize({ ...content.color })) as RGBTuple);

  return embed;
}
