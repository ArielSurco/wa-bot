import { WAMessage } from '@adiwajshing/baileys';
import Bot from '../models/Bot';
import User from '../models/User';

export interface CommandParamsInterface {
  bot: Bot | null;
  user: User | null;
  msg: WAMessage | null;
}

export interface GroupCommandsInterface {
  active: Array<string>,
  inactive: Array<string>,
}

export interface GroupActionsInterface {
  forbidden: Array<string>,
  allowed: Array<string>,
}
