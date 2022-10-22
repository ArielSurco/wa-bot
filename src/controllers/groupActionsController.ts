import Bot from '../models/Bot';
import Group from '../models/Group';
import { CommandParamsInterface, ParticipantsUpdate } from '../constants/interfaces';
import { getMessageText, isLink } from '../utils/messageUtils';

interface ParticipantsUpdateParams {
  bot: Bot,
  group: Group,
  userId: string,
  updateNotification: ParticipantsUpdate,
}

// Update group actions
export const welcomeAction = async ({
  bot, group, userId, updateNotification,
}: ParticipantsUpdateParams) => {
  if (updateNotification.action === 'add') {
    const number = userId.split('@')[0];
    const welcomeText = `*Hola @${number}!*\nBienvenido a _*${group.name}*_!!!\n\nLee las reglas\n\n${group.description}`;
    try {
      const profilePic = await bot.getSock().profilePictureUrl(userId, 'image', 5000);
      bot.sendMessage(
        group.id,
        { caption: welcomeText, image: { url: profilePic }, mentions: [userId] },
        {},
      );
    } catch (_) {
      bot.sendMessage(group.id, { text: welcomeText, mentions: [userId] });
    }
  }
};

// Message group actions
export const antiLinkAction = async ({ bot, user, msg }: CommandParamsInterface) => {
  try {
    const msgText = getMessageText(msg.message);
    if (isLink(msgText)) {
      const sock = bot.getSock();
      await sock.sendMessage(msg.key.remoteJid, { text: 'Está prohibido mandar links, serás baneado' });
      await sock.sendMessage(msg.key.remoteJid, { delete: msg.key });
      await sock.groupParticipantsUpdate(msg.key.remoteJid, [user.id], 'remove');
    }
  } catch (err) {
    throw new Error(err.message);
  }
};
