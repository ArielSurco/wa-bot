import { GroupActionEnum, GroupActionType } from '../constants/enums';

class GroupAction {
  id: GroupActionEnum;

  type: GroupActionType;

  evaluate: Function;

  constructor(id: GroupActionEnum, type: GroupActionType, evaluate: Function) {
    this.id = id;
    this.type = type;
    this.evaluate = evaluate;
  }
}

export default GroupAction;
