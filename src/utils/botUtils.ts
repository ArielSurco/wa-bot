import { CommandParamsInterface } from '../constants/interfaces';
import { sendCustomCommandMedia } from '../controllers/commandsController';
import { withoutValidation } from '../controllers/validationsController';
import { getData } from './files';

export const getCustomCommands = () => getData('customCommands').map((command) => ({
  ...command,
  apply: (params: CommandParamsInterface) => sendCustomCommandMedia(params, command.media),
  validate: withoutValidation,
}));

export default getCustomCommands;
