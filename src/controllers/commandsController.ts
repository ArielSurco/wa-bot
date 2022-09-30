// External deps
import { createSticker as createStickerFromMedia, StickerTypes } from 'wa-sticker-formatter';

// Internal deps
import { generateMessageID } from '@adiwajshing/baileys';
import {
  getMedia, getMessageText, isGroup, videoToSticker,
} from '../utils/messageUtils';
import { CommandParamsInterface } from '../constants/interfaces';
import { getRoleText } from '../utils/rols';

export const createSticker = async ({ bot, msg }: CommandParamsInterface) => {
  if (!bot || !msg) return;
  let mediaData: Buffer = await getMedia(msg);
  const messageType = Object.keys(msg.message)[0];
  const mimetype = msg.message[messageType]?.mimetype;
  if (mimetype?.includes('video')) {
    mediaData = await videoToSticker({ mimetype, buffer: mediaData });
  }
  const stickerOptions = {
    pack: 'Kingdom Ecchi Bot',
    author: 'Kingdom Ecchi Bot',
    type: StickerTypes.DEFAULT,
    quality: 50,
  };
  const generateSticker = await createStickerFromMedia(mediaData, stickerOptions);
  bot.sendMessage(msg.key.remoteJid, { sticker: generateSticker }, { quoted: msg });
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
