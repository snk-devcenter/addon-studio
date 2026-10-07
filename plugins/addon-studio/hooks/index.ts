import type { Register } from 'claude-code'
import { register as registerEncoding } from './encoding.ts'
import { register as registerProjectScope } from './project-scope.ts'

export const register: Register = (on, options) => {
  registerEncoding(on, options)
  registerProjectScope(on, options)
}
