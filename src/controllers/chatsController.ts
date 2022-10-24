// External deps
import { Chat, GroupParticipant } from '@adiwajshing/baileys';

// Internal deps
import Bot from '../models/Bot';
import Group from '../models/Group';
import User from '../models/User';
import { RoleEnum } from '../constants/enums';
import { isGroup } from '../utils/messageUtils';
import { getRol, isCreator } from '../utils/rols';

type ExtendedGroupParticipant = GroupParticipant & { groupId: string, role: RoleEnum}
type ChatParam = Chat | { id: string, readOnly?: boolean }

export const setChatsController = async (bot: Bot, chats: ChatParam[], manualCall = false) => {
  try {
    const sock = bot.getSock();
    const botGroups = bot.getGroups();
    const botUsers: User[] = bot.getUsers();
    const chatGroups = chats
      .filter((chat) => manualCall || (!chat.readOnly
        && isGroup(chat.id)
        && botGroups.some((group) => group.id === chat.id)));
    let newParticipantsAdded = 0;
    let newGroupsAdded = 0;

    // Get all the participants of the groups where the bot is
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

    // Format all participants and add them to the bot data if they are new
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

    // Format all groups and add them to the bot data if they are new
    await Promise.all(
      chatGroups.map(async (group) => {
        const groupIndex = botGroups.findIndex((g) => g.id === group.id);
        const {
          subject: groupName,
          participants: groupParticipants,
          desc: descriptionBuffer,
        } = await sock.groupMetadata(group.id);
        const description = descriptionBuffer?.toString() || '';
        const participants = groupParticipants.map((participant) => participant.id);
        if (groupIndex >= 0) {
          if (manualCall) botGroups[groupIndex].setActive(true);
          botGroups[groupIndex].participants = participants;
          botGroups[groupIndex].description = description;
        } else {
          botGroups.push(new Group({
            id: group.id, name: groupName, description, participants,
          }));
          newGroupsAdded += 1;
        }
      }),
    );
    bot.setGroups(botGroups);

    // Show new participants and groups added
    // eslint-disable-next-line no-console
    console.log('New participants added', newParticipantsAdded, 'New groups added', newGroupsAdded);
  } catch (err) {
    bot.handleError(err.message);
  }
};

export default setChatsController;
