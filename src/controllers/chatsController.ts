// External deps
import { Chat } from '@adiwajshing/baileys';

// Internal deps
import User from '../models/User';
import { getRol } from '../utils/rols';

export const setChatsController = async (bot, chats: Array<Chat>) => {
  try {
    const chatGroups = chats.filter((chat) => !chat.readOnly && chat.id.includes('g.us'));
    const groupParticipantsArray = await Promise.all(chatGroups.map(async (chat) => {
      const { participants } = (await bot.getSock().groupMetadata(chat.id));
      return participants;
    }));
    const allParticipants = groupParticipantsArray.flat();
    const botUserIds = bot.getUserIds();
    const newParticipants = allParticipants
      .filter((participant, index) => allParticipants
        .findIndex((p) => p.id === participant.id) === index)
      .filter((participant) => !botUserIds.includes(participant?.id))
      .map((participant) => {
        const role = getRol(participant.admin);
        return new User({
          id: participant.id, role,
        });
      });
    if (newParticipants?.length) bot.setUsers([...bot.getUsers(), ...newParticipants]);
    console.log('New participants added', newParticipants?.length);
  } catch (err) {
    console.log(err?.message);
  }
};

export default setChatsController;
