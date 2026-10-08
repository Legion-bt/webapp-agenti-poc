import { store } from '../lib/store';
import { Visit } from '../types';

export class VisitService {
  public getVisits(): Visit[] {
    const state = store.getState();
    const currentProfile = state.profiles.find((p) => p.id === state.currentProfileId);

    let list = state.visits;
    if (currentProfile?.role !== 'HQ_SUPERADMIN') {
      list = list.filter((v) => v.orgId === state.activeOrgId);
    }
    if (currentProfile?.role === 'AGENT' && currentProfile.agentId) {
      list = list.filter((v) => v.salesAgentId === currentProfile.agentId);
    }

    return list.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
  }

  public recordVisit(visitData: Omit<Visit, 'id' | 'createdAt'>): Visit {
    const newVisit: Visit = {
      ...visitData,
      id: 'vis-' + Date.now(),
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    store.setState((prev) => ({
      ...prev,
      visits: [newVisit, ...prev.visits],
    }));

    return newVisit;
  }
}

export const visitService = new VisitService();
