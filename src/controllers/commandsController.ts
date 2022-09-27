// External deps
import { createSticker as createStickerFromMedia, StickerTypes } from 'wa-sticker-formatter';

// Internal deps
import { getMedia, videoToSticker } from '../utils/messageUtils';
import { CommandParamsInterface } from '../constants/interfaces';

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

export const sendStatus = ({ bot, msg }) => {
  bot.sendMessage(msg.key.remoteJid, { text: 'Online' }, { quoted: msg });
};

export const sendCoins = ({ bot, msg, user }) => {
  bot.sendMessage(msg.key.remoteJid, { text: `Tienes ${user.getCoins()} coins` }, { quoted: msg });
};
