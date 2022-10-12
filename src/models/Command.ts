import { RoleEnum } from '../constants/enums';
import { CommandParamsInterface } from '../constants/interfaces';
import { isGroup } from '../utils/messageUtils';
import { getUserRole } from '../utils/rols';

interface CommandConstructor {
  name: string;
  price: number;
  description: string;
  optionsStr?: string;
  minRole: RoleEnum;
  apply: Function,
  validate: Function
}

class Command {
  name: string;

  price: number;

  description: string;

  optionsStr: string;

  minRole: RoleEnum;

  execute: Function;

  validate: Function;

  constructor({
    name, price, description, optionsStr, minRole, apply, validate,
  }: CommandConstructor) {
    this.name = name;
    this.price = price;
    this.description = description;
    this.optionsStr = optionsStr;
    this.minRole = minRole;
    this.execute = apply;
    this.validate = validate;
  }

  use({ bot, msg, user }: CommandParamsInterface) {
    try {
      const role = getUserRole(user, msg);
      if (role < this.minRole) {
        bot.sendMessage(msg.key.remoteJid, { text: 'No tienes el rol necesario para usar este comando' }, { quoted: msg });
        return;
      }
      if (this.minRole === RoleEnum.ADMIN && !isGroup(msg.key.remoteJid)) {
        bot.sendMessage(msg.key.remoteJid, { text: 'Este comando solo se puede usar en grupos' }, { quoted: msg });
        return;
      }
      if (user.getCoins() < this.price) {
        bot.sendMessage(msg.key.remoteJid, { text: 'No tienes suficientes coins para usar este comando' }, { quoted: msg });
        return;
      }
      if (!this.validate({ bot, msg, user })) return;
      user.subtractCoins(this.price);
      this.execute({ bot, msg, user });
    } catch (err) {
      bot.sendMessage(msg.key.remoteJid, { text: 'Ocurrió un error al ejecutar el comando' }, { quoted: msg });
    }
  }

  getPrice() {
    return this.price;
  }

  static getCommand(commands: Array<Command>, message: string) {
    return commands.find((command) => message?.startsWith(command.name));
  }

  static isCommand(commands: Array<Command>, message: string) {
    return commands.some((command) => message?.startsWith(command.name));
  }
}

export default Command;
