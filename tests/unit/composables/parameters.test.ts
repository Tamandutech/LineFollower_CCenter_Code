import { afterEach, it, expect, describe, vi, beforeEach } from 'vitest';
import { bleMock } from '../services/ble/index.test';
import { useRobotParameters } from 'src/composables/parameters';

describe('useRobotParameters', () => {
  describe('getParameter', () => {
    it('should get the parameters from the robot', async () => {
      bleMock.request.mockResolvedValueOnce('42');
      const { getParameter } = useRobotParameters(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(getParameter('class', 'parameter')).resolves.not.toThrowError();
      expect(bleMock.request).toHaveBeenCalledWith(
        'test',
        'test',
        'param_get class.parameter'
      );
    });
  });

  describe('setParameter', () => {
    it('should set the parameters from the robot', async () => {
      bleMock.request.mockResolvedValueOnce('OK');
      const { setParameter } = useRobotParameters(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(
        setParameter('class', 'parameter', 'value')
      ).resolves.not.toThrowError();
      expect(bleMock.request).toHaveBeenCalledWith(
        'test',
        'test',
        'param_set class.parameter value'
      );
    });

    it('should throw a RuntimeError if the robot returns an error', () => {
      bleMock.request.mockResolvedValueOnce('ERROR');
      const { setParameter } = useRobotParameters(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(
        setParameter('class', 'parameter', 'value')
      ).rejects.toThrowError();
    });

    it('should not set the parameter if its value is the same', async () => {
      bleMock.request.mockResolvedValueOnce('42');
      const { setParameter, getParameter } = useRobotParameters(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      await getParameter('class', 'parameter');
      await setParameter('class', 'parameter', '42');
      expect(bleMock.request).toHaveBeenCalledTimes(1);
    });
  });

  describe('listParameters', () => {
    beforeEach(() => {
      bleMock.request.mockResolvedValueOnce(
        'Dados parametrizados registrados: 69\n' +
          ' 0 - sLatMarks.marks: 0,45,100,123,566,0,5,2\n' +
          ' 1 - sLatMarks.thresholdToCurve: 3\n' +
          ' 2 - sLatMarks.thresholdToStraight: 3\n' +
          ' 3 - sLatMarks.thresholdToStop: 3\n'
      );
    });

    it('should list the parameters from the robot', async () => {
      const { listParameters } = useRobotParameters(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(listParameters()).resolves.not.toThrowError();
      expect(bleMock.request).toHaveBeenCalledWith(
        'test',
        'test',
        'param_list'
      );
    });

    it('should add the parameters to the dataClasses', async () => {
      const { listParameters, dataClasses } = useRobotParameters(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      await listParameters();
      expect(dataClasses.value.get('sLatMarks').get('marks')).toBe(
        '0,45,100,123,566,0,5,2'
      );
      expect(dataClasses.value.get('sLatMarks').get('thresholdToCurve')).toBe(
        '3'
      );
    });
  });

  describe('installParameters', () => {
    const parametersToInstall: Robot.Parameters = new Map([
      [
        'sLatMarks',
        new Map<string, Robot.ParameterValue>([
          ['marks', '0,45,100,123,566,0,5,2'],
          ['thresholdToCurve', 3],
        ]),
      ],
      [
        'PIDVel',
        new Map<string, Robot.ParameterValue>([
          ['Kp_std', '0.0'],
          ['Ki_std', '0.0'],
        ]),
      ],
    ]);

    it('should install the parameters passed as argument', async () => {
      bleMock.request.mockResolvedValue('OK');
      const { installParameters } = useRobotParameters(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(
        installParameters(parametersToInstall)
      ).resolves.not.toThrowError();
      expect(bleMock.request).toHaveBeenNthCalledWith(
        1,
        'test',
        'test',
        'param_set sLatMarks.marks 0,45,100,123,566,0,5,2'
      );
    });

    it('should throw a RuntimeError if the robot returns an error', () => {
      bleMock.request.mockResolvedValue('ERROR');
      const { installParameters } = useRobotParameters(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(installParameters(parametersToInstall)).rejects.toThrowError();
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });
});
