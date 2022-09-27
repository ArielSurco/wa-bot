import { commands } from './commands';
import { GroupCommandsInterface } from './interfaces';

export const initialGroupCommands = {
  active: commands.map((command) => command.name),
  inactive: [],
} as GroupCommandsInterface;

export const initialGroupActions = {
  forbidden: [],
  allowed: [],
};
