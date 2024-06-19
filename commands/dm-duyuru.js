const { Client, EmbedBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const db = require("croxydb");

module.exports = {
    name: "dm-duyuru",
    description: "Sunucudaki tüm üyelere DM ile duyuru gönderir.",
    type: 1,
    run: async(client, interaction) => {
        // Duyuru yapma yetkisi kontrolü
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: "❌ | Duyuru yapma yetkiniz yok!", ephemeral: true });
        }

        // Duyuru için modal oluşturma
        const modal = new ModalBuilder()
            .setCustomId('dmDuyuruModal')
            .setTitle('DM Duyuru');

        const duyuruInput = new TextInputBuilder()
            .setCustomId('duyuruMesaji')
            .setLabel("Duyuru mesajını yazın")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(duyuruInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);

        const filter = (modalInteraction) => modalInteraction.customId === 'dmDuyuruModal' && modalInteraction.user.id === interaction.user.id;
        interaction.awaitModalSubmit({ filter, time: 60000 })
            .then(async modalInteraction => {
                const duyuruMesaji = modalInteraction.fields.getTextInputValue('duyuruMesaji');
                await modalInteraction.reply({ content: "✅ | Duyuru gönderimi başlatıldı!", ephemeral: true });

                const members = interaction.guild.members.cache.filter(member => !member.user.bot);

                // Duyuru mesajı için embed oluşturma
                const dmEmbed = new EmbedBuilder()
                    .setColor("Random")
                    .setTitle("📢 Duyuru 📢")
                    .setDescription(duyuruMesaji);

                // Üyelere belirli aralıklarla mesaj gönderme
                const membersArray = Array.from(members.values());
                const chunkSize = 10;
                for (let i = 0; i < membersArray.length; i += chunkSize) {
                    const chunk = membersArray.slice(i, i + chunkSize);
                    for (const member of chunk) {
                        try {
                            await member.send({ embeds: [dmEmbed] });
                        } catch (err) {
                            console.error(`Mesaj gönderilemedi: ${member.user.tag}`, err);
                        }
                    }
                    if (i + chunkSize < membersArray.length) {
                        await new Promise(resolve => setTimeout(resolve, 15000)); // 15 saniye bekle
                    }
                }

                // Modlog kanalına duyuru yapıldığını bildirme
                try {
                    const modLogChannelId = db.get(`modlogK_${interaction.guild.id}`);
                    if (modLogChannelId) {
                        const modLogChannel = client.channels.cache.get(modLogChannelId);
                        if (modLogChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setTitle('DM Duyuru Yapıldı')
                                .setDescription(`Duyuru mesajı: ${duyuruMesaji}`)
                                .addFields(
                                    { name: 'Duyuruyu Yapan', value: `${interaction.user}`, inline: true }
                                )
                                .setTimestamp();

                            modLogChannel.send({ embeds: [logEmbed] });
                        } else {
                            console.error(`Modlog kanalı bulunamadı: ${modLogChannelId}`);
                        }
                    } else {
                        console.error(`Modlog kanalı veritabanında bulunamadı: ${interaction.guild.id}`);
                    }
                } catch (error) {
                    console.error('Mod Kanalı Bulunamadı', error);
                }
            })
            .catch(err => {
                console.error('Modal gönderimi zaman aşımına uğradı veya başarısız oldu:', err);
            });
    }
};