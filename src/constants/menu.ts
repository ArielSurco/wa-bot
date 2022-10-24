import { getRoleText } from '../utils/rols';
import { regularUserCommands, adminCommands, creatorCommands } from './commands';
import { RoleEnum } from './enums';

export const regularUserMenu = () => ({
  title: 'Comandos para MIEMBROS',
  rows: regularUserCommands.map((command) => ({
    title: `${command.name} ${command.optionsStr || ''}`,
    description: `${command.price ? `Precio: ${command.price} coins. ` : ''}${command.description}`,
  })),
});

export const adminMenu = {
  title: 'Comandos para ADMINS',
  rows: adminCommands.map((command) => ({
    title: `${command.name} ${command.optionsStr || ''}`,
    description: command.description,
  })),
};

export const creatorMenu = {
  title: 'Comandos de CREADOR',
  rows: creatorCommands.map((command) => ({
    title: `${command.name} ${command.optionsStr || ''}`,
    description: command.description,
  })),
};

export const getMenu = (role: RoleEnum) => {
  switch (role) {
  case RoleEnum.CREATOR:
    return [creatorMenu, adminMenu, regularUserMenu()];
  case RoleEnum.ADMIN:
    return [adminMenu, regularUserMenu()];
  case RoleEnum.REGULAR:
    return [regularUserMenu()];
  default:
    return [];
  }
};

export const menuMessage = (role: RoleEnum = RoleEnum.REGULAR) => ({
  title: `_*MENÚ DE ${getRoleText(role)}*_`,
  text: 'Abra el menú para ver los comandos disponibles',
  buttonText: 'Ver menú',
  sections: getMenu(role),
});
