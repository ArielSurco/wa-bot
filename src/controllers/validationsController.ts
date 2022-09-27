import { CommandParamsInterface } from '../constants/interfaces';
import { getQuotedMessage, hasMediaForSticker } from '../utils/messageUtils';

export const createStickerValidation = ({ bot, msg }: CommandParamsInterface): boolean => {
  const quotedMessage = getQuotedMessage(msg);
  if (hasMediaForSticker(msg.message) || hasMediaForSticker(quotedMessage)) return true;
  bot?.getSock().sendMessage(msg?.key.remoteJid, { text: 'Debes indicar alguna imagen, gif o video' }, { quoted: msg });
  return false;
};

export default createStickerValidation;
