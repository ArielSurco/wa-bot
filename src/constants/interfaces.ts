import { ParticipantAction, WAMessage } from '@adiwajshing/baileys';
import Bot from '../models/Bot';
import User from '../models/User';
import { RoleEnum } from './enums';

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

export interface CustomCommandMedia {
  userIdForCommission?: string,
  commission?: number,
  mediaPath: string,
  mimetype: string,
  isAudio: boolean,
  isImage: boolean,
  isGif: boolean,
  isVideo: boolean,
  isDocument: boolean,
  isSticker: boolean,
  isAnimatedSticker: boolean,
}

export interface ConstantCommand {
  name: string;
  description: string;
  optionsStr?: string;
  price: number;
  minRole: RoleEnum;
  apply: Function;
  validate: Function;
}

export interface LbryVideo {
  title: string;
  thumbnail: string;
  videoUrl: string;
}

export interface LbryItemData {
  channel: string;
  videos: LbryVideo[];
}
