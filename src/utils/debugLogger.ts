import AsyncStorage from '@react-native-async-storage/async-storage';
import { DebugLog } from '../types';

const MAX_LOGS = 500;
const STORAGE_KEY = 'DEBUG_LOGS';

export class DebugLogger {
  private module: string;
  private static logs: DebugLog[] = [];

  constructor(module: string) {
    this.module = module;
  }

  private createLog(level: DebugLog['level'], message: string, data?: any): DebugLog {
    return {
      timestamp: Date.now(),
      level,
      message: `[${this.module}] ${message}`,
      data,
    };
  }

  info(message: string, data?: any): void {
    const log = this.createLog('INFO', message, data);
    DebugLogger.addLog(log);
    console.log(`ℹ️ ${log.message}`, data || '');
  }

  debug(message: string, data?: any): void {
    const log = this.createLog('DEBUG', message, data);
    DebugLogger.addLog(log);
    console.debug(`🔍 ${log.message}`, data || '');
  }

  warn(message: string, data?: any): void {
    const log = this.createLog('WARN', message, data);
    DebugLogger.addLog(log);
    console.warn(`⚠️ ${log.message}`, data || '');
  }

  error(message: string, data?: any): void {
    const log = this.createLog('ERROR', message, data);
    DebugLogger.addLog(log);
    console.error(`❌ ${log.message}`, data || '');
  }

  private static addLog(log: DebugLog): void {
    DebugLogger.logs.push(log);
    if (DebugLogger.logs.length > MAX_LOGS) {
      DebugLogger.logs = DebugLogger.logs.slice(-MAX_LOGS);
    }
    this.persistLogs();
  }

  static getLogs(): DebugLog[] {
    return DebugLogger.logs;
  }

  static clearLogs(): void {
    DebugLogger.logs = [];
    AsyncStorage.removeItem(STORAGE_KEY);
  }

  static exportLogs(): string {
    return JSON.stringify(DebugLogger.logs, null, 2);
  }

  private static async persistLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DebugLogger.logs));
    } catch (error) {
      console.error('Failed to persist logs', error);
    }
  }

  static async loadPersistedLogs(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        DebugLogger.logs = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load persisted logs', error);
    }
  }
}
