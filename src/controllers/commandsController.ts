// External deps
import fs from 'fs';
import { createSticker as createStickerFromMedia, StickerTypes } from 'wa-sticker-formatter';

// Internal deps
import { extractImageThumb, generateMessageID } from '@adiwajshing/baileys';
import {
  getMedia,
  getMessageText,
  hasMediaForSticker,
  isGroup,
  videoToSticker,
  getQuotedMessage,
  getMentions,
  getQuotedAuthor,
  getGroupActionText,
  getMessage,
  hasMediaForCustomCommand,
  getMimeType,
  getMediaMessageBody,
} from '../utils/messageUtils';
import { CommandParamsInterface, CustomCommandMedia } from '../constants/interfaces';
import { getRoleText } from '../utils/rols';
import { GroupActionEnum, RoleEnum } from '../constants/enums';
import { setChatsController } from './chatsController';
import Command from '../models/Command';
import { withoutValidation } from './validationsController';

export const createSticker = async ({ bot, msg }: CommandParamsInterface) => {
  try {
    const auxMsg = getMessage(msg.message);
    const message = hasMediaForSticker(auxMsg) ? auxMsg : getQuotedMessage(auxMsg);
    let mediaData: Buffer = await getMedia(message);
    const messageType = Object.keys(message)[0];
    const mimetype = message[messageType]?.mimetype;
    const groupName = isGroup(msg.key.remoteJid) ? bot.getGroup(msg.key.remoteJid)?.name : '';
    if (mimetype?.includes('video') || mimetype?.includes('gif')) {
      mediaData = await videoToSticker({ mimetype, buffer: mediaData });
    }
    const author = groupName ? `BOT - ${groupName}` : 'BOT';
    const stickerOptions = {
      author,
      type: StickerTypes.FULL,
      quality: 50,
    };
    const generateSticker = await createStickerFromMedia(mediaData, stickerOptions);
    await bot.sendMessage(msg.key.remoteJid, { sticker: generateSticker });
  } catch (err) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Error al crear el sticker, intente nuevamente' }, { quoted: msg });
    bot.handleError(err.message);
  }
};

export const sendStatus = ({ bot, msg }: CommandParamsInterface) => {
  bot.sendMessage(msg.key.remoteJid, { text: 'Online' }, { quoted: msg });
};

export const getCoins = ({ bot, msg, user }: CommandParamsInterface) => {
  bot.sendMessage(msg.key.remoteJid, { text: `Tienes ${user.getCoins()} coins` }, { quoted: msg });
};

export const createPoll = async ({ bot, msg }: CommandParamsInterface) => {
  const msgText = getMessageText(msg.message);
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

export const getInfo = async ({ bot, msg }: CommandParamsInterface) => {
  const [, infoType] = getMessageText(msg.message).split(' ');

  switch (infoType) {
  case 'participant': {
    const mentions = getMentions(msg);
    const participants = mentions.map((mention) => bot.getUser(mention));
    const participantsInfo = participants.map((participant) => {
      const {
        id, coins, role, active,
      } = participant;
      const infoText = `User ID: ${id}\nActive: ${active}\nRole: ${getRoleText(role[msg.key.remoteJid])}\nCoins: ${coins}`;
      return infoText;
    });
    await Promise.all(
      participantsInfo
        .map((info) => bot.sendMessage(msg.key.remoteJid, { text: info }, { quoted: msg })),
    );
    return;
  }
  case 'group': {
    const group = bot.getGroup(msg.key.remoteJid);
    const groupParticipants = group.getParticipants();
    const groupActionsText = group.getGroupActions().map((groupAction) => getGroupActionText(groupAction)).join(', ');
    const groupInfo = `Group ID: ${group.id}\nActive: ${group.active}\nPrivate: ${group.private}\nParticipants: ${groupParticipants.length}\nGroup Actions: ${groupActionsText}`;
    bot.sendMessage(msg.key.remoteJid, { text: groupInfo }, { quoted: msg });
    break;
  }
  default:
    break;
  }
};

export const activeWelcome = ({ bot, msg }: CommandParamsInterface) => {
  const groupId = msg.key.remoteJid;
  const group = bot.getGroup(groupId);
  group.addGroupAction(GroupActionEnum.WELCOME);
  bot.sendMessage(groupId, { text: 'Bienvenidas activadas' }, { quoted: msg });
};

export const activeAntiLinks = ({ bot, msg }: CommandParamsInterface) => {
  const [, ...rest] = getMessageText(msg.message).split(' ');
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
  const msgText = getMessageText(msg.message);
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
  const [, ...rest] = getMessageText(msg.message).split(' ');
  const banMessage = rest.filter((word) => !word.startsWith('@')).join(' ')?.trim();
  const mentions = getMentions(msg);
  const authorQuotedMsg = getQuotedAuthor(msg);
  const usersToBanIds = authorQuotedMsg ? [...mentions, authorQuotedMsg] : mentions;
  await bot.groupParticipantsUpdate('remove', msg.key.remoteJid, usersToBanIds, banMessage);
  await Promise.all(
    usersToBanIds.map((userId) => bot.sendMessage(userId, { text: banMessage })),
  );
};

export const unbanUser = ({ bot, msg }: CommandParamsInterface) => {
  const authorQuotedMsg = getQuotedAuthor(msg);
  bot.groupParticipantsUpdate('add', msg.key.remoteJid, [authorQuotedMsg]);
};

export const createFakeImg = async ({ bot, msg }: CommandParamsInterface) => {
  try {
    const [, ...params] = getMessageText(msg.message).split(' ');
    const message = getMessage(msg.message);
    const quotedMessage = getQuotedMessage(msg.message);
    let imageBuffer: Buffer;
    let thumbnailMediaData: Buffer;
    if (params[0]?.toLowerCase().startsWith('-r')) {
      imageBuffer = await getMedia(message);
      thumbnailMediaData = await getMedia(quotedMessage);
    } else {
      imageBuffer = await getMedia(quotedMessage);
      thumbnailMediaData = await getMedia(message);
    }
    const thumbnailBuffer = await extractImageThumb(thumbnailMediaData);
    bot.sendMessage(msg.key.remoteJid, { image: imageBuffer, jpegThumbnail: thumbnailBuffer.toString('base64') }, { quoted: msg });
  } catch (err) {
    bot.sendMessage(msg.key.remoteJid, { text: 'No se pudo crear la imagen, intente nuevamente' }, { quoted: msg });
    bot.handleError(err.message);
  }
};

export const sendCoins = async ({ bot, user: coinsSenderUser, msg }: CommandParamsInterface) => {
  try {
    const [, coins] = getMessageText(msg.message).split(' ');
    const coinsReceiverUserId = getMentions(msg)[0];
    const coinsToSend = Number(coins);
    const coinsReceiverUser = bot.getUser(coinsReceiverUserId);
    coinsSenderUser.subtractCoins(coinsToSend);
    coinsReceiverUser.addCoins(coinsToSend);
    bot.sendMessage(msg.key.remoteJid, { text: 'Coins transferidas exitosamente' }, { quoted: msg });
  } catch (err) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al transferir las coins, intente nuevamente' }, { quoted: msg });
    bot.handleError(err.message);
  }
};

