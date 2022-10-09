import GroupAction from '../models/GroupAction';
import { antiLinkAction, welcomeAction } from '../controllers/groupActionsController';
import { GroupActionEnum, GroupActionType } from './enums';

export const allGroupActions = [
  {
    id: GroupActionEnum.WELCOME,
    type: GroupActionType.GROUP_PARTICIPANTS_UPDATE,
    evaluate: welcomeAction,
  },
  {
    id: GroupActionEnum.ANTI_LINKS,
    type: GroupActionType.MESSAGE,
    evaluate: antiLinkAction,
  },
];

export const groupActions = allGroupActions
  .map((action) => new GroupAction(action.id, action.type, action.evaluate));
