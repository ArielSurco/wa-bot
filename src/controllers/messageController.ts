// External deps
import { WAMessage } from '@adiwajshing/baileys';

// Internal deps
import Bot from '../models/Bot';
import Command from '../models/Command';
import { getMessageText } from '../utils/messageUtils';

export const receiveMsg = async (bot: Bot, msg: WAMessage) => {
  const msgText = getMessageText(msg);
  const command = Command.getCommand(bot.getCommands(), msgText);
  if (!command) return;
  const user = await bot.getMessageUser(msg);
  if (!user) {
    bot.sendMessage(msg.key.remoteJid, { text: 'No tienes permitido usar el bot' }, { quoted: msg });
  }
  user.addCoins(1);
  command.use({ bot, msg, user });
};

export default receiveMsg;
