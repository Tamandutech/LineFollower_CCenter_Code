import { it, expect, describe } from 'vitest';
import { bleMock } from '../services/ble/index.test';
import { useRobotSystem } from 'src/composables/system';

describe('useRobotSystem', () => {
  describe('pause', () => {
    it('should pause the robot', async () => {
      bleMock.request.mockResolvedValueOnce('OK');
      const { pause } = useRobotSystem(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(pause()).resolves.not.toThrowError();
      expect(bleMock.request).toHaveBeenCalledWith('test', 'test', 'pause');
    });
  });

  describe('resume', () => {
    it('should resume the robot', async () => {
      bleMock.request.mockResolvedValueOnce('OK');
      const { resume } = useRobotSystem(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(resume()).resolves.not.toThrowError();
      expect(bleMock.request).toHaveBeenCalledWith('test', 'test', 'resume');
    });
  });
});
