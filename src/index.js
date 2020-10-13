// @flow

import path from 'path'
import type Promake from 'promake'
import type HashRule from 'promake/HashRule'
import { type Resource } from 'promake/Resource'
import { type HashResource } from 'promake/HashResource'
import FileResource from 'promake/FileResource'
import { promisify } from 'util'
import fs from 'fs'
import emitted from 'p-event'

class DependenciesHashResource implements Resource, HashResource {
  projectDir: string
  packageJsonFile: FileResource
  additionalFiles: Array<FileResource>

  constructor(
    projectDir: string,
    { additionalFiles }: { additionalFiles?: ?$ReadOnlyArray<string> } = {}
  ) {
    this.projectDir = projectDir
    this.packageJsonFile = new FileResource(
      path.join(projectDir, 'package.json')
    )
    this.additionalFiles = (additionalFiles || []).map(
      (file) => new FileResource(file)
    )
  }

  async updateHash(hash: crypto$Hash) {
    const { dependencies, devDependencies, resolutions } = JSON.parse(
      await promisify(fs.readFile)(
        path.join(this.projectDir, 'package.json'),
        'utf8'
      )
    )
    hash.update(JSON.stringify({ dependencies, devDependencies, resolutions }))
    for (const resource of this.additionalFiles) {
      const stream = fs.createReadStream(resource.file)
      await Promise.all([
        emitted(stream, 'end'),
        stream.pipe(hash, { end: false }),
      ]).catch((err: Error) => {
        if ((err: any).code !== 'ENOENT') throw err
      })
    }
  }

  toString(): string {
    return `${path.relative(
      process.cwd(),
      path.resolve(this.projectDir, 'node_modules')
    )}`
  }

  async lastModified(): Promise<?number> {
    const timestamps = await Promise.all([
      this.packageJsonFile.lastModified(),
      ...this.additionalFiles.map((r) => r.lastModified()),
    ])
    if (timestamps.findIndex((t) => !Number.isFinite(t))) return 0
    return Math.max(...(timestamps: any))
  }
}

export default function nodeModulesRule({
  promake,
  projectDir: _projectDir,
  command,
  args,
  before,
  additionalFiles,
}: $ReadOnly<{
  promake: Promake,
  projectDir?: ?string,
  command: string,
  args?: ?$ReadOnlyArray<string>,
  before?: ?() => mixed,
  additionalFiles?: ?$ReadOnlyArray<string>,
}> = {}): HashRule {
  const projectDir = _projectDir || process.cwd()
  const resource = new DependenciesHashResource(projectDir, { additionalFiles })
  return promake.hashRule(
    'md5',
    path.join(projectDir, 'node_modules', '.cache', 'promake-node-modules.md5'),
    [resource],
    async (rule: HashRule) => {
      if (before) before()
      await promake.spawn(
        command || 'npm',
        [...(args || ['install']), ...rule.args],
        {
          cwd: projectDir,
        }
      )
      await promisify(fs.mkdir)(
        path.join(projectDir, 'node_modules', '.cache')
      ).catch((err: Error) => {
        if ((err: any).code !== 'EEXIST') throw err
      })
    },
    { runAtLeastOnce: true }
  )
}
