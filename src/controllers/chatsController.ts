// External deps
import { Chat, GroupParticipant } from '@adiwajshing/baileys';

// Internal deps
import Bot from '../models/Bot';
import User from '../models/User';
import { RoleEnum } from '../constants/enums';
import { isGroup } from '../utils/messageUtils';
import { getRol, isCreator } from '../utils/rols';

type ExtendedGroupParticipant = GroupParticipant & { groupId: string, role: RoleEnum}

export const setChatsController = async (bot: Bot, chats: Array<Chat>) => {
  try {
    const sock = bot.getSock();
    const chatGroups = chats.filter((chat) => !chat.readOnly && isGroup(chat.id));
    const groupParticipantsArray: ExtendedGroupParticipant[][] = await Promise.all(
      chatGroups.map(async (chat) => {
        const { participants } = await sock.groupMetadata(chat.id);
        return participants.map((participant) => ({
          ...participant,
          groupId: chat.id,
          role: getRol(participant.admin),
        }));
      }),
    );
    const allParticipants: ExtendedGroupParticipant[] = groupParticipantsArray.flat();
    const botUsers: User[] = bot.getUsers();
    let newParticipantsAdded = 0;
    allParticipants.forEach((participant) => {
      const userIndex = botUsers.findIndex((user) => participant.id === user.id);
      if (userIndex >= 0) {
        botUsers[userIndex].role[participant.groupId] = isCreator(participant.id)
          ? RoleEnum.CREATOR
          : participant.role;
      } else {
        botUsers.push(new User({
          id: participant.id,
          role: { [participant.groupId]: participant.role, globalRole: RoleEnum.REGULAR },
        }));
        newParticipantsAdded += 1;
      }
    });
    bot.setUsers(botUsers);
    console.log('New participants added', newParticipantsAdded);
  } catch (err) {
    console.log(err?.message);
  }
};

export default setChatsController;
