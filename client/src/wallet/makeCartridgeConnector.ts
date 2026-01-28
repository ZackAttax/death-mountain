import { Capacitor } from '@capacitor/core';
import ControllerConnector from '@cartridge/connector/controller';
import SessionConnector from '@cartridge/connector/session';
import { ChainId, getNetworkConfig } from '@/utils/networkConfig';
import { stringToFelt } from '@/utils/utils';

export function makeCartridgeConnector() {
  const platform = Capacitor.getPlatform();
  const controllerConfig = getNetworkConfig(ChainId.SN_MAIN);

  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'makeCartridgeConnector.ts:makeCartridgeConnector',message:'Creating connector',data:{platform},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Web platform: use ControllerConnector (existing behavior)
  if (platform === 'web') {
    const connector = typeof window !== 'undefined'
      ? new ControllerConnector({
          policies: controllerConfig.policies,
          namespace: controllerConfig.namespace,
          slot: controllerConfig.slot,
          preset: controllerConfig.preset,
          chains: controllerConfig.chains,
          defaultChainId: stringToFelt(controllerConfig.chainId).toString(),
        })
      : null;
    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'makeCartridgeConnector.ts:makeCartridgeConnector',message:'Created ControllerConnector',data:{connectorId:connector?.id,connectorType:connector?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return connector;
  }

  // Native platforms (iOS/Android): use SessionConnector
  const redirectUrl = 'com.deathmountain.loot-survivor-2://open';
  const sessionConnector = new SessionConnector({
    policies: controllerConfig.policies,
    rpc: controllerConfig.rpcUrl,
    chainId: 'SN_MAINNET',
    redirectUrl: redirectUrl,
    disconnectRedirectUrl: redirectUrl,
    signupOptions: ["google", "discord", "webauthn", "password"],
  } as any);
  // #region agent log
  fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'makeCartridgeConnector.ts:makeCartridgeConnector',message:'Created SessionConnector',data:{connectorId:sessionConnector?.id,connectorType:sessionConnector?.constructor?.name,platform},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  return sessionConnector;
}
