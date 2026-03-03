import { APIEmbedField, ContainerBuilder, EmbedBuilder, RGBTuple, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { colorize, Sokolors } from "utils/colorGen";

type textProp = {
    name: string,
    value: string
}

type separatorProp = {
    divider?: boolean,
    spacing?: number,
}

const isSeparator = (f: any): f is separatorProp => !f["name"]

type embedProperties = {
    author?: string,
    title?: string,
    desc?: string,
    fields?: (textProp | separatorProp)[],
    footer?: string,
    timestamp?: number,
    color?: Sokolors,
}

class SimpleEmbedBuilder {
    static async from(content: embedProperties, cv2?: boolean): Promise<EmbedBuilder | ContainerBuilder> {
        const embed = cv2 ? new ContainerBuilder() : new EmbedBuilder();

        if (cv2) {
            if (!(embed instanceof ContainerBuilder)) return embed
            if (content.author) content.author = `**${content.author}**`
            if (content.title) content.title = `### ${content.title}`
            if (content.timestamp)
                content.footer = [content.footer, new Date(content.timestamp).toLocaleString()].filter(s => s).join(" • ")
            if (content.footer) content.footer = `-# ${content.footer}`

            // Order matters here btw, the footer won't be a footer anymore if you put it before the fields in the object
            for (const prop of Object.keys(content) as Array<keyof embedProperties>) {
                if (!content[prop]) continue;
                if (prop == "color" || prop == "timestamp") continue;
                if (prop == "fields") {
                    for (const field of content[prop]) {
                        if (isSeparator(field)) {
                            const separator = new SeparatorBuilder()
                            if (field.divider) separator.setDivider(field.divider)
                            if (field.spacing) separator.setSpacing(field.spacing)
                            embed.addSeparatorComponents(separator)
                        } else {
                            embed.addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`${[field.name, field.value].filter(s => s).join("\n")}`)
                            )
                        }
                    }
                } else {
                    embed.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${content[prop]}`)
                    )
                }
            }

            if (content.color) embed.setAccentColor((await colorize({ hue: content.color, cv2: true })) as RGBTuple);

        } else {
            if (!(embed instanceof EmbedBuilder)) return embed;
            if (content.author) embed.setAuthor({name: content.author})
            if (content.title) embed.setTitle(content.title)
            if (content.desc) embed.setDescription(content.desc)

            if (content.fields) {
                content.fields = content.fields.map(field => isSeparator(field)
                    ? {name: "", value: `${"\n".repeat((field.spacing || 1)-1)}`}
                    : field
                ).filter(f => f.name || f.value);
                embed.addFields(content.fields as APIEmbedField[])
            }

            if (content.footer) embed.setFooter({text: content.footer})
            if (content.timestamp) embed.setTimestamp(content.timestamp)
            if (content.color) embed.setColor(await colorize({hue: content.color}))
        }

        return embed
    }
}

export default SimpleEmbedBuilder;