import { initialGroupActions, initialGroupCommands } from '../constants/constants';
import { GroupActionsInterface, GroupCommandsInterface } from '../constants/interfaces';

class Group {
  participants: Array<string>;

  commands: GroupCommandsInterface;

  groupActions: GroupActionsInterface;

  constructor(
    participants: Array<string>,
    commands: GroupCommandsInterface = initialGroupCommands,
    groupActions: GroupActionsInterface = initialGroupActions,
  ) {
    this.participants = participants;
    this.commands = commands;
    this.groupActions = groupActions;
  }

  getParticipants() {
    return this.participants;
  }
}

export default Group;
