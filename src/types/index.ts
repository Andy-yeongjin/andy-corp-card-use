export interface CardTransaction {
  id: string;                 // bkend.ai Document ID
  email: string;              // 업로드한 사용자 이메일
  transactionDate: string;    // 승인 날짜 (YYYY-MM-DD)
  merchantName: string;       // 가맹점명
  amount: number;             // 결제 금액
  purpose?: string;           // 사용 근거
  participants?: string;      // 참석자
  createdAt: string;          // 생성 일시
}

export interface UserProfile {
  id: string;                 // bkend.ai Auth ID
  email: string;
  name: string;
  department: string;
  role: 'admin' | 'user';     // 권한
}

export interface Statistics {
  totalAmount: number;
  transactionCount: number;
  departmentStats: { [dept: string]: number };
}
