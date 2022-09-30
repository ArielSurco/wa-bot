import Command from '../models/Command';
import {
  createSticker, sendStatus, sendCoins, createPoll,
} from '../controllers/commandsController';
import { RoleEnum } from './enums';
import { createStickerValidation, createPollValidation } from '../controllers/validationsController';

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

export const adminCommands = [
  {
    name: '/poll',
    description: 'Crea una encuesta',
    price: 0,
    minRole: RoleEnum.ADMIN,
    apply: createPoll,
    validate: createPollValidation,
  },
];

export const commands = [
  ...regularUserCommands.map((comm) => new Command(comm)),
  ...adminCommands.map((comm) => new Command(comm)),
];
