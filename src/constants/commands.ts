import Command from '../models/Command';
import {
  createSticker, sendStatus, sendCoins, createPoll, groupInfo, activeWelcome, activeAntiLinks,
} from '../controllers/commandsController';
import { RoleEnum } from './enums';
import { createStickerValidation, createPollValidation, withoutValidation } from '../controllers/validationsController';

export const regularUserCommands = [
  {
    name: '/status',
    description: 'Indica si el bot esta vivo',
    price: 0,
    minRole: RoleEnum.REGULAR,
    apply: sendStatus,
    validate: withoutValidation,
  },
  {
    name: '/coins',
    description: 'Indica la cantidad de coins que tienes',
    price: 0,
    minRole: RoleEnum.REGULAR,
    apply: sendCoins,
    validate: withoutValidation,
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
  {
    name: '/welcome on',
    description: 'Activa el mensaje de bienvenida',
    price: 0,
    minRole: RoleEnum.ADMIN,
    apply: activeWelcome,
    validate: withoutValidation,
  },
  {
    name: '/antilinks',
    description: 'Activa el baneo automático cuando alguien manda un link',
    price: 0,
    minRole: RoleEnum.ADMIN,
    apply: activeAntiLinks,
    validate: withoutValidation,
  },
];

export const creatorCommands = [
  {
    name: '/g info',
    description: 'Muestra informacion del grupo',
    price: 0,
    minRole: RoleEnum.CREATOR,
    apply: groupInfo,
    validate: withoutValidation,
  },
];

export const commands = [
  ...regularUserCommands.map((comm) => new Command(comm)),
  ...adminCommands.map((comm) => new Command(comm)),
  ...creatorCommands.map((comm) => new Command(comm)),
];
