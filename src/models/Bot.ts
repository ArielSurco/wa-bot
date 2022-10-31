// External deps
import Pino from 'pino';
import dotenv from 'dotenv';
import makeWASocket, {
  AnyMessageContent,
  GroupMetadata,
  MessageRelayOptions,
  MiscMessageGenerationOptions,
  ParticipantAction,
  proto,
  useMultiFileAuthState,
  WAMessage,
  WASocket,
} from '@adiwajshing/baileys';

// Internal deps
import User from './User';
import Command from './Command';
import MessageRetryHandler from './MessageRetryHandler';
import Group from './Group';
import GroupAction from './GroupAction';
import { connectionUpdate } from '../controllers/connectionController';
import { getData, setData } from '../utils/files';
import { getRol, isCreator } from '../utils/rols';
import { setChatsController } from '../controllers/chatsController';
import { receiveMsg } from '../controllers/messageController';
import { commands, regularUserCommands } from '../constants/commands';
import { GroupActionEnum, GroupActionType, RoleEnum } from '../constants/enums';
import { isGroup } from '../utils/messageUtils';
import { defaultUsers } from '../constants/constants';
import { groupParticipantsUpdate } from '../controllers/groupController';
import { groupActions } from '../constants/groupActions';
import { ConstantCommand } from '../constants/interfaces';
import { getCustomCommands } from '../utils/botUtils';

dotenv.config();
const logger = Pino({ level: 'fatal' });

class Bot {
  users: Array<User>;

  groups: Array<Group>;

  commands: Array<Command>;

  actions: Array<GroupAction> = groupActions;

  sock: WASocket;

  constructor() {
    const usersData: User[] = getData('users').map((user) => new User(user));
    const groupsData: Group[] = getData('groups').map((group) => new Group(group));
    const customCommands: ConstantCommand[] = getCustomCommands();
    const allCommands = [...commands, ...customCommands.map((command) => new Command(command))];

    this.users = usersData?.length ? usersData : defaultUsers;
    this.groups = groupsData?.length ? groupsData : [];
    this.commands = allCommands;
  }

  async startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const handler = new MessageRetryHandler();

    const sock = makeWASocket({
      syncFullHistory: false,
      printQRInTerminal: true,
      auth: state,
      logger,
      getMessage: handler.messageRetryHandler,
    });

    setInterval(() => {
      this.setUsers(this.users);
    }, 60000);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => connectionUpdate(this, update));

    sock.ev.on('chats.set', ({ chats }) => setChatsController(this, chats));

    sock.ev.on('group-participants.update', (update) => groupParticipantsUpdate(this, update));

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      try {
        if (type === 'notify') {
          await Promise.all(messages.map((msg) => receiveMsg(this, msg)));
        }
      } catch (err) {
        this.handleError(err.message);
      }
    });

    this.sock = sock;
  }

  getSock() {
    return this.sock;
  }

  getUserIds() {
    return this.users.map((user) => user.id);
  }

  getUsers() {
    return this.users;
  }

  getUser(id: string) {
    return this.users.find((user) => user.id === id);
  }

  getGroup(id: string) {
    return this.groups.find((group) => group.id === id);
  }

  getGroups() {
    return this.groups;
  }

  getActions(type: GroupActionType, actions: GroupActionEnum[]) {
    const filteredActions = this.actions.filter((action) => action.type === type);
    return filteredActions
      .filter((action) => actions
        .some((groupAction) => groupAction === action.id));
  }

  getCommands(role?: RoleEnum) {
    return role ? this.commands.filter((command) => role >= command.minRole) : this.commands;
  }

  async getMessageUser(msg: WAMessage) {
    try {
      let user = isGroup(msg.key.remoteJid)
        ? this.getUser(msg.key.participant)
        : this.getUser(msg.key.remoteJid);

      if (user && !user.active && !isCreator(user.id)) return null;
      if (!user && isGroup(msg.key.remoteJid) && this.getGroup(msg.key.remoteJid)?.isActive()) {
        const groupId = msg.key.remoteJid;
        const groupMetadata: GroupMetadata = await this.sock.groupMetadata(groupId);
        const participant = groupMetadata.participants
          .find((p) => p.id === msg.key.participant);
        const role = getRol(participant.admin);
        const newUser = new User({
          id: msg.key.participant, role: { [groupId]: role },
        });
        user = newUser;
        this.setUsers([...this.getUsers(), newUser]);
      }
      return user;
    } catch (err) {
      this.handleError(err.message);
      return null;
    }
  }

  setUsers(users: Array<User>) {
    this.users = users;
    setData('users', users);
  }

  setGroups(groups: Array<Group>) {
    this.groups = groups;
    setData('groups', groups);
  }

  addCommand(command: Command) {
    this.commands.push(command);
    regularUserCommands.push({ ...command, apply: command.execute });
    const allCustomCommands = getData('customCommands');
    const newCustomCommands = [...allCustomCommands, command];
    setData('customCommands', newCustomCommands);
  }

  removeCommand(commandName: string) {
    this.commands = this.commands.filter((command) => command.name !== commandName);
    const indexInRegularCommands = regularUserCommands
      .findIndex((command) => command.name === commandName);
    regularUserCommands.splice(indexInRegularCommands, 1);
    const allCustomCommands = getData('customCommands');
    const newCustomCommands = allCustomCommands.filter((command) => command.name !== commandName);
    setData('customCommands', newCustomCommands);
  }

  static removeCommand(command: Command) {
    const allCustomCommands = getData('customCommands');
    const newCustomCommands = allCustomCommands.filter((comm) => comm.name !== command.name);
    setData('customCommands', newCustomCommands);
  }

  sendMessage(chatId: string, message: AnyMessageContent, options?: MiscMessageGenerationOptions) {
    return this.sock.sendMessage(chatId, message, options);
  }

  relayMessage(chatId: string, message: proto.IMessage, options?: MessageRelayOptions) {
    return this.sock.relayMessage(chatId, message, options);
  }

  handleError(errMessage: string) {
    this.sock.sendMessage(process.env.CREATOR_ID, { text: errMessage });
  }

  async groupParticipantsUpdate(
    updateType: ParticipantAction,
    groupId: string,
    usersToUpdateIds: string[],
    banMessage?: string,
  ) {
    const [response] = await this.sock.groupParticipantsUpdate(
      groupId,
      usersToUpdateIds,
      updateType,
    );
    if (Number(response.status) !== 200) {
      return response;
    }
    if (updateType === 'remove') {
      if (banMessage) {
        await Promise.all(
          usersToUpdateIds.map((userId) => this.sock.sendMessage(userId, { text: banMessage })),
        );
      }

      const group = this.getGroup(groupId);
      const newParticipants = group
        .getParticipants()
        .filter((participantId) => !usersToUpdateIds.includes(participantId));
      group.setParticipants(newParticipants);

      this.getUsers().forEach((user) => {
        const userOnlyHasOneGroup = user.getGroupIds().length === 1;
        if (usersToUpdateIds.includes(user.id) && userOnlyHasOneGroup) {
          user.setActive(false);
        }
      });
    }
    if (updateType === 'add') {
      const group = this.getGroup(groupId);
      const newParticipants = [...group.getParticipants(), ...usersToUpdateIds];
      group.setParticipants(newParticipants);

      this.getUsers().forEach((user) => {
        if (usersToUpdateIds.includes(user.id) && !user.active) {
          user.setActive(true);
        }
      });
    }
    return undefined;
  }
}

export default Bot;
