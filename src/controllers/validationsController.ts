import { CommandParamsInterface } from '../constants/interfaces';
import {
  getMessageText, getQuotedMessage, hasMediaForSticker, isGroup,
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

export const handleChangeValidation = ({ bot, msg }: CommandParamsInterface) => {
  const msgText = getMessageText(msg);
  const [, ...rest] = msgText.split(' ');
  const typeChange = rest[0];
  const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;

  switch (typeChange) {
  case 'coins': {
    const hasOptions = !parseInt(rest[1], 10);
    const coins = parseInt(rest[2], 10);

    if (!hasOptions) {
      bot.sendMessage(msg.key.remoteJid, { text: 'Debes indicar la forma de modificar las coins' }, { quoted: msg });
      return false;
    }

    if (!mentions || !mentions.length) {
      bot.sendMessage(msg.key.remoteJid, { text: 'Debes indicar a quién asignarle coins' }, { quoted: msg });
      return false;
    }

    if (!coins) {
      bot.sendMessage(msg.key.remoteJid, { text: 'Debes indicar la cantidad de coins' }, { quoted: msg });
      return false;
    }

    switch (rest[1]) {
    case 'add':
    case 'remove':
    case 'set':
      return true;
    default:
      bot.sendMessage(msg.key.remoteJid, { text: `${rest[1]} no es una opción válida. Las opciones son 'add', 'remove' o 'set'` }, { quoted: msg });
      return false;
    }
  }
  case 'group': {
    const changeGroupOption = rest[1];

    if (!changeGroupOption) {
      bot.sendMessage(msg.key.remoteJid, { text: 'Debes indicar la forma de modificar el grupo' }, { quoted: msg });
      return false;
    }

    if (!isGroup(msg.key.remoteJid)) {
      bot.sendMessage(msg.key.remoteJid, { text: 'Este comando solo se puede usar en grupos' }, { quoted: msg });
      return false;
    }
    switch (changeGroupOption) {
    case 'add':
      if (bot.getGroup(msg.key.remoteJid)) {
        bot.sendMessage(msg.key.remoteJid, { text: 'El grupo ya está agregado' }, { quoted: msg });
        return false;
      }
      break;
    case 'remove':
      if (!bot.getGroup(msg.key.remoteJid)) {
        bot.sendMessage(msg.key.remoteJid, { text: 'El grupo debe estar agregado para poder realizar esta acción' }, { quoted: msg });
        return false;
      }
      break;
    default:
      bot.sendMessage(msg.key.remoteJid, { text: `${changeGroupOption} no es una opción válida. Las opciones son 'add'` }, { quoted: msg });
      return false;
    }
    break;
  }
  default:
    bot.sendMessage(msg.key.remoteJid, { text: 'No se reconoce el atributo a cambiar' }, { quoted: msg });
    return false;
  }
  return true;
};
