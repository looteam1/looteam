const { Client, EmbedBuilder, PermissionsBitField } = require("discord.js");
const db = require("croxydb");
const ms = require("ms");

module.exports = {
    name: "çekiliş",
    description: "Bir çekiliş başlatır.",
    type: 1,
    options: [
        {
            name: "ödül",
            description: "Çekilişin ödülü nedir?",
            type: 3,
            required: true
        },
        {
            name: "süre",
            description: "Çekilişin süresi (örneğin: 1m, 1h, 1d)",
            type: 3,
            required: true
        }
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: "❌ | Çekiliş başlatma yetkiniz yok!", ephemeral: true });
        }

        const ödül = interaction.options.getString('ödül');
        const süre = interaction.options.getString('süre');

        const süreMs = ms(süre);
        if (!süreMs) {
            return interaction.reply({ content: "❌ | Geçersiz süre formatı! Lütfen doğru bir süre girin (örneğin: 1m, 1h, 1d).", ephemeral: true });
        }

        const bitişZamanı = Date.now() + süreMs;

        const embed = new EmbedBuilder()
            .setTitle("🎉 Çekiliş Başladı! 🎉")
            .setDescription(`Ödül: **${ ödül }**\nSüre: **<t:${ Math.floor(bitişZamanı / 1000) }:R>**\nKatılmak için 🎉 emojisine tıklayın!`)
            .setColor("Random")
            .setTimestamp();

        const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
        msg.react("🎉");

        setTimeout(async () => {
            const fetchedMsg = await msg.fetch();
            const reactions = fetchedMsg.reactions.cache.get("🎉");

            if (!reactions) {
                return interaction.followUp({ content: "❌ | Yeterli katılımcı yok, çekiliş iptal edildi." });
            }

            const users = await reactions.users.fetch();
            const filteredUsers = users.filter(user => !user.bot);

            if (filteredUsers.size === 0) {
                return interaction.followUp({ content: "❌ | Yeterli katılımcı yok, çekiliş iptal edildi." });
            }

            const winner = filteredUsers.random();
            const winnerEmbed = new EmbedBuilder()
                .setTitle("🎉 Çekiliş Sona Erdi! 🎉")
                .setDescription(`Ödül: **${ ödül }**\nKazanan: ${ winner }\nTebrikler!`)
                .setColor("Random")
                .setTimestamp();

            await interaction.followUp({ embeds: [winnerEmbed] });

            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle("🎉 Tebrikler! 🎉")
                    .setDescription(`Kazandığınız ödül: **${ ödül }**\nSunucu: **${ interaction.guild.name }**`)
                    .setColor("Random")
                    .setTimestamp();

                await winner.send({ embeds: [dmEmbed] });
            } catch (err) {
                console.error('Kazanana özel mesaj gönderilemedi:', err);
            }

            try {
                const modLogChannelId = db.get(`modlogK_${ interaction.guild.id }`);
                if (modLogChannelId) {
                    const modLogChannel = client.channels.cache.get(modLogChannelId);
                    if (modLogChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('Çekiliş Tamamlandı')
                            .addFields(
                                { name: 'Ödül', value: `${ ödül }`, inline: true },
                                { name: 'Kazanan', value: `${ winner }`, inline: true },
                                { name: 'Çekilişi Başlatan', value: `${ interaction.user }`, inline: true },
                            )
                            .setTimestamp();

                        modLogChannel.send({ embeds: [logEmbed] });
                    } else {
                        console.error(`Modlog kanalı bulunamadı: ${ modLogChannelId }`);
                    }
                } else {
                    console.error(`Modlog kanalı veritabanında bulunamadı: ${ interaction.guild.id }`);
                }
            } catch (error) {
                console.error('Mod Kanalı Bulunamadı', error);
            }
        }, süreMs);
    }
};