import Bot from '../models/Bot';
import { GroupActionType } from '../constants/enums';
import { ParticipantsUpdate } from '../constants/interfaces';
import { setChatsController } from './chatsController';

export const groupParticipantsUpdate = async (bot: Bot, updateNotification: ParticipantsUpdate) => {
  const group = bot.getGroup(updateNotification.id);
  if (!group || (group && !group.isActive())) return;
  const groupActions = group.getGroupActions();
  const { participants } = updateNotification;
  const actions = bot.getActions(GroupActionType.GROUP_PARTICIPANTS_UPDATE, groupActions);

  await setChatsController(bot, [{ id: updateNotification.id }], true);

  participants.forEach((participant) => {
    actions.forEach((action) => {
      action.evaluate({
        bot, group, userId: participant, updateNotification,
      });
    });
  });
};

export default groupParticipantsUpdate;
