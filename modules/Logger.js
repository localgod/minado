'use strict';
import chalk from 'chalk';
/**
 * Object for terminal logging
 */
export default class Logger {
  /**
   * Contruct logger object
   * @constructor
   */
  constructor() {
    this.log = console.log;
    this.chalk = chalk;
  }
  /**
   * Log error
   * @param {string} message - Error message
   */
  error(message) {
    this.log(this.chalk.red.bold(message));
  }
  /**
   * Log warning
   * @param {string} message - Warn message
   */
  warn(message) {
    this.log(this.chalk.yellow.bold(message));
  }
  /**
   * Log info
   * @param {string} message - Info message
   */
  info(message) {
    this.log(this.chalk.green.bold(message));
  }
};
