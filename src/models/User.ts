import { RoleEnum } from '../constants/enums';
import { menuMessage } from '../constants/menu';
import { isGroup } from '../utils/messageUtils';
import { isCreator } from '../utils/rols';

type UserRole = object & { globalRole?: RoleEnum }

class User {
  id: string;

  coins: number;

  role: UserRole;

  constructor({ id, coins = 0, role = { } }) {
    this.id = id;
    this.coins = coins;
    this.role = role;
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
}

export default User;