export const sendCustomCommandMedia = (
  { bot, msg }: CommandParamsInterface,
  media: CustomCommandMedia,
) => {
  try {
    const mediaMessageBody = getMediaMessageBody(media);
    const hasQuotedMessage = !!getQuotedMessage(msg.message);
    if (hasQuotedMessage) {
      const contextInfo = msg.message?.extendedTextMessage.contextInfo;
      const quotedMessage = {
        key: {
          remoteJid: msg.key.remoteJid,
          id: contextInfo.stanzaId,
          participant: contextInfo.participant,
        },
        message: contextInfo.quotedMessage,
      };
      bot.sendMessage(msg.key.remoteJid, mediaMessageBody, { quoted: quotedMessage });
    } else {
      bot.sendMessage(msg.key.remoteJid, mediaMessageBody);
    }
  } catch (err) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al ejecutar el comando, intente nuevamente' }, { quoted: msg });
    bot.handleError(err.message);
  }
};

export const createCustomCommand = async ({ bot, msg }: CommandParamsInterface) => {
  try {
    const [, customCommandName, ...rest] = getMessageText(msg.message).split(' ');
    const commandDescription = rest.join(' ');
    const quotedMessage = getQuotedMessage(msg.message);
    const messageWithMedia = hasMediaForCustomCommand(msg.message) ? msg.message : quotedMessage;
    const commandMedia = await getMedia(messageWithMedia);
    const mimetype = getMimeType(messageWithMedia);
    const fileExtension = mimetype.split('/')[1];
    const rootPath = process.cwd();
    const mediaPath = `${rootPath}/media/${customCommandName.trim()}Command.${fileExtension}`;
    const media: CustomCommandMedia = {
      mediaPath,
      mimetype,
      isAudio: !!messageWithMedia?.audioMessage,
      isImage: !!messageWithMedia?.imageMessage,
      isGif: messageWithMedia?.videoMessage && messageWithMedia?.videoMessage.gifPlayback,
      isVideo: messageWithMedia?.videoMessage && !messageWithMedia?.videoMessage?.gifPlayback,
      isDocument: !!messageWithMedia?.documentMessage,
      isSticker: !!messageWithMedia?.stickerMessage,
      isAnimatedSticker: messageWithMedia?.stickerMessage
        && messageWithMedia.stickerMessage.isAnimated,
    };
    fs.writeFileSync(mediaPath, commandMedia);
    const customCommand = new Command({
      name: `/${customCommandName.trim()}`,
      description: commandDescription,
      minRole: RoleEnum.REGULAR,
      price: 1,
      media,
      apply: (params: CommandParamsInterface) => sendCustomCommandMedia(params, media),
      validate: withoutValidation,
    });
    bot.addCommand(customCommand);
    bot.sendMessage(msg.key.remoteJid, { text: 'Comando creado exitosamente' }, { quoted: msg });
  } catch (err) {
    console.log(err);
    bot.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al crear el comando, intente nuevamente' }, { quoted: msg });
    bot.handleError(err.message);
  }
};

export const mentionEveryone = ({ bot, msg }: CommandParamsInterface) => {
  const isAreaCode = (word: string) => word.startsWith('+') && !!Number(word.slice(1));
  const [, ...rest] = getMessageText(msg.message).split(' ');
  const hasFilterByAreaCodes = rest.some((word: string) => isAreaCode(word));
  const group = bot.getGroup(msg.key.remoteJid);
  let participantsToMention = group.getParticipants();
  if (hasFilterByAreaCodes) {
    const areaCodesFilter: string[] = rest
      .filter((word: string) => isAreaCode(word))
      .map((word: string) => word.slice(1));
    participantsToMention = participantsToMention
      .filter((participantId) => areaCodesFilter
        .some((areaCode) => participantId.startsWith(areaCode)));
  }
  const everyoneMessage = `_*COMUNICADO PARA LOS MIEMBROS*_\n${rest.filter((word: string) => !isAreaCode(word)).join(' ')}`;
  bot.sendMessage(
    msg.key.remoteJid,
    { text: everyoneMessage, mentions: participantsToMention },
    { quoted: msg },
  );
};
