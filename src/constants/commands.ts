import Command from '../models/Command';
import {
  createSticker,
  sendStatus,
  sendCoins,
  createPoll,
  getInfo,
  activeWelcome,
  activeAntiLinks,
  sendMenu,
  handleChange,
  banUsers,
  unbanUser,
} from '../controllers/commandsController';
import { RoleEnum } from './enums';
import {
  createStickerValidation,
  createPollValidation,
  withoutValidation,
  handleChangeValidation,
  antilinksValidation,
  banUsersValidation,
  unbanUserValidation,
} from '../controllers/validationsController';

export const regularUserCommands = [
  {
    name: '/menu',
    description: 'Muestra el menú de comandos',
    price: 0,
    minRole: RoleEnum.REGULAR,
    apply: sendMenu,
    validate: withoutValidation,
  },
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
    name: '/ban',
    description: 'Banea a los usuarios indicados',
    price: 0,
    minRole: RoleEnum.ADMIN,
    apply: banUsers,
    validate: banUsersValidation,
  },
  {
    name: '/unban',
    description: 'Agrega al usuario del mensaje que se indique, si no está en el grupo',
    price: 0,
    minRole: RoleEnum.ADMIN,
    apply: unbanUser,
    validate: unbanUserValidation,
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
    description: 'Activa/Desactiva el baneo automático cuando alguien manda un link',
    optionsStr: '[on|off]',
    price: 0,
    minRole: RoleEnum.ADMIN,
    apply: activeAntiLinks,
    validate: antilinksValidation,
  },
  {
    name: '/poll',
    description: 'Crea una encuesta',
    price: 0,
    minRole: RoleEnum.ADMIN,
    apply: createPoll,
    validate: createPollValidation,
  },
];

export const creatorCommands = [
  {
    name: '/ch',
    description: 'Cambia los atributos que se indiquen',
    optionsStr: '[coins|group]',
    price: 0,
    minRole: RoleEnum.CREATOR,
    apply: handleChange,
    validate: handleChangeValidation,
  },
  {
    name: '/info',
    description: 'Muestra la información solicitada',
    price: 0,
    minRole: RoleEnum.CREATOR,
    apply: getInfo,
    validate: withoutValidation,
  },
];

export const commands = [
  ...regularUserCommands.map((comm) => new Command(comm)),
  ...adminCommands.map((comm) => new Command(comm)),
  ...creatorCommands.map((comm) => new Command(comm)),
];
