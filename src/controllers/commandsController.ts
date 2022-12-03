// External deps
import fs from 'fs';
import axios from 'axios';
import { createSticker as createStickerFromMedia, StickerTypes } from 'wa-sticker-formatter';
import { extractImageThumb, generateMessageID } from '@adiwajshing/baileys';

// Internal deps
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
import { CommandParamsInterface, CustomCommandMedia, LbryVideo } from '../constants/interfaces';
import { getRoleText } from '../utils/rols';
import { GroupActionEnum, RoleEnum } from '../constants/enums';
import { setChatsController } from './chatsController';
import Command from '../models/Command';
import { withoutValidation } from './validationsController';
import { getAllLbryVideos, saveVideosChannel } from '../modules/lbry';
import { getRandomItemsFromArray } from '../utils/utils';
import User from '../models/User';
import { postCreateAnimeFace } from '../services/animeFace';

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

export const unbanUser = async ({ bot, msg }: CommandParamsInterface) => {
  const group = bot.getGroup(msg.key.remoteJid);
  const authorQuotedMsg = getQuotedAuthor(msg);
  const response = await bot.groupParticipantsUpdate('add', group.id, [authorQuotedMsg]);
  if (Number(response?.status) >= 400) {
    bot.sendMessage(group.id, { text: 'No se pudo agregar al usuario por su configuración de privacidad. Agreguelo manualmente mandándole una invitación.' }, { quoted: msg });
  }
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

export const sendCustomCommandMedia = async (
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
      await bot.sendMessage(msg.key.remoteJid, mediaMessageBody, { quoted: quotedMessage });
    } else {
      await bot.sendMessage(msg.key.remoteJid, mediaMessageBody);
    }

    if (media.userIdForCommission) {
      const user = bot.getUser(media.userIdForCommission);
      user.addCoins(media.commission);
    }
  } catch (err) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al ejecutar el comando, intente nuevamente' }, { quoted: msg });
    bot.handleError(err.message);
  }
};

export const createCustomCommand = async ({ bot, msg }: CommandParamsInterface) => {
  try {
    const [, customCommandName, ...rest] = getMessageText(msg.message).split(' ');
    const isRemoveAction = rest?.some((word: string) => word.toLowerCase() === '-r');
    if (isRemoveAction) {
      bot.removeCommand(`/${customCommandName}`);
      bot.sendMessage(msg.key.remoteJid, { text: 'Comando eliminado exitosamente' }, { quoted: msg });
      return;
    }

    const commandDescription = rest.filter((word: string) => !(word.startsWith('-p') || word.startsWith('-c') || word.startsWith('@'))).join(' ');
    const quotedMessage = getQuotedMessage(msg.message);
    const messageWithMedia = hasMediaForCustomCommand(msg.message) ? msg.message : quotedMessage;
    const commandMedia = await getMedia(messageWithMedia);
    const mimetype = getMimeType(messageWithMedia);
    const fileExtension = mimetype.split('/')[1];
    const rootPath = process.cwd();
    const mediaPath = `${rootPath}/media/${customCommandName.trim()}Command.${fileExtension}`;

    let userIdForCommission: string;
    const hasCommision = rest.some((word: string) => word.startsWith('-c'));
    if (hasCommision) {
      [userIdForCommission] = getMentions(msg);
    }
    let customCommandPrice: number;
    const hasCustomPrice = rest.some((word: string) => word.startsWith('-p'));
    if (hasCustomPrice) {
      const priceParam = rest.find((word: string) => word.startsWith('-p'));
      customCommandPrice = Number(priceParam.replace('-p=', ''));
    }

    const media: CustomCommandMedia = {
      userIdForCommission,
      commission: customCommandPrice,
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
      price: customCommandPrice || 1,
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
  let participantsToMention: User[] = group
    .getParticipants()
    .map((participantId) => bot.getUser(participantId))
    .filter((user) => user.getRole(msg.key.remoteJid) < RoleEnum.ADMIN);
  if (hasFilterByAreaCodes) {
    const areaCodesFilter: string[] = rest
      .filter((word: string) => isAreaCode(word))
      .map((word: string) => word.slice(1));
    participantsToMention = participantsToMention
      .filter((participant) => areaCodesFilter
        .some((areaCode) => participant.id.startsWith(areaCode)));
  }
  const participantIds = participantsToMention.map((participant) => participant.id);
  const everyoneMessage = `_*COMUNICADO PARA LOS MIEMBROS*_\n${rest.filter((word: string) => !isAreaCode(word)).join(' ')}`;
  bot.sendMessage(
    msg.key.remoteJid,
    { text: everyoneMessage, mentions: participantIds },
    { quoted: msg },
  );
};

export const addLbryChannel = async ({ bot, msg }: CommandParamsInterface) => {
  try {
    const createLog = async (message: string) => bot.sendMessage(
      msg.key.remoteJid,
      { text: message },
      { quoted: msg },
    );
    const [,, channelName] = getMessageText(msg.message).split(' ');
    await saveVideosChannel(channelName, createLog);
    await bot.sendMessage(msg.key.remoteJid, { text: 'Canal agregado exitosamente' }, { quoted: msg });
  } catch (err) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al agregar el canal, intente nuevamente' }, { quoted: msg });
    bot.handleError(err.message);
  }
};

export const getLbryVideos = async ({ bot, msg, user }: CommandParamsInterface) => {
  try {
    const [, ...rest] = getMessageText(msg.message).split(' ');
    const searchQuery = rest.join(' ');
    let lbryVideos: LbryVideo[] = getAllLbryVideos();
    if (rest?.length && searchQuery) {
      lbryVideos = lbryVideos
        .filter((video) => video.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (!lbryVideos.length) {
      bot.sendMessage(msg.key.remoteJid, { text: 'No se encontraron videos, sus coins serán devueltas.' }, { quoted: msg });
      user.addCoins(20);
      return;
    }
    const randomLbryVideos = getRandomItemsFromArray(5, lbryVideos);
    await Promise.all(randomLbryVideos.map(async (lbryVideo: LbryVideo) => {
      const response = await axios.get(lbryVideo.thumbnail, { responseType: 'arraybuffer' });
      const mediaBuffer = Buffer.from(response.data);
      const captionText = `${lbryVideo.title}\n${lbryVideo.videoUrl}`;
      return bot.sendMessage(msg.key.remoteJid, { image: mediaBuffer, caption: captionText });
    }));
  } catch (err) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al obtener los videos, intente nuevamente.' }, { quoted: msg });
    bot.handleError(err.message);
  }
};

export const createAnimeFace = async ({ bot, msg }: CommandParamsInterface) => {
  try {
    const auxMsg = getMessage(msg.message);
    const message = auxMsg?.imageMessage ? auxMsg : getQuotedMessage(auxMsg);
    const mediaData: Buffer = await getMedia(message);
    await bot.sendMessage(msg.key.remoteJid, { text: 'Pedido tomado, espere un momento...' }, { quoted: msg });
    const response = await postCreateAnimeFace(mediaData.toString('base64'));
    const imageUrls = JSON.parse(response.extra)?.img_urls;

    const imageToSendResponse = await axios.get(imageUrls[0], { responseType: 'arraybuffer' });
    const mediaBuffer = Buffer.from(imageToSendResponse.data);
    bot.sendMessage(msg.key.remoteJid, { image: mediaBuffer }, { quoted: msg });
  } catch (err) {
    bot.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al crear la imagen, intente nuevamente o use otra imagen.' }, { quoted: msg });
    bot.handleError(err.message);
  }
};
