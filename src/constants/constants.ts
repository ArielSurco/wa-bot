import dotenv from 'dotenv';
import User from '../models/User';
import { commands } from './commands';
import { RoleEnum } from './enums';
import { GroupCommandsInterface } from './interfaces';

dotenv.config();

export const initialGroupCommands = {
  active: commands.map((command) => command.name),
  inactive: [],
} as GroupCommandsInterface;

export const initialGroupActions = {
  forbidden: [],
  allowed: [],
};

export const defaultUsers = [
  new User({ id: process.env.BOT_ID, coins: 100, role: { globalRole: RoleEnum.CREATOR } }),
  new User({ id: process.env.CREATOR_ID, coins: 100, role: { globalRole: RoleEnum.CREATOR } }),
];
