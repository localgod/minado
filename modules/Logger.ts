import chalk from 'chalk';
/**
 * Object for terminal logging
 */
export default class Logger {

  private log: any;

  /**
   * Contruct logger object
   * @constructor
   */
  constructor() {
    this.log = console.log;
  }
  /**
   * Log error
   * @param {string} message - Error message
   */
  error(message: string): void {
    this.log(chalk.red.bold(message));
  }
  /**
   * Log warning
   * @param {string} message - Warn message
   */
  warn(message: string):void {
    this.log(chalk.yellow.bold(message));
  }
  /**
   * Log info
   * @param {string} message - Info message
   */
  info(message: string):void {
    this.log(chalk.green.bold(message));
  }
}
