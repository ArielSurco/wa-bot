import { RoleEnum } from '../constants/enums';

class User {
  id: string;

  coins: number;

  role: RoleEnum;

  constructor({ id, coins = 0, role = RoleEnum.REGULAR }) {
    this.id = id;
    this.coins = coins;
    this.role = role;
  }

  getCoins() {
    return this.coins;
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
