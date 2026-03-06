import { bkendFetch } from "./client";

export const bkendAuth = {
  /**
   * 이메일/비밀번호 로그인
   */
  login: async (email: string, password: string) => {
    return bkendFetch("/auth/email/signin", {
      method: "POST",
      body: JSON.stringify({ email, password, method: "password" }),
    });
  },

  /**
   * 토큰 갱신 (Refresh Token 사용)
   */
  refreshToken: async (refreshToken: string) => {
    return bkendFetch("/auth/token/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  },

  /**
   * 현재 내 정보 조회
   */
  getMe: async (token: string) => {
    return bkendFetch("/auth/me", {
      token,
    });
  },

  /**
   * 세션 폐기 (로그아웃)
   */
  logout: async (token: string) => {
    return bkendFetch("/auth/session/revoke", {
      method: "POST",
      token,
    });
  }
};
