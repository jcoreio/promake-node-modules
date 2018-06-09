// @flow

import path from 'path'
import Promake from 'promake'
import type {Resource} from 'promake'
import type Rule from 'promake/lib/Rule'
import fs from 'fs'
import promisify from 'es6-promisify'
import _glob from 'glob'
import touch from 'touch'

const {VERBOSITY} = Promake

const glob = promisify(_glob)
const stat = promisify(fs.stat)

async function lastModified(file: string): Promise<?number> {
  try {
    const {mtimeMs, mtime} = await stat(file)
    return mtimeMs != null ? mtimeMs : mtime.getTime()
  } catch (err) {
    if (err.code === 'ENOENT') return null
    throw err
  }
}

function nodeModulesRecipe(installNodeModules: (rule: Rule) => ?Promise<any>): (rule: Rule) => ?Promise<any> {
  return async function installNodeModulesIfNecessary(rule: Rule): Promise<any> {
    const log = rule ? rule.promake.log : (...args: Array<any>) => {}

    const {targets, prerequisites} = rule
    if (targets.length > 1) throw new Error('there must be only one target (the node_modules directory)')
    const target = targets[0]
    const targetDir = (target: any).file
    if (typeof targetDir !== 'string') throw new Error('target must have a `file` property that is the node_modules directory')

    const packages = [...await glob(path.join(targetDir, '*')), ...await glob(path.join(targetDir, '@*', '*'))]
    if (packages.length) {
      const packageMtimes = await Promise.all(packages.map(lastModified))
      const prerequisiteMtimes = await Promise.all(prerequisites.map(
        async (prerequisite: Resource): Promise<number> => {
          const mtime = await prerequisite.lastModified()
          return mtime != null ? mtime : -Infinity
        }
      ))
      const maxPackageMtime = Math.max(...packageMtimes)
      const maxPrerequisiteMtime = Math.max(...prerequisiteMtimes)

      if (maxPackageMtime > maxPrerequisiteMtime) {
        log(VERBOSITY.DEFAULT, `Nothing to be done for ${path.relative(process.cwd(), targetDir)}`)
        return
      }
    }

    await installNodeModules(rule)
    await touch(targetDir)
  }
}
exports.nodeModulesRecipe = nodeModulesRecipe
