const { Client, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require("discord.js");
const db = require("croxydb");
const config = require("../config.json");

module.exports = {
    name: "ticket-sistemi",
    description: "Ticket sistemi!",
    type: 1,
    options: [
        {
            name: "ticket-log",
            description: "Ticket loglarının düşeceği kanal!",
            type: 7,
            required: true,
        },
        {
            name: "ticket-kanal",
            description: "Ticket Metin kanalı!",
            type: 7,
            required: true,
        },
        {
            name: "ticket-kategori",
            description: "Ticketların oluşturulacağı kategori!",
            type: 7,
            required: true,
            channel_types: [ChannelType.GuildCategory]
        },
        {
            name: "ticket-rol",
            description: "Ticketlarla ilgilenecek yetkili rol!",
            type: 8,
            required: true,
        }
    ],
    run: async (client, interaction) => {
        const ticketLogKanal = interaction.options.getChannel('ticket-log');
        const ticketKanal = interaction.options.getChannel('ticket-kanal');
        const ticketKategori = interaction.options.getChannel('ticket-kategori');
        const ticketYetkiliRol = interaction.options.getRole('ticket-rol');

        db.set(`ticketLogKanal_${interaction.guild.id}`, ticketLogKanal.id);
        db.set(`ticketKategori_${interaction.guild.id}`, ticketKategori.id);
        db.set(`ticketYetkiliRol_${interaction.guild.id}`, ticketYetkiliRol.id);

        const info = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`**${config["bot-adi"]} Ticket Sistemi**`)
            .setDescription("Ticket Oluşturarak iletişime geçebilirsiniz.")
            .addFields(
                { name: "❗️❗️❗️Dikkat", value: `*▪ Ticketlarınızı açarken sebepsiz yere açmayınız.*\n*▪ Herhangi Bir Durumda İletişim:* <@&${ticketYetkiliRol.id}>` }
            )
            .setFooter({ text: "Dikkat: Ticketlarda yetkililere saygılı olalım." })
            .setImage(`${config.foto}`);

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setEmoji('🎟')
                    .setLabel("Botlarla ilgili")
                    .setStyle(ButtonStyle.Success)
                    .setCustomId("ticket_olustur"),
                new ButtonBuilder()
                    .setEmoji('🎫')
                    .setLabel("Diğer")
                    .setStyle(ButtonStyle.Secondary)
                    .setCustomId("diger_ticket")
            );

        await ticketKanal.send({ embeds: [info], components: [buttons] });
        return interaction.reply({ content: 'Ticket sistemi başarıyla kuruldu.', ephemeral: true });
    }
};

client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        const guild = interaction.guild;
        const member = interaction.member;
        const kanal = interaction.channel;
        const ticketYetkiliRol = db.get(`ticketYetkiliRol_${guild.id}`);

        if (!ticketYetkiliRol) {
            return interaction.reply({ content: 'Ticket kategorisi veya yetkili rolü ayarlanmamış.', ephemeral: true });
        }

        if (interaction.customId === 'ticket_olustur' || interaction.customId === 'diger_ticket') {
            const ticketKategori = db.get(`ticketKategori_${guild.id}`);
            if (!ticketKategori) {
                return interaction.reply({ content: 'Ticket kategorisi ayarlanmamış.', ephemeral: true });
            }

            const kanalAdi = interaction.customId === 'ticket_olustur' ? `ticket-${member.user.username}` : `diger-${member.user.username}`;
            const ticketChannel = await guild.channels.create({
                name: kanalAdi,
                type: ChannelType.GuildText, 
                parent: ticketKategori,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: member.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    },
                    {
                        id: ticketYetkiliRol,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor("Yellow")
                .setTitle("Satın Alım Talebi")
                .setDescription("Satın Alım başvurunuz incelenmek üzere alınmıştır. Lütfen gerekli bilgileri sağlayın.")
                .addFields(
                    { name: "ㅤㅤ", value: "```ansi\n\n👋〢[2;37mMerhaba yetkililerimiz sizinle en kısa sürede ilgilenecektir sabırla beklemenizi rica ediyoruz. [0m\n\n😒〢[2;31mEğer yetkilileri 2'den fazla etiketlerseniz bu ticket kapatılacaktır!![0m\n\n[2;40m```"}
                )
                .setFooter({ text: `${config["bot-adi"]}` });
    
            const etiketleme = `<@${member.id}> | <@&${ticketYetkiliRol}>`;

            const ticket = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel("🟢 Satın Alındı")
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId("satin_alindi"),
                    new ButtonBuilder()
                        .setLabel("Ticket'ı Kapat")
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId("ticket_close")
                );

            await ticketChannel.send({ content: etiketleme, embeds: [embed], components: [ticket] });
            return interaction.reply({ content: 'Ticket kanalınız oluşturuldu. Lütfen gerekli bilgileri sağlayın.', ephemeral: true });
        } else if (interaction.customId === 'satin_alindi') {

            const satinAlindiRol = config["satin_alindi_rol"];
            if (!satinAlindiRol) {
                return interaction.reply({ content: 'Satın alındı rolü yapılandırılmamış.', ephemeral: true });
            }

            const role = guild.roles.cache.get(satinAlindiRol);
            if (!role) {
                return interaction.reply({ content: 'Satın alındı rolü bulunamadı.', ephemeral: true });
            }

            await member.roles.add(role);

            
            const embed = new EmbedBuilder()
                .setColor("Blue")
                .setTitle("Ticket Durumu")
                .setDescription("Lütfen uygun rolü seçin:")
                .setFooter({ text: `${config["bot-adi"]}` });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel("1")
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("role_1"),
                    new ButtonBuilder()
                        .setLabel("2")
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("role_2"),
                    new ButtonBuilder()
                        .setLabel("3")
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("role_3")
                );

            await interaction.reply({ embeds: [embed], components: [buttons] , ephemeral: true});
        } else if (interaction.customId.startsWith("role_")) {
            const roleId = config[interaction.customId];
            if (!roleId) {
                return interaction.reply({ content: 'Geçersiz rol yapılandırması.', ephemeral: true });
            }

            const role = guild.roles.cache.get(roleId);
            if (!role) {
                return interaction.reply({ content: 'Rol bulunamadı.', ephemeral: true });
            }

            await member.roles.add(role);
            return interaction.reply({ content: `Başarıyla ${role.name} rolü verildi.`, ephemeral: true });
        } else if (interaction.customId === 'ticket_close') {
            await kanal.delete();
        }
    }
});