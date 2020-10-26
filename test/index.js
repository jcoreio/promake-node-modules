import Promake from 'promake'
import fs from 'fs-extra'
import nodeModulesRule from '../src/index.js'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import path from 'path'

const projectDir = path.resolve(__dirname, 'fixture')
const fixture = (...p) => path.join(projectDir, ...p)

let runCount = 0
beforeEach(async () => {
  runCount = 0
  console.log('removing', projectDir) // eslint-disable-line no-console
  await fs.remove(projectDir)
  await fs.mkdirs(projectDir)
})

describe(`without additionalFiles`, function () {
  const promake = new Promake()
  const rule = nodeModulesRule({
    promake,
    projectDir,
    command: 'yarn',
    before: () => runCount++,
  })
  const task = promake.task('deps', [rule])

  it(`doesn't rerun if deps haven't changed`, async function () {
    this.timeout(10000)
    const packageJson = {
      name: 'temp',
      private: true,
      dependencies: {
        lodash: '^4.0.0',
      },
    }
    await fs.writeJson(fixture('package.json'), packageJson)
    await rule
    expect(await fs.exists(fixture('node_modules', 'lodash'))).to.be.true
    expect(runCount).to.equal(1)

    packageJson.foo = 'bar' // this shouldn't affect it
    await fs.writeJson(fixture('package.json'), packageJson)
    await task // make sure the task wrapper works
    expect(runCount).to.equal(1)
  })
  it(`doesn't rerun if additional files haven't changed`, async function () {
    this.timeout(10000)
    const packageJson = {
      name: 'temp',
      private: true,
      dependencies: {
        lodash: '^4.0.0',
      },
    }
    await fs.writeJson(fixture('package.json'), packageJson)
    await rule
    expect(await fs.exists(fixture('node_modules', 'lodash'))).to.be.true
    expect(runCount).to.equal(1)

    packageJson.foo = 'bar' // this shouldn't affect it
    await fs.writeJson(fixture('package.json'), packageJson)
    await rule
    expect(runCount).to.equal(1)
  })
  it(`reruns if deps changed`, async function () {
    this.timeout(10000)
    const packageJson = {
      name: 'temp',
      private: true,
      dependencies: {
        lodash: '^4.0.0',
      },
    }
    await fs.writeJson(fixture('package.json'), packageJson)
    await rule
    expect(await fs.exists(fixture('node_modules', 'lodash'))).to.be.true
    expect(runCount).to.equal(1)

    packageJson.dependencies.lodash = '^4.1.0'
    await fs.writeJson(fixture('package.json'), packageJson)
    await rule
    expect(runCount).to.equal(2)
  })
  it(`waits for another install if it's running`, async function () {
    this.timeout(10000)
    const packageJson = {
      name: 'temp',
      private: true,
      dependencies: {
        lodash: '^4.0.0',
      },
    }
    await fs.writeJson(fixture('package.json'), packageJson)

    const promake2 = new Promake()
    const rule2 = nodeModulesRule({
      promake: promake2,
      projectDir,
      command: 'yarn',
      before: () => runCount++,
    })

    await Promise.all([rule, rule2])
  })
  it(`reruns if resolutions changed`, async function () {
    this.timeout(10000)
    const packageJson = {
      name: 'temp',
      private: true,
      dependencies: {
        lodash: '^4.0.0',
      },
    }
    await fs.writeJson(fixture('package.json'), packageJson)
    await rule
    expect(await fs.exists(fixture('node_modules', 'lodash'))).to.be.true
    expect(runCount).to.equal(1)

    packageJson.resolutions = { lodash: '4.0.0' }
    await fs.writeJson(fixture('package.json'), packageJson)
    await rule
    expect(runCount).to.equal(2)
  })
})
describe(`with additionalFiles`, function () {
  const promake = new Promake()
  const rule = nodeModulesRule({
    promake,
    projectDir,
    command: 'yarn',
    before: () => runCount++,
    additionalFiles: [fixture('yarn.lock')],
  })

  it(`doesn't rerun if deps haven't changed`, async function () {
    this.timeout(10000)
    const packageJson = {
      name: 'temp',
      private: true,
      dependencies: {
        lodash: '^4.0.0',
      },
    }
    await fs.writeJson(fixture('package.json'), packageJson)
    await rule
    expect(await fs.exists(fixture('node_modules', 'lodash'))).to.be.true
    expect(runCount).to.equal(1)

    await rule
    expect(runCount).to.equal(2) // ran again because yarn.lock got created

    packageJson.foo = 'bar' // this shouldn't affect it
    await fs.writeJson(fixture('package.json'), packageJson)
    await rule
    expect(runCount).to.equal(2)
  })
})
