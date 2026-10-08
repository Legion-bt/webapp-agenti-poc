import { store } from '../lib/store';
import { Commission } from '../types';

export interface CommissionSummary {
  accruedMonth: number;
  accruedYtd: number;
  payable: number;
  paidYtd: number;
  commissionsList: Commission[];
}

export class CommissionService {
  public getCommissions(): Commission[] {
    const state = store.getState();
    const currentProfile = state.profiles.find((p) => p.id === state.currentProfileId);

    let list = state.commissions;
    if (currentProfile?.role !== 'HQ_SUPERADMIN') {
      list = list.filter((c) => c.orgId === state.activeOrgId);
    }
    if (currentProfile?.role === 'AGENT' && currentProfile.agentId) {
      list = list.filter((c) => c.salesAgentId === currentProfile.agentId);
    }

    return list.sort((a, b) => new Date(b.accruedDate).getTime() - new Date(a.accruedDate).getTime());
  }

  public getSummary(): CommissionSummary {
    const list = this.getCommissions();
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let accruedMonth = 0;
    let accruedYtd = 0;
    let payable = 0;
    let paidYtd = 0;

    list.forEach((c) => {
      accruedYtd += c.amount;
      if (c.accruedDate.startsWith(currentMonthPrefix)) {
        accruedMonth += c.amount;
      }
      if (c.status === 'PAYABLE') {
        payable += c.amount;
      }
      if (c.status === 'PAID') {
        paidYtd += c.amount;
      }
    });

    return {
      accruedMonth: Math.round(accruedMonth * 100) / 100,
      accruedYtd: Math.round(accruedYtd * 100) / 100,
      payable: Math.round(payable * 100) / 100,
      paidYtd: Math.round(paidYtd * 100) / 100,
      commissionsList: list,
    };
  }
}

export const commissionService = new CommissionService();
