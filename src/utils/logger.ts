export class Logger {
    public static log(message: string, ...optionalParams: any[]): void {
      console.log(`[LOG]: ${message}`, ...optionalParams);
    }
  
    public static info(message: string, ...optionalParams: any[]): void {
      console.info(`[INFO]: ${message}`, ...optionalParams);
    }
  
    public static warn(message: string, ...optionalParams: any[]): void {
      console.warn(`[WARN]: ${message}`, ...optionalParams);
    }
  
    public static error(message: string, ...optionalParams: any[]): void {
      console.error(`[ERROR]: ${message}`, ...optionalParams);
    }
  
    public static debug(message: string, ...optionalParams: any[]): void {
      console.debug(`[DEBUG]: ${message}`, ...optionalParams);
    }
  }
  