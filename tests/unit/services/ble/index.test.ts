import { describe, vi } from 'vitest';

export const bleMock: MockType<Bluetooth.BLEInterface> = {
  name: 'mock',
  request: vi.fn(),
  send: vi.fn(),
  addTxObserver: vi.fn(),
  removeTxObserver: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

describe.skip('RobotBLEAdapter', () => {
  return;
});
