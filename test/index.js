// @flow

import {describe, it} from 'mocha'
import {exec} from 'promisify-child-process'
import {expect} from 'chai'
import fs from 'fs-extra'
import touch from 'touch'
import path from 'path'
import promisify from 'es6-promisify'

async function getMTime(file: string): Promise<number> {
  return (await promisify(fs.stat)(file)).mtime.getTime()
}

const cwd = path.resolve(__dirname, 'integration')
const packageJsonFile = path.resolve(cwd, 'package.json')
const nodeModulesDir = path.resolve(cwd, 'node_modules')

describe('nodeModulesRecipe', function () {
  this.timeout(15 * 60000)

  it('installs when necessary', async function (): Promise<void> {
    await fs.remove(nodeModulesDir)
    const {stdout, stderr} = await exec(`babel-node promake node_modules`, {cwd})
    console.log(stdout, stderr) // eslint-disable-line no-console
    expect(stderr).not.to.match(/^\[promake\] Nothing to be done for node_modules$/m)
    expect(await getMTime(nodeModulesDir)).not.to.be.below(await getMTime(packageJsonFile))
  })
  it("doesn't install when unnecessary", async function (): Promise<void> {
    await exec(`npm i --ignore-scripts`, {cwd})
    await touch(packageJsonFile, {time: Date.now() - 60000})
    await touch(path.resolve(nodeModulesDir, 'lodash.omit'), {time: Date.now()})
    await touch(nodeModulesDir, {time: Date.now() - 120000})
    const {stdout, stderr} = await exec(`babel-node promake node_modules`, {cwd})
    console.log(stdout, stderr) // eslint-disable-line no-console
    expect(stderr).to.match(/^\[promake\] Nothing to be done for node_modules$/m)
  })
})
