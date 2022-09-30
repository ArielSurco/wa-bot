import { CommandParamsInterface } from '../constants/interfaces';
import {
  getMessageText, getQuotedMessage, hasMediaForSticker,
} from '../utils/messageUtils';

export const withoutValidation = () => true;

export const createStickerValidation = ({ bot, msg }: CommandParamsInterface): boolean => {
  const quotedMessage = getQuotedMessage(msg);
  if (hasMediaForSticker(msg.message) || hasMediaForSticker(quotedMessage)) return true;
  bot?.getSock().sendMessage(msg?.key.remoteJid, { text: 'Debes indicar alguna imagen, gif o video' }, { quoted: msg });
  return false;
};

export const createPollValidation = ({ bot, msg }: CommandParamsInterface): boolean => {
  const msgText = getMessageText(msg);
  const [pollTitle, ...rest] = msgText
    .split(' ')
    .slice(1)
    .join(' ')
    .split(',');
  const pollOptions = rest
    .map((option) => option.trim())
    .map((optionName) => ({ optionName }));

  if (!pollTitle) {
    bot.sendMessage(msg.key.remoteJid, { text: 'La encuesta debe tener un título' }, { quoted: msg });
    return false;
  }
  if (pollOptions.length < 2) {
    bot.sendMessage(msg.key.remoteJid, { text: 'La encuesta debe tener 2 o más opciones' }, { quoted: msg });
    return false;
  }
  return true;
};
