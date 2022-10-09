import Bot from '../models/Bot';
import { GroupActionType } from '../constants/enums';
import { ParticipantsUpdate } from '../constants/interfaces';

export const groupParticipantsUpdate = async (bot: Bot, updateNotification: ParticipantsUpdate) => {
  const group = bot.getGroup(updateNotification.id);
  const groupActions = group.getGroupActions();
  const { participants } = updateNotification;
  const actions = bot.getActions(GroupActionType.GROUP_PARTICIPANTS_UPDATE, groupActions);

  participants.forEach((participant) => {
    actions.forEach((action) => {
      action.evaluate({
        bot, group, userId: participant, updateNotification,
      });
    });
  });
};

export default groupParticipantsUpdate;
