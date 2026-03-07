import {
  APIEmbedField,
  ContainerBuilder,
  EmbedBuilder,
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

export class SimpleEmbedBuilder {
  static async from(
    content: embedProperties,
    cv2?: boolean,
  ): Promise<EmbedBuilder | ContainerBuilder> {
    const embed = cv2 ? new ContainerBuilder() : new EmbedBuilder();

    if (cv2) {
      if (!(embed instanceof ContainerBuilder)) return embed;
      if (content.author) content.author = `**${content.author}**`;
      if (content.title) content.title = `### ${content.title}`;
      if (content.timestamp)
        content.footer = [content.footer, new Date(content.timestamp).toLocaleString()]
          .filter(s => s)
          .join(" • ");

      // Order matters here btw, the footer won't be a footer anymore if you put it before the fields in the object
      const headerSection = new SectionBuilder(); // for thumbnails
      if (content.thumb)
        headerSection.setThumbnailAccessory(new ThumbnailBuilder().setURL(content.thumb));

      let buildingHeader: boolean = content.thumb != "";

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
          container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${content[prop]}`),
          );

        if (buildingHeader && headerSection.components.length >= 3) {
          embed.addSectionComponents(headerSection);
          buildingHeader = false;
        }
      }

      if (buildingHeader) embed.addSectionComponents(headerSection);
      if (content.color)
        embed.setAccentColor((await colorize({ ...content.color, cv2: true })) as RGBTuple);

      return embed;
    }

    if (!(embed instanceof EmbedBuilder)) return embed;
    if (content.author) embed.setAuthor({ name: content.author });
    if (content.thumb) embed.setThumbnail(content.thumb);
    if (content.title) embed.setTitle(content.title);
    if (content.desc) embed.setDescription(content.desc);

    if (content.fields) {
      content.fields = content.fields
        .map(field =>
          isSeparator(field) ? { name: "", value: `${"\n".repeat(field.spacing || 1)}` } : field,
        )
        .filter(f => f.name || f.value);
      embed.addFields(content.fields as APIEmbedField[]);
    }

    if (content.footer) embed.setFooter({ text: content.footer });
    if (content.timestamp) embed.setTimestamp(content.timestamp);
    if (content.color) embed.setColor(await colorize(content.color));

    return embed;
  }
}

export default SimpleEmbedBuilder;
