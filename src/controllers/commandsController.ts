// External deps
import { createSticker as createStickerFromMedia, StickerTypes } from 'wa-sticker-formatter';

// Internal deps
import { generateMessageID } from '@adiwajshing/baileys';
import {
  getMedia,
  getMessageText,
  hasMediaForSticker,
  isGroup,
  videoToSticker,
  getQuotedMessage,
  getMentions,
  getQuotedAuthor,
} from '../utils/messageUtils';
import { CommandParamsInterface } from '../constants/interfaces';
import { getRoleText } from '../utils/rols';
import { GroupActionEnum } from '../constants/enums';
import { setChatsController } from './chatsController';

export const createSticker = async ({ bot, msg }: CommandParamsInterface) => {
  if (!bot || !msg) return;
  const message = hasMediaForSticker(msg.message) ? msg.message : getQuotedMessage(msg);
  let mediaData: Buffer = await getMedia(message);
  const messageType = Object.keys(message)[0];
  const mimetype = message[messageType]?.mimetype;
  if (mimetype?.includes('video')) {
    mediaData = await videoToSticker({ mimetype, buffer: mediaData });
  }
  const stickerOptions = {
    pack: 'Kingdom Ecchi Bot',
    author: 'Kingdom Ecchi Bot',
    type: StickerTypes.FULL,
    quality: 50,
  };
  const generateSticker = await createStickerFromMedia(mediaData, stickerOptions);
  bot.sendMessage(msg.key.remoteJid, { sticker: generateSticker }, { });
};

export const sendStatus = ({ bot, msg }: CommandParamsInterface) => {
  bot.sendMessage(msg.key.remoteJid, { text: 'Online' }, { quoted: msg });
};

export const sendCoins = ({ bot, msg, user }: CommandParamsInterface) => {
  bot.sendMessage(msg.key.remoteJid, { text: `Tienes ${user.getCoins()} coins` }, { quoted: msg });
};

export const createPoll = async ({ bot, msg }: CommandParamsInterface) => {
  const msgText = getMessageText(msg);
  const [pollTitle, ...rest] = msgText
    .split(' ')
    .slice(1)
    .join(' ')
    .split(',');
  const pollOptions = rest
    .map((option) => option.trim())
    .map((optionName) => ({ optionName }));
  const pollCreationMessage = {
    name: pollTitle,
    options: pollOptions,
    encKey: new Uint8Array(32),
    selectableOptionsCount: 1,
  };
  await bot.relayMessage(
    msg.key.remoteJid,
    { pollCreationMessage },
    {
      messageId: generateMessageID(),
    },
  );
};

export const getRole = async ({ bot, msg, user }: CommandParamsInterface) => {
  const chatId = msg.key.remoteJid;
  if (!isGroup(chatId)) {
    const role = getRoleText(user.role.globalRole);
    await bot.sendMessage(chatId, { text: `Tu rol es: ${role}` }, { quoted: msg });
  } else {
    const role = getRoleText(user.role[chatId]);
    await bot.sendMessage(chatId, { text: `Tu rol es ${role}` }, { quoted: msg });
  }
};

export const groupInfo = async ({ bot, msg }: CommandParamsInterface) => {
  const group = bot.getGroup(msg.key.remoteJid);
  const groupInfoText = `Participantes: ${group.participants.length}`;
  bot.sendMessage(msg.key.remoteJid, { text: groupInfoText }, { quoted: msg });
};

export const activeWelcome = ({ bot, msg }: CommandParamsInterface) => {
  const groupId = msg.key.remoteJid;
  const group = bot.getGroup(groupId);
  group.addGroupAction(GroupActionEnum.WELCOME);
  bot.sendMessage(groupId, { text: 'Bienvenidas activadas' }, { quoted: msg });
};

