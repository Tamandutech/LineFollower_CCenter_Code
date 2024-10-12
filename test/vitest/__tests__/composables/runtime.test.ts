import { beforeEach, it, expect, describe } from 'vitest';
import { bleMock } from '../services/ble/index.test';
import { useRobotRuntime } from 'src/composables/runtime';

describe('useRobotRuntime', () => {
  describe('fetchParameters', () => {
    beforeEach(() => {
      bleMock.request.mockResolvedValueOnce(
        'Dados em tempo de execução registrados: 19\n' +
          ' 0 - sLatMarks.thresholdToCurve: 3\n' +
          ' 1 - sLatMarks.thresholdToStraight: 3\n' +
          ' 2 - sLatMarks.thresholdToStop: 3\n',
      );
    });

    it('should fetch the runtime parameters from the robot', async () => {
      const { fetchParameters } = useRobotRuntime(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test',
      );
      expect(fetchParameters()).resolves.not.toThrowError();
      expect(bleMock.request).toHaveBeenCalledWith(
        'test',
        'test',
        'runtime_list',
      );
    });

    it('should store the runtime parameters in the parameters state', async () => {
      const { fetchParameters, parameters } = useRobotRuntime(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test',
      );
      await fetchParameters();
      expect(parameters.value.get('sLatMarks.thresholdToCurve')).toBe(3);
      expect(parameters.value.get('sLatMarks.thresholdToStraight')).toBe(3);
      expect(parameters.value.get('sLatMarks.thresholdToStop')).toBe(3);
    });
  });
});
