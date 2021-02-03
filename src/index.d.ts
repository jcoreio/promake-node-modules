import Promake from 'promake'
import HashRule from 'promake/HashRule'

export default function nodeModulesRule(options: {
  promake: Promake
  projectDir?: null | string
  command: string
  args?: null | readonly string[]
  before?: null | (() => unknown)
  additionalFiles?: null | readonly string[]
}): HashRule