export const activeAntiLinks = ({ bot, msg }: CommandParamsInterface) => {
  const [, ...rest] = getMessageText(msg).split(' ');
  const option = rest[0].toLowerCase();
  const groupId = msg.key.remoteJid;
  const group = bot.getGroup(groupId);

  if (option === 'on') {
    group.addGroupAction(GroupActionEnum.ANTI_LINKS);
    bot.sendMessage(groupId, { text: 'Antilinks activado' }, { quoted: msg });
  }
  if (option === 'off') {
    group.removeGroupAction(GroupActionEnum.ANTI_LINKS);
    bot.sendMessage(groupId, { text: 'Antilinks desactivado' }, { quoted: msg });
  }
};

export const sendMenu = async ({ bot, msg, user }: CommandParamsInterface) => {
  const menuMessage = user.getMenu(msg.key.remoteJid);
  bot.sendMessage(msg.key.remoteJid, menuMessage, { quoted: msg });
};

export const handleChange = async ({ bot, msg }: CommandParamsInterface) => {
  const msgText = getMessageText(msg);
  const [, ...rest] = msgText.split(' ');
  const typeChange = rest[0];

  switch (typeChange) {
  case 'coins': {
    const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
    const users = mentions.map((mentionJid) => bot.getUser(mentionJid));
    const changeCoinsOption = rest[1];
    const coins = parseInt(rest[2], 10);

    switch (changeCoinsOption) {
    case 'add':
      users.forEach((userChange) => userChange.addCoins(coins));
      break;
    case 'remove':
      users.forEach((userChange) => userChange.subtractCoins(coins));
      break;
    case 'set':
      users.forEach((userChange) => userChange.setCoins(coins));
      break;
    default:
      return;
    }

    if (mentions.length === 1) {
      await bot.sendMessage(msg.key.remoteJid, { text: `Ahora @${mentions[0].split('@')[0]} tiene ${users[0].getCoins()} coins`, mentions: [mentions[0]] }, { quoted: msg });
    } else {
      await bot.sendMessage(msg.key.remoteJid, { text: 'Cambios realizados' }, { quoted: msg });
    }
    break;
  }
  case 'group': {
    const changeGroupOption = rest[1];
    switch (changeGroupOption) {
    case 'add':
      await setChatsController(
        bot,
        [{ id: msg.key.remoteJid }],
        true,
      );
      bot.sendMessage(msg.key.remoteJid, { text: 'Grupo agregado, ahora el bot se puede utilizar en este grupo' }, { quoted: msg });
      break;
    case 'remove': {
      const newGroups = bot.getGroups();
      newGroups.forEach((group, index) => {
        if (group.id === msg.key.remoteJid) {
          newGroups[index].setActive(false);
        }
      });
      bot.setGroups(newGroups);
      bot.sendMessage(msg.key.remoteJid, { text: 'Grupo eliminado, ahora el bot no se puede utilizar en este grupo' }, { quoted: msg });
      break;
    }
    default:
      break;
    }
    break;
  }
  default:
    break;
  }
};

export const banUsers = async ({ bot, msg }: CommandParamsInterface) => {
  const [, ...rest] = getMessageText(msg).split(' ');
  const banMessage = rest.filter((word) => !word.startsWith('@')).join(' ')?.trim();
  const mentions = getMentions(msg);
  const authorQuotedMsg = getQuotedAuthor(msg);
  const usersToBanIds = authorQuotedMsg ? [...mentions, authorQuotedMsg] : mentions;
  await bot.groupParticipantsUpdate('remove', msg.key.remoteJid, usersToBanIds, banMessage);
  await Promise.all(
    usersToBanIds.map((userId) => bot.sendMessage(userId, { text: banMessage }, {})),
  );
};

export const unbanUser = ({ bot, msg }: CommandParamsInterface) => {
  const authorQuotedMsg = getQuotedAuthor(msg);
  bot.groupParticipantsUpdate('add', msg.key.remoteJid, [authorQuotedMsg]);
};
