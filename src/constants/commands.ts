import Command from '../models/Command';
import {
  createSticker,
  sendStatus,
  getCoins,
  createPoll,
  getInfo,
  activeWelcome,
  activeAntiLinks,
  sendMenu,
  handleChange,
  banUsers,
  unbanUser,
  createFakeImg,
  sendCoins,
  createCustomCommand,
  mentionEveryone,
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
  createFakeImgValidation,
  sendCoinsValidation,
  createCustomCommandValidation,
  mentionEveryoneValidation,
} from '../controllers/validationsController';
import { ConstantCommand } from './interfaces';
import { getCustomCommands } from '../utils/botUtils';

export const regularUserCommands: ConstantCommand[] = [
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
    apply: getCoins,
    validate: withoutValidation,
  },
  {
    name: '/send',
    description: 'Transfiere tus coins a otro usuario',
    optionsStr: '<cantidad> <@usuario>',
    price: 0,
    minRole: RoleEnum.REGULAR,
    apply: sendCoins,
    validate: sendCoinsValidation,
  },
  {
    name: '/st',
    description: 'Crea un sticker a partir de una imagen, gif o video',
    price: 5,
    minRole: RoleEnum.REGULAR,
    apply: createSticker,
    validate: createStickerValidation,
  },
  {
    name: '/fake',
    description: 'Crea una imagen con vista previa falsa. La imagen que envies será la vista previa de la imagen que respondas. Opcionalmente puedes agregar -r para que la imagen que respondas sea la vista previa',
    optionsStr: '[-r]',
    price: 10,
    minRole: RoleEnum.REGULAR,
    apply: createFakeImg,
    validate: createFakeImgValidation,
  },
  ...getCustomCommands(),
];

export const adminCommands: ConstantCommand[] = [
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
    name: '@everyone',
    description: 'Menciona a todos los usuarios del grupo',
    price: 0,
    minRole: RoleEnum.ADMIN,
    apply: mentionEveryone,
    validate: mentionEveryoneValidation,
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
    optionsStr: '<Título>, <Opción 1>, <Opción 2>, ...',
    price: 0,
    minRole: RoleEnum.ADMIN,
    apply: createPoll,
    validate: createPollValidation,
  },
];

export const creatorCommands: ConstantCommand[] = [
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
  {
    name: '/custom',
    description: 'Crea un comando personalizado, que enviará la multimedia que se indique',
    price: 0,
    minRole: RoleEnum.CREATOR,
    apply: createCustomCommand,
    validate: createCustomCommandValidation,
  },
];

export const commands = [
  ...regularUserCommands.map((comm) => new Command(comm)),
  ...adminCommands.map((comm) => new Command(comm)),
  ...creatorCommands.map((comm) => new Command(comm)),
];
