import { GroupActionEnum } from '../constants/enums';
import { CommandParamsInterface } from '../constants/interfaces';
import {
  getMentions,
  getMessage,
  getMessageText, getQuotedMessage, hasMediaForCustomCommand, hasMediaForSticker, isGroup,
} from '../utils/messageUtils';

export const withoutValidation = () => true;

export const createStickerValidation = ({ bot, msg }: CommandParamsInterface): boolean => {
  const auxMsg = getMessage(msg.message);
  const quotedMessage = getQuotedMessage(auxMsg);
  if (hasMediaForSticker(auxMsg) || hasMediaForSticker(quotedMessage)) return true;
  bot.getSock().sendMessage(msg?.key.remoteJid, { text: 'Debes indicar alguna imagen, gif o video' }, { quoted: msg });
  return false;
};

export const createPollValidation = ({ bot, msg }: CommandParamsInterface): boolean => {
  const msgText = getMessageText(msg.message);
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

export const antilinksValidation = ({ bot, msg }: CommandParamsInterface): boolean => {
  if (!isGroup(msg.key.remoteJid)) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Este comando solo funciona en grupos' }, { quoted: msg });
    return false;
  }

  const [, ...rest] = getMessageText(msg.message).split(' ');
  const hasOption = !rest.length || !rest[0];
  const optionsAvailable = ['on', 'off'];
  const option = hasOption ? rest[0].toLowerCase() : '';
  const isValidOption = optionsAvailable.includes(option);
  const group = bot.getGroup(msg.key.remoteJid);
  const groupHasAntilinksAction = group
    && group.getGroupActions().includes(GroupActionEnum.ANTI_LINKS);
  const alreadyAntilinksActive = option === 'on' && groupHasAntilinksAction;
  const alreadyAntilinksInactive = option === 'off' && !groupHasAntilinksAction;

  if (!hasOption) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Debes indicar una opción. Opciones disponibles: \'on\' y \'off\'.' }, { quoted: msg });
    return false;
  }
  if (!isValidOption) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Debes indicar una opción válida.' }, { quoted: msg });
    return false;
  }
  if (alreadyAntilinksActive) {
    bot.sendMessage(msg.key.remoteJid, { text: 'La acción de antilinks ya está activada.' }, { quoted: msg });
    return false;
  }
  if (alreadyAntilinksInactive) {
    bot.sendMessage(msg.key.remoteJid, { text: 'La acción de antilinks ya está desactivada.' }, { quoted: msg });
    return false;
  }

  return true;
};

export const handleChangeValidation = ({ bot, msg }: CommandParamsInterface) => {
  const msgText = getMessageText(msg.message);
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
    case 'add': {
      const group = bot.getGroup(msg.key.remoteJid);
      if (group && group.isActive()) {
        bot.sendMessage(msg.key.remoteJid, { text: 'El grupo ya está agregado' }, { quoted: msg });
        return false;
      }
      break;
    }
    case 'remove': {
      const group = bot.getGroup(msg.key.remoteJid);
      if (!group || !group.isActive()) {
        bot.sendMessage(msg.key.remoteJid, { text: 'El grupo debe estar agregado para poder realizar esta acción' }, { quoted: msg });
        return false;
      }
      break;
    }
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

export const banUsersValidation = ({ bot, msg }: CommandParamsInterface) => {
  const hasMentions = !!getMentions(msg).length;
  const hasQuotedAuthor = !!msg.message.extendedTextMessage?.contextInfo?.participant;

  if (!isGroup(msg.key.remoteJid)) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Este comando solo se puede usar en grupos' }, { quoted: msg });
    return false;
  }
  if (!hasMentions && !hasQuotedAuthor) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Debes mencionar a los usuarios a banear, o responder el mensaje del usuario que quieres banear.' }, { quoted: msg });
    return false;
  }
  return true;
};

export const unbanUserValidation = ({ bot, msg }: CommandParamsInterface) => {
  if (!isGroup(msg.key.remoteJid)) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Este comando solo se puede usar en grupos' }, { quoted: msg });
    return false;
  }
  if (!getQuotedMessage(msg.message)) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Debes responder el mensaje del usuario que quieres desbanear.' }, { quoted: msg });
    return false;
  }

  const userIsParticipantOfGroup = bot
    .getGroup(msg.key.remoteJid)
    ?.getParticipants()
    .includes(msg.message.extendedTextMessage?.contextInfo?.participant);
  if (userIsParticipantOfGroup) {
    bot.sendMessage(msg.key.remoteJid, { text: 'El usuario ya está en el grupo.' }, { quoted: msg });
    return false;
  }

  return true;
};

export const createFakeImgValidation = ({ bot, msg }: CommandParamsInterface) => {
  const message = getMessage(msg.message);
  const quotedMessage = getQuotedMessage(msg.message);
  if (!message?.imageMessage) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Debes adjuntar la imagen que quieres poner como vista previa' }, { quoted: msg });
    return false;
  }
  if (!quotedMessage?.imageMessage) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Debes responder a la imagen que quieres poner como original' }, { quoted: msg });
    return false;
  }
  return true;
};

export const sendCoinsValidation = ({ bot, user, msg }: CommandParamsInterface) => {
  const [, coins] = getMessageText(msg.message).split(' ');
  const hasOnlyOneMention = getMentions(msg).length === 1;
  const hasSufficientCoins = user.getCoins() >= Number(coins);
  const messageIndicatesCoins = coins && !Number.isNaN(Number(coins));
  if (!messageIndicatesCoins) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Debes indicar la cantidad de coins que quieres enviar.' }, { quoted: msg });
    return false;
  }
  if (!hasOnlyOneMention) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Debes mencionar a un usuario.' }, { quoted: msg });
    return false;
  }
  if (!hasSufficientCoins) {
    bot.sendMessage(msg.key.remoteJid, { text: 'No puedes transferir más coins que las que tienes.' }, { quoted: msg });
    return false;
  }
  if (Number(coins) <= 0) {
    bot.sendMessage(msg.key.remoteJid, { text: 'No puedes transferir una cantidad negativa o nula de coins.' }, { quoted: msg });
    return false;
  }
  if (messageIndicatesCoins && !Number.isInteger(Number(coins))) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Prefiero que indiques números enteros.' }, { quoted: msg });
    return false;
  }
  return true;
};

export const createCustomCommandValidation = ({ bot, msg }: CommandParamsInterface) => {
  const [, customCommandName, ...rest] = getMessageText(msg.message).split(' ');
  const isValidCommandName = /^[A-Za-z0-9\s]+$/g.test(customCommandName);
  const quotedMessage = getQuotedMessage(msg.message);
  const hasMedia = hasMediaForCustomCommand(msg.message)
    || (quotedMessage && hasMediaForCustomCommand(quotedMessage));
  const hasDescription = rest?.length > 0;
  if (!customCommandName) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Debes indicar el nombre del comando.' }, { quoted: msg });
    return false;
  }
  if (!hasDescription) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Debes indicar la descripción del comando.' }, { quoted: msg });
    return false;
  }
  if (!isValidCommandName) {
    bot.sendMessage(msg.key.remoteJid, { text: 'El nombre del comando solo puede contener letras, números y espacios.' }, { quoted: msg });
    return false;
  }
  if (!hasMedia) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Debes indicar algún elemento multimedia.' }, { quoted: msg });
    return false;
  }

  return true;
};
