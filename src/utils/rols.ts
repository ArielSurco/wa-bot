import { WAMessage } from '@adiwajshing/baileys';
import User from '../models/User';
import { RoleEnum } from '../constants/enums';
import { isGroup } from './messageUtils';

export const getRol = (role: string) => {
  if (role === 'superadmin') { return RoleEnum.SUPER_ADMIN; }
  if (role === 'admin') { return RoleEnum.ADMIN; }
  return RoleEnum.REGULAR;
};

export const getRoleText = (role: RoleEnum) => {
  if (role === RoleEnum.REGULAR) {
    return 'MIEMBRO';
  }
  if (role === RoleEnum.VIP) {
    return 'VIP';
  }
  if (role === RoleEnum.ADMIN) {
    return 'ADMIN';
  }
  if (role === RoleEnum.SUPER_ADMIN) {
    return 'SUPER ADMIN';
  }
  if (role === RoleEnum.CREATOR) {
    return 'CREADOR';
  }
  return '';
};

export const getUserRole = (user: User, msg: WAMessage) => {
  const role: RoleEnum = isGroup(msg.key.remoteJid)
    ? user.role[msg.key.remoteJid]
    : user.role.globalRole;
  return role;
};

export const isCreator = (userId: string) => userId === process.env.CREATOR_ID
  || userId === process.env.BOT_ID;
