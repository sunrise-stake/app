const isString = (v): boolean => typeof v === 'string' || v instanceof String

const base58Reg = /^[A-HJ-NP-Za-km-z1-9]*$/
const isBase58 = (str): boolean => isString(str) && base58Reg.test(str)

const toShortBase58 = (str: string): string => `${str.slice(0, 4)}…${str.slice(-4)}`
const toTimestamp = (ds: string): number => new Date(ds).getTime()

const addUp = (key, arr: Array<number>) => arr.reduce((acc, val) => acc + val[key], 0)
const round = (number: number, decimals: number = 2) => parseFloat(number.toFixed(decimals))

export {
  addUp,
  isBase58,
  isString,
  round,
  toShortBase58,
  toTimestamp,
}