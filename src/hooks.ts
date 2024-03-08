import { SetHookFlags, calculateHookOn } from '@transia/xrpl'
import sha512Half from '@transia/xrpl/dist/npm/utils/hashes/sha512Half'
import { SetHookParams, Xrpld, clearAllHooksV3, clearHookStateV3, hexNamespace, iHook, readHookBinaryHexFromNS, setHooksV3 } from '@transia/hooks-toolkit'
import {
  XrplIntegrationTestContext,
  serverUrl,
  setupClient,
  teardownClient,
} from '@transia/hooks-toolkit/dist/npm/src/libs/xrpl-helpers'
import { HookDefinition } from '@transia/xrpl/dist/npm/models/ledger'

export const hooks = async (filename: string) => {
  const testContext = await setupClient(serverUrl)
  try {
    const hookBinaryHex = readHookBinaryHexFromNS(filename)
    const hook = {
      CreateCode: hookBinaryHex,
      Flags: SetHookFlags.hsfOverride,
      HookOn: calculateHookOn(['Invoke']),
      HookNamespace: hexNamespace('namespace'),
      HookApiVersion: 0,
    } as iHook
    await setHooksV3({
      client: testContext.client,
      seed: testContext.alice.seed,
      hooks: [{ Hook: hook }],
    } as SetHookParams)
    const hookHash = sha512Half(hookBinaryHex).toUpperCase()
    const definitionIndex = sha512Half(`0044${hookHash}`).toUpperCase()
    const response = await testContext.client.request({
      command: 'ledger_entry',
      index: definitionIndex,
    })
    const hookDefinition = (response.result.node as HookDefinition)
    const fee = hookDefinition.Fee || '0'
    const callbackFee = hookDefinition.HookCallbackFee?.toString()
    return { deployFee: (hookBinaryHex.length / 2).toString(), executionFee: fee, callbackFee, hookHash }
  } catch (e) {
    // biome-ignore lint/complexity/noUselessCatch: <explanation>
    throw e
  } finally {
    const clearHook = {
      Flags: SetHookFlags.hsfNSDelete,
      HookNamespace: hexNamespace('namespace'),
    } as iHook
    await clearHookStateV3({
      client: testContext.client,
      seed: testContext.alice.seed,
      hooks: [{ Hook: clearHook }],
    } as SetHookParams)
    await clearAllHooksV3({
      client: testContext.client,
      seed: testContext.alice.seed,
    } as SetHookParams)
    await teardownClient(testContext)
  }
}
