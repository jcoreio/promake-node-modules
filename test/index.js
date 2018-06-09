// @flow

import {describe, it} from 'mocha'
import {exec} from 'promisify-child-process'
import {expect} from 'chai'
import fs from 'fs-extra'
import touch from 'touch'
import path from 'path'
import promisify from 'es6-promisify'
import delay from 'delay'

async function getMTime(file: string): Promise<number> {
  return (await promisify(fs.stat)(file)).mtime.getTime()
}

const cwd = path.resolve(__dirname, 'integration')
const packageJsonFile = path.resolve(cwd, 'node_modules')
const nodeModulesDir = path.resolve(cwd, 'node_modules')

describe('nodeModulesRecipe', function () {
  this.timeout(15 * 60000)

  it('installs when necessary', async function (): Promise<void> {
    await fs.remove(nodeModulesDir)
    const {stderr} = await exec(`babel-node promake node_modules`, {cwd})
    expect(stderr).not.to.match(/^\[promake\] Nothing to be done for node_modules$/m)
    expect(await getMTime(nodeModulesDir)).not.to.be.below(await getMTime(packageJsonFile))
  })
  it("doesn't install when unnecessary", async function (): Promise<void> {
    await exec(`npm i --ignore-scripts`, {cwd})
    await delay(1000)
    await touch(packageJsonFile, {mtime: true})
    // await delay(100)
    // await touch(path.resolve(nodeModulesDir, 'lodash.omit'), {mtime: true})
    const {stdout, stderr} = await exec(`babel-node promake node_modules`, {cwd})
    console.log(stdout)
    expect(stderr).to.match(/^\[promake\] Nothing to be done for node_modules$/m)
  })
})
