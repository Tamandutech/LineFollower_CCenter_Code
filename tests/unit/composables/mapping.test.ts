import { it, expect, describe, beforeEach } from 'vitest';
import { type NewRecordDto, useRobotMapping } from 'src/composables/mapping';
import { bleMock } from '../services/ble/index.test';

describe('useRobotMapping', () => {
  describe('hardDeleteRecords', () => {
    it('should delete the records in the flash memory', async () => {
      bleMock.request.mockResolvedValueOnce('OK');
      const { hardDeleteRecords } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(async () => await hardDeleteRecords()).not.toThrowError();
      expect(bleMock.request).toHaveBeenCalledWith(
        'test',
        'test',
        'map_clearFlash'
      );
    });

    it('should throw a RuntimeError if the robot returns an error', () => {
      bleMock.request.mockResolvedValueOnce('ERROR');
      const { hardDeleteRecords } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(hardDeleteRecords()).rejects.toThrowError();
    });
  });

  describe('deleteRecords', () => {
    it('should delete the records in the memory', async () => {
      bleMock.request.mockResolvedValueOnce('OK');
      const { deleteRecords } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(deleteRecords()).resolves.not.toThrowError();
      expect(bleMock.request).toHaveBeenCalledWith('test', 'test', 'map_clear');
    });

    it('should throw a RuntimeError if the robot returns an error', () => {
      bleMock.request.mockResolvedValueOnce('ERROR');
      const { deleteRecords } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(deleteRecords()).rejects.toThrowError();
    });
  });

  describe('addRecord', () => {
    it('should add a record to the mappingRecords', () => {
      const recordDto: NewRecordDto = {
        encMedia: '0',
        time: '0',
        offset: '0',
        trackStatus: '0',
      };
      const { addRecord, mappingRecords } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      addRecord(recordDto);
      expect(mappingRecords.value).toEqual([
        {
          id: '0',
          ...recordDto,
        },
      ]);
    });
  });

  describe('removeRecord', () => {
    it('should remove a record from the mapping records if it exists', () => {
      const recordDto: NewRecordDto = {
        encMedia: '0',
        time: '0',
        offset: '0',
        trackStatus: '0',
      };
      const { addRecord, removeRecord, mappingRecords } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );

      addRecord(recordDto);

      const removed = removeRecord('0');
      expect(mappingRecords.value).toEqual([]);
      expect(removed).toEqual({ id: '0', ...recordDto });
    });

    it('should return null if the record does not exist', () => {
      const { removeRecord } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      const removed = removeRecord('1');
      expect(removed).toEqual(null);
    });
  });

  describe('sendMapping', () => {
    it('should delete current records before sending new ones', async () => {
      const { sendMapping } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );

      const deleteSpy = bleMock.request.mockResolvedValueOnce('OK');

      await sendMapping([]);
      expect(deleteSpy).toHaveBeenCalledWith('test', 'test', 'map_clear');
    });

    it('should send the records in the correct order', async () => {
      const { sendMapping } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );

      const requestMock = bleMock.request.mockResolvedValue('OK');

      await sendMapping([
        {
          id: '0',
          encMedia: '0',
          time: '0',
          offset: '0',
          trackStatus: '0',
        },
        {
          id: '1',
          encMedia: '1',
          time: '1',
          offset: '1',
          trackStatus: '1',
        },
      ]);
      expect(requestMock).toHaveBeenCalledWith(
        'test',
        'test',
        'map_add 0,0,0,0,0;1,1,1,1,1;'
      );
    });
  });

  describe('saveMapping', () => {
    it('should make the robot save the parameters in RAM', () => {
      bleMock.request.mockResolvedValue('OK');
      const { saveMapping } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(saveMapping()).resolves.not.toThrowError();
      expect(bleMock.request).toHaveBeenCalledWith(
        'test',
        'test',
        'map_SaveRuntime'
      );
    });

    it('should throw a RuntimeError if the robot returns an error', () => {
      bleMock.request.mockResolvedValue('ERROR');
      const { saveMapping } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(saveMapping()).rejects.toThrowError();
    });
  });

  describe('fetchMapping', () => {
    beforeEach(() => {
      bleMock.request.mockResolvedValue(
        '0,0,0,0,0\n1,1,1,1,1\n2,-2,-2,-2,-2\n'
      );
    });

    it('should fetch the mapping records from RAM', async () => {
      const { fetchMapping } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      await fetchMapping(true);
      expect(bleMock.request).toHaveBeenCalledWith(
        'test',
        'test',
        'map_getRuntime'
      );
    });

    it('should fetch the mapping records from flash memory', async () => {
      const { fetchMapping } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      await fetchMapping(false);
      expect(bleMock.request).toHaveBeenCalledWith('test', 'test', 'map_get');
    });

    it('should parse the mapping records correctly', async () => {
      const { fetchMapping, mappingRecords } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      await fetchMapping(false);
      expect(mappingRecords.value).toEqual<Robot.MappingRecord[]>([
        {
          id: '0',
          encMedia: '0',
          time: '0',
          offset: '0',
          trackStatus: '0',
        },
        {
          id: '1',
          encMedia: '1',
          time: '1',
          offset: '1',
          trackStatus: '1',
        },
        {
          id: '2',
          encMedia: '-2',
          time: '-2',
          offset: '-2',
          trackStatus: '-2',
        },
      ]);
    });

    it('should throw a RuntimeError if the robot returns an error', () => {
      bleMock.request.mockResolvedValue(1);
      const { fetchMapping } = useRobotMapping(
        bleMock as Bluetooth.BLEInterface,
        'test',
        'test'
      );
      expect(fetchMapping(true)).rejects.toThrowError();
    });
  });
});
