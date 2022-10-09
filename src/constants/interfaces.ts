import { ParticipantAction, WAMessage } from '@adiwajshing/baileys';
import Bot from '../models/Bot';
import User from '../models/User';

export interface CommandParamsInterface {
  bot: Bot | null;
  user: User | null;
  msg: WAMessage | null;
}

export interface GroupActionsInterface {
  forbidden: Array<string>,
  allowed: Array<string>,
}

export interface TempBanInterface {
  id: string,
  reason: string,
  returnDate: string,
}

export interface ParticipantsUpdate {
  id: string,
  participants: Array<string>,
  action: ParticipantAction
}
