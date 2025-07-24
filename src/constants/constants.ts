import dotenv from 'dotenv';
import User from '../models/User';
import { RoleEnum } from './enums';

dotenv.config();

export const defaultUsers = [
  new User({ id: process.env.BOT_ID, coins: 100, role: { globalRole: RoleEnum.CREATOR } }),
  new User({ id: process.env.CREATOR_ID, coins: 100, role: { globalRole: RoleEnum.CREATOR } }),
];

export default defaultUsers;
