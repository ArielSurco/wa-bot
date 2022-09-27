import Command from '../models/Command';
import { createSticker, sendStatus, sendCoins } from '../controllers/commandsController';
import { RoleEnum } from './enums';
import { createStickerValidation } from '../controllers/validationsController';

export const regularUserCommands = [
  {
    name: '/status',
    description: 'Indica si el bot esta vivo',
    price: 0,
    minRole: RoleEnum.REGULAR,
    apply: sendStatus,
    validate: () => true,
  },
  {
    name: '/coins',
    description: 'Indica la cantidad de coins que tienes',
    price: 0,
    minRole: RoleEnum.REGULAR,
    apply: sendCoins,
    validate: () => true,
  },
  {
    name: '/st',
    description: 'Crea un sticker a partir de una imagen, gif o video',
    price: 5,
    minRole: RoleEnum.REGULAR,
    apply: createSticker,
    validate: createStickerValidation,
  },
];

export const commands = [
  ...regularUserCommands.map((comm) => new Command(comm)),
];
