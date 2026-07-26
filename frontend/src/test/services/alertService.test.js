import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../../services/api';
import { deleteAlertArea, listAlertAreas, saveAlertArea } from '../../services/alertService';

describe('alertService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists alert areas from the protected endpoint', async () => {
    const areas = [{ id: 'a1', type: 'INSEGURA' }];
    api.get.mockResolvedValue({ data: areas });

    await expect(listAlertAreas()).resolves.toEqual(areas);
    expect(api.get).toHaveBeenCalledWith('/alertas');
  });

  it('creates and updates alert areas with the provided payload', async () => {
    const payload = {
      minX: 1, minY: 2, maxX: 4, maxY: 6,
      type: 'CONSTRUCAO', description: 'Obras',
    };
    api.post.mockResolvedValue({ data: { id: 'a1', ...payload } });
    api.put.mockResolvedValue({ data: { id: 'a1', ...payload, description: 'Atualizada' } });

    await saveAlertArea(null, payload);
    await saveAlertArea('a1', { ...payload, description: 'Atualizada' });

    expect(api.post).toHaveBeenCalledWith('/alertas', payload);
    expect(api.put).toHaveBeenCalledWith('/alertas/a1', { ...payload, description: 'Atualizada' });
  });

  it('deletes an alert area by id', async () => {
    api.delete.mockResolvedValue({});

    await deleteAlertArea('a1');

    expect(api.delete).toHaveBeenCalledWith('/alertas/a1');
  });
});
