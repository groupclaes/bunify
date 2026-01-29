export class EnvUtils {
  /**
   * Check if an environment variable is a valid boolean config
   * '1' or 'true' (case-insensitive)
   * @param variable Variable name
   * @returns true if the environment variable is either '1' or 'true' (case-insensitve)
   */
  static getEnvBoolean(variable: string | string[]): boolean | undefined {
    if (!Array.isArray(variable)) {
      return !!(process.env[variable] && process.env[variable].length > 0 && (process.env[variable]?.toLowerCase() === 'true' || process.env[variable] === '1'))
    }

    for (const envVar of variable) {
      if (process.env[envVar])
        return !!(process.env[envVar].length > 0 && (process.env[envVar]?.toLowerCase() === 'true' || process.env[envVar] === '1'))
    }

    return false
  }

  /**
   * Compare a variable to the expected value (case insensitive)
   * @param variable Variable name
   * @param expectedValue Expected value to compare to
   * @returns 
   */
  static envEquals(variable: string | string[], expectedValue: string): boolean {
    if (!Array.isArray(variable)) {
      return process.env[variable]?.toLowerCase() === expectedValue.toLowerCase()
    }

    for (const envVar of variable) {
      if (process.env[envVar]?.toLowerCase() === expectedValue.toLowerCase())
        return true
    }

    return false
  }
}