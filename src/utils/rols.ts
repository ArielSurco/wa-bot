import { RoleEnum } from '../constants/enums';

export const getRol = (rol) => {
  if (rol === 'superadmin') { return RoleEnum.SUPER_ADMIN; }
  if (rol === 'admin') { return RoleEnum.ADMIN; }
  return RoleEnum.REGULAR;
};

export default getRol;
