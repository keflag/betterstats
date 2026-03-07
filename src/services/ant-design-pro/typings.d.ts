/**
 * @fileName typings.d.ts
 * @description 全局类型定义 - 对接后端 API 数据结构
 * @author keflag
 * @createDate 2026-03-07
 * @lastUpdateDate 2026-03-07
 * @version 1.0.0
 */

declare namespace API {
  type UserInfo = {
    uuid: string;
    username: string;
    email?: string;
    role: string;
    realName?: string;
    avatarUrl?: string;
    schoolUuid?: string;
    studentId?: string;
    classInfo?: string;
  };

  type CurrentUser = {
    uuid?: string;
    username?: string;
    name?: string;
    avatar?: string;
    email?: string;
    role?: string;
    schoolUuid?: string;
  };

  type LoginParams = {
    username: string;
    password: string;
    rememberDevice?: boolean;
    autoLogin?: boolean;
    type?: string;
  };

  type LoginResult = {
    success: boolean;
    data?: {
      user: UserInfo;
      token: string;
      refreshToken: string;
      deviceToken?: string;
      expiresIn: number;
    };
    message?: string;
    status?: string;
    type?: string;
    currentAuthority?: string;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type ErrorResponse = {
    errorCode: string;
    errorMessage?: string;
    success?: boolean;
  };

  type RuleListItem = {
    key?: number;
    disabled?: boolean;
    href?: string;
    avatar?: string;
    name?: string;
    owner?: string;
    desc?: string;
    callNo?: number;
    status?: number;
    updatedAt?: string;
    createdAt?: string;
    progress?: number;
  };

  type RuleList = {
    data?: RuleListItem[];
    total?: number;
    success?: boolean;
  };

  type NoticeIconItemType = 'notification' | 'message' | 'event';

  type NoticeIconItem = {
    id?: string;
    extra?: string;
    key?: string;
    read?: boolean;
    avatar?: string;
    title?: string;
    status?: string;
    datetime?: string;
    description?: string;
    type?: NoticeIconItemType;
  };

  type NoticeIconList = {
    data?: NoticeIconItem[];
    total?: number;
    success?: boolean;
  };
}
