import fs from 'fs'
import * as core from '@actions/core'
const { buildDir } = require('c2wasm-cli')
import { hooks } from './hooks'

async function run(): Promise<void> {
  try {
    const hook_c_dir = core.getInput('inPath')
    if (!fs.existsSync(hook_c_dir)) {
      throw new Error('inPath does not exist')
    }

    await buildDir(hook_c_dir, "build")
    await new Promise((resolve) => setTimeout(resolve, 100))

    const wasmFiles = fs.readdirSync("build")
      .filter((file) => file.endsWith('.wasm'))
      .map((file) => file.replace(".wasm", ""))

    const outputs: string[][] = []

    for (let i = 0; i < wasmFiles.length; i++) {
      const wasmFile = wasmFiles[i]
      const result = await hooks(wasmFile)
      core.info(`File: ${wasmFile}`)
      core.info(`Deploy Fee: ${result.deployFee}`)
      core.info(`Execution Fee: ${result.executionFee}`)
      core.info(`Callback Fee: ${result.callbackFee || '-'}`)
      core.info(`HookHash: ${result.hookHash}`)
      outputs.push([wasmFile, result.deployFee, result.executionFee, result.callbackFee || '-', result.hookHash])
    }
    core.summary
      .addHeading("Hook Info")
      .addTable([
        [{ data: 'File', header: true }, { data: 'Deploy Fee', header: true }, { data: 'Execution Fee', header: true }, { data: 'Callback Fee', header: true }, { data: 'HookHash', header: true }],
        ...outputs.map((output) => [output[0], output[1], output[2], output[3], output[4]]),
      ])
      .write()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
