import { RoleEnum } from '../constants/enums';

class Command {
  name: string;

  price: number;

  description: string;

  minRole: RoleEnum;

  execute: Function;

  validate: Function;

  constructor({
    name, price, description, minRole, apply, validate,
  }) {
    this.name = name;
    this.price = price;
    this.description = description;
    this.minRole = minRole;
    this.execute = apply;
    this.validate = validate;
  }

  use({ bot, msg, user }) {
    try {
      if (user.role < this.minRole) {
        bot.sendMessage(msg.key.remoteJid, { text: 'No tienes el rol necesario para usar este comando' }, { quoted: msg });
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
