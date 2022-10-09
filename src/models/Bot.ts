// External deps
import makeWASocket, {
  AnyMessageContent,
  GroupMetadata,
  MessageRelayOptions,
  MiscMessageGenerationOptions,
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
import { getRol } from '../utils/rols';
import { setChatsController } from '../controllers/chatsController';
import { receiveMsg } from '../controllers/messageController';
import { commands } from '../constants/commands';
import { GroupActionEnum, GroupActionType, RoleEnum } from '../constants/enums';
import { isGroup } from '../utils/messageUtils';
import { defaultUsers } from '../constants/constants';
import { groupParticipantsUpdate } from '../controllers/groupController';
import { groupActions } from '../constants/groupActions';

class Bot {
  users: Array<User>;

  groups: Array<Group>;

  commands: Array<Command>;

  actions: Array<GroupAction> = groupActions;

  sock: WASocket;

  constructor() {
    const usersData = getData('users').map((user) => new User(user));
    const groupsData = getData('groups').map((group) => new Group(group));
    this.users = usersData?.length ? usersData : defaultUsers;
    this.groups = groupsData?.length ? groupsData : [];
    this.commands = commands;
  }

  async startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const handler = new MessageRetryHandler();

    const sock = makeWASocket({
      syncFullHistory: false,
      printQRInTerminal: true,
      auth: state,
      getMessage: handler.messageRetryHandler,
    });

    setInterval(() => {
      this.setUsers(this.users);
    }, 60000);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => connectionUpdate(this, update));

    sock.ev.on('chats.set', ({ chats }) => setChatsController(this, chats));

    sock.ev.on('group-participants.update', (update) => groupParticipantsUpdate(this, update));

    sock.ev.on('messages.upsert', ({ messages, type }) => {
      if (type === 'notify') {
        messages.forEach((msg) => receiveMsg(this, msg));
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
    let user = isGroup(msg.key.remoteJid)
      ? this.getUser(msg.key.participant)
      : this.getUser(msg.key.remoteJid);
    if (!user && isGroup(msg.key.remoteJid)) {
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
  }

  setUsers(users: Array<User>) {
    this.users = users;
    setData('users', users);
  }

  setGroups(groups: Array<Group>) {
    this.groups = groups;
    setData('groups', groups);
  }

  sendMessage(chatId: string, message: AnyMessageContent, options: MiscMessageGenerationOptions) {
    return this.sock.sendMessage(chatId, message, options);
  }

  relayMessage(chatId: string, message: proto.IMessage, options: MessageRelayOptions) {
    return this.sock.relayMessage(chatId, message, options);
  }
}

export default Bot;
