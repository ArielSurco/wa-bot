// External deps
import { WAMessage } from '@adiwajshing/baileys';

// Internal deps
import Bot from '../models/Bot';
import Command from '../models/Command';
import { getMessageText, isGroup } from '../utils/messageUtils';
import { GroupActionType } from '../constants/enums';
import { isCreator } from '../utils/rols';

export const receiveMsg = async (bot: Bot, msg: WAMessage) => {
  const msgText = getMessageText(msg);
  const user = await bot.getMessageUser(msg);
  const command = Command.getCommand(bot.getCommands(), msgText);
  const cantUseBotInGroup = user
    && !isCreator(user.id)
    && !bot.getGroup(msg.key.remoteJid)?.isActive();
  const isUserInactive = user && !user.active;

  if (!user || cantUseBotInGroup || isUserInactive) {
    const responseText = isGroup(msg.key.remoteJid)
      ? 'No se puede utilizar el bot en este grupo. El creador debe habilitar el bot en este grupo para que se pueda utilizar.'
      : 'No puedes utilizar el bot. Debes pertenecer a alguno de los grupos donde el bot está habilitado.';
    if (command) bot.sendMessage(msg.key.remoteJid, { text: responseText }, { quoted: msg });
    return;
  }

  if (!command) user.addCoins(1);

  if (isGroup(msg.key.remoteJid)) {
    const group = bot.getGroup(msg.key.remoteJid);
    if (group) {
      const groupActions = group.getGroupActions();
      const actions = bot.getActions(GroupActionType.MESSAGE, groupActions);
      await Promise.all(
        actions.map((action) => action.evaluate({
          bot, user, msg,
        })),
      );
    }
  }

  if (!command) return;
  command.use({ bot, msg, user });
};

export default receiveMsg;
