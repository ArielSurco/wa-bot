import { RoleEnum } from '../constants/enums';
import { menuMessage } from '../constants/menu';
import { isGroup } from '../utils/messageUtils';
import { isCreator } from '../utils/rols';

type UserRole = object & { globalRole?: RoleEnum }

class User {
  active: boolean;

  id: string;

  coins: number;

  role: UserRole;

  constructor({
    id, coins = 0, role = { }, active = true,
  }) {
    this.id = id;
    this.coins = coins;
    this.role = role;
    this.active = active;
  }

  getCoins() {
    return this.coins;
  }

  getMenu(groupId: string) {
    let role: RoleEnum;
    if (groupId && isGroup(groupId)) {
      role = isCreator(this.id) ? this.role.globalRole : this.role[groupId];
    }
    if (!groupId || !isGroup(groupId)) {
      role = this.role.globalRole;
    }

    return menuMessage(role);
  }

  getRole(groupId?: string): RoleEnum {
    if (groupId) {
      return this.role[groupId];
    }
    return this.role.globalRole;
  }

  getGroupIds() {
    const groupIds = Object.keys(this.role).filter((key) => key !== 'globalRole');
    return groupIds;
  }

  addCoins(coins) {
    this.coins += coins;
  }

  subtractCoins(coins) {
    this.coins -= coins;
  }

  setCoins(coins) {
    this.coins = coins;
  }

  setRole(role) {
    this.role = role;
  }

  setActive(isActive: boolean) {
    this.active = isActive;
  }
}

export default User;
