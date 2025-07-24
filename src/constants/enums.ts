export enum RoleEnum {
  REGULAR = 0,
  VIP,
  ADMIN,
  SUPER_ADMIN,
  CREATOR
}

export enum GroupActionEnum {
  ANTI_LINKS = 0,
  WELCOME,
  SHOW_LEAVE,
  ANTI_VIEW_ONCE,
  ANTI_SPAM,
  ANTI_AREA_CODES
}

export enum GroupActionType {
  MESSAGE = 0,
  GROUP_PARTICIPANTS_UPDATE,
}
