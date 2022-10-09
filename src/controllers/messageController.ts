// External deps
import { WAMessage } from '@adiwajshing/baileys';

// Internal deps
import Bot from '../models/Bot';
import Command from '../models/Command';
import { getMessageText, isGroup } from '../utils/messageUtils';
import { GroupActionType } from '../constants/enums';

export const receiveMsg = async (bot: Bot, msg: WAMessage) => {
  const msgText = getMessageText(msg);
  const user = await bot.getMessageUser(msg);
  if (!user) {
    await bot.sendMessage(msg.key.remoteJid, { text: 'No tienes permitido usar el bot' }, { quoted: msg });
    return;
  }

  user.addCoins(1);
  if (isGroup(msg.key.remoteJid)) {
    const group = bot.getGroup(msg.key.remoteJid);
    if (!group) return;
    const groupActions = group.getGroupActions();
    const actions = bot.getActions(GroupActionType.MESSAGE, groupActions);
    await Promise.all(
      actions.map((action) => action.evaluate({
        bot, user, msg,
      })),
    );
  }

  const command = Command.getCommand(bot.getCommands(), msgText);
  if (!command) return;
  command.use({ bot, msg, user });
};

export default receiveMsg;
