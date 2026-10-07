import type { Register } from 'claude-code'
import { register as registerEncoding } from './encoding.ts'
import { register as registerProjectScope } from './project-scope.ts'
import { register as registerSessionRules } from './session-rules.ts'
import { register as registerSourceLint } from './source-lint.ts'

export const register: Register = (on, options) => {
  registerEncoding(on, options)
  registerProjectScope(on, options)
  registerSessionRules(on, options)
  registerSourceLint(on, options)
}
