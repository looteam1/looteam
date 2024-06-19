const { Client, EmbedBuilder } = require("discord.js");
const config = require("../config.json");
module.exports = {
    name: "ticket-bilgilendirme",
    description: "Ticket sisteminin nasıl kullanılacağını açıklar!",
    type: 1,
    run: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("**Ticket Sistemi Bilgilendirme**")
            .setDescription("Ticket sistemiyle nasıl iletişim kuracağınızı öğrenin.")
            .addFields(
                { name: "❗️❗️❗️Dikkat", value: `*▪ Ticketlarınızı açarken sebepsiz yere açmayınız.*\n*▪ Herhangi Bir Durumda İletişim:* <@&${interaction.guild.roles.cache.find(role => role.name === `${config.yetkiliroladi}`).id}>` },
                { name: "Ticket Nasıl Açılır?", value: `1. <#${interaction.guild.channels.cache.find(channel => channel.name === `${config.destekkanali}`).id}> kanalındaki ticket oluşturma butonuna tıklayın.\n2. Açılan kanalda talebinizi detaylı bir şekilde yazın.\n3. Yetkili ekibimiz en kısa sürede sizinle iletişime geçecektir.` },
                { name: "Ticket Kuralları", value: `*▪ Gereksiz yere ticket açmayınız.\n▪ Yetkililere saygılı olunuz.\n▪ Aynı konuda birden fazla ticket açmayınız.\n▪ Sorununuzu net bir şekilde ifade ediniz.\n▪ Ticket açtıktan sonra sabırlı olun, yetkililer size en kısa sürede yanıt verecektir.\n▪ Ticketlarınızda kişisel bilgilerinizi paylaşmamaya özen gösteriniz.\n▪ Ticketları kapatmadan önce yetkililerden onay alınız.*` }
            )
            .setFooter({ text: "Dikkat: Ticketlarda yetkililere saygılı olalım." })
            .setImage(`${config.foto}`);

        await interaction.reply({ embeds: [embed] });
    }
};
