import { GroupActionEnum } from '../constants/enums';
import { TempBanInterface } from '../constants/interfaces';

interface GroupConstructor {
  id: string,
  name: string,
  description: string,
  participants: Array<string>,
  groupActions?: Array<GroupActionEnum>,
  private?: boolean,
  tempBans?: Array<TempBanInterface>,
  inactiveCommands?: Array<string>,
  forbiddenAreaCodes?: Array<string>,
}

class Group {
  id: string;

  name: string;

  description: string;

  participants: Array<string>;

  groupActions: Array<GroupActionEnum>;

  private: boolean;

  tempBans: Array<TempBanInterface>;

  inactiveCommands: Array<string>;

  forbiddenAreaCodes: Array<string>;

  constructor({
    id,
    name,
    description,
    participants,
    groupActions = [],
    private: privateGroup = false,
    tempBans = [],
    inactiveCommands = [],
    forbiddenAreaCodes = [],
  }: GroupConstructor) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.participants = participants;
    this.groupActions = groupActions;
    this.private = privateGroup;
    this.tempBans = tempBans;
    this.inactiveCommands = inactiveCommands;
    this.forbiddenAreaCodes = forbiddenAreaCodes;
  }

  getParticipants() {
    return this.participants;
  }

  getGroupActions() {
    return this.groupActions;
  }

  setGroupActions(newGroupActions: GroupActionEnum[]) {
    this.groupActions = newGroupActions;
  }

  addGroupAction(groupAction: GroupActionEnum) {
    this.setGroupActions([...this.getGroupActions(), groupAction]);
  }
}

export default Group;
