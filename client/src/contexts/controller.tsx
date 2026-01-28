import { useStarknetApi } from "@/api/starknet";
import { useGameTokens } from "@/dojo/useGameTokens";
import { useSystemCalls } from "@/dojo/useSystemCalls";
import { useGameStore } from "@/stores/gameStore";
import { useUIStore } from "@/stores/uiStore";
import { Payment } from "@/types/game";
import { useAnalytics } from "@/utils/analytics";
import { ChainId, NETWORKS } from "@/utils/networkConfig";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { Account, RpcProvider } from "starknet";
import { useDynamicConnector } from "./starknet";
import { delay, stringToFelt } from "@/utils/utils";
import { useDungeon } from "@/dojo/useDungeon";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

export interface ControllerContext {
  account: any;
  address: string | undefined;
  playerName: string;
  isPending: boolean;
  tokenBalances: Record<string, string>;
  goldenPassIds: number[];
  openProfile: () => void;
  login: () => void;
  logout: () => void;
  enterDungeon: (payment: Payment, txs: any[]) => void;
  showTermsOfService: boolean;
  acceptTermsOfService: () => void;
  openBuyTicket: () => void;
  bulkMintGames: (amount: number, callback: () => void) => void;
}

// Create a context
const ControllerContext = createContext<ControllerContext>(
  {} as ControllerContext
);

// Create a provider component
export const ControllerProvider = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const { setShowOverlay } = useGameStore();
  const { account, address, isConnecting } = useAccount();
  const { buyGame } = useSystemCalls();
  const { connector, connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const dungeon = useDungeon();
  const { currentNetworkConfig } = useDynamicConnector();
  const { createBurnerAccount, getTokenBalances, goldenPassReady } =
    useStarknetApi();
  const { getGameTokens } = useGameTokens();
  const { skipIntroOutro } = useUIStore();
  const [burner, setBurner] = useState<Account | null>(null);
  const [userName, setUserName] = useState<string>();
  const [creatingBurner, setCreatingBurner] = useState(false);
  const [tokenBalances, setTokenBalances] = useState({});
  const [goldenPassIds, setGoldenPassIds] = useState<number[]>([]);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [connectionPromise, setConnectionPromise] = useState<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  } | null>(null);
  const { identifyAddress } = useAnalytics();

  const demoRpcProvider = useMemo(
    () => new RpcProvider({ nodeUrl: NETWORKS.WP_PG_SLOT.rpcUrl }),
    []
  );

  useEffect(() => {
    // #region agent log
    const accountDetails = account ? {
      type: typeof account,
      constructor: account?.constructor?.name,
      hasAddress: !!account?.address,
      address: account?.address,
      keys: Object.keys(account || {}).slice(0, 10), // First 10 keys
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(account || {})).slice(0, 10) // First 10 methods
    } : null;
    fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:useEffect[account]',message:'Account state changed',data:{hasAccount:!!account,accountDetails,address,isConnecting,isPending,connectorId:connector?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    if (account) {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:useEffect[account]',message:'Account exists, fetching balances',data:{address:account.address,accountType:account?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      fetchTokenBalances();
      identifyAddress({ address: account.address });

      // Check if terms have been accepted
      const termsAccepted = typeof window !== 'undefined'
        ? localStorage.getItem('termsOfServiceAccepted')
        : null;

      if (!termsAccepted) {
        setShowTermsOfService(true);
      }
    }
  }, [account, address, isConnecting, isPending, connector]);

  useEffect(() => {
    if (
      localStorage.getItem("burner") &&
      localStorage.getItem("burner_version") === "6"
    ) {
      let burner = JSON.parse(localStorage.getItem("burner") as string);
      setBurner(
        new Account({
          provider: demoRpcProvider,
          address: burner.address,
          signer: burner.privateKey,
        })
      );
    } else {
      createBurner();
    }
  }, []);

  // Get username when connector changes
  useEffect(() => {
    const getUsername = async () => {
      try {
        // #region agent log
        const conn = connector as any;
        const connectorShape = conn ? { id: conn.id, name: conn.name, keys: Object.keys(conn).slice(0, 20), constructor: conn?.constructor?.name, hasController: !!conn?.controller, hasUsername: typeof conn?.username === 'function' } : null;
        fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:getUsername',message:'Connector object when getting username',data:{connectorShape},timestamp:Date.now(),sessionId:'debug-session',runId:'run1'})}).catch(()=>{});
        // #endregion
        const name = await (connector as any)?.username();
        if (name) setUserName(name);
      } catch (error) {
        console.error("Error getting username:", error);
      }
    };

    if (connector) getUsername();
  }, [connector]);

  // App resume handler for session retrieval after browser authentication
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:useEffect[resume]',message:'Setting up app resume listener',data:{hasConnectionPromise:!!connectionPromise},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion

    const resumeListener = App.addListener('appStateChange', async (state) => {
      // #region agent log
      fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:appStateChange',message:'App state changed',data:{isActive:state.isActive,hasConnectionPromise:!!connectionPromise},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      if (state.isActive && connectionPromise) {
        // #region agent log
        fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:appStateChange',message:'App resumed with pending connection, retrieving session',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        
        // App resumed, retrieve session from storage
        const sessionConnector = connectors.find(
          (conn) => conn.id === "controller_session" || conn.id?.includes("session")
        );
        
        // #region agent log
        const allConnectorsInfo = connectors.map((c) => ({ id: c.id, name: (c as any).name, keys: Object.keys(c).slice(0, 15), constructor: c?.constructor?.name }));
        fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:appStateChange',message:'All connectors in resume',data:{connectorsCount:connectors.length,allConnectors:allConnectorsInfo,found:!!sessionConnector,sessionConnectorId:sessionConnector?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        
        if (sessionConnector) {
          const sessionConnectorAny = sessionConnector as any;
          if (sessionConnectorAny.controller) {
            sessionConnectorAny.controller.reopenBrowser = false;
            try {
              // #region agent log
              fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:appStateChange',message:'Calling controller.connect() to retrieve session',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
              // #endregion
              // Retrieve session from storage
              const account = await sessionConnectorAny.controller.connect();
              // #region agent log
              const accountInfo = account != null ? { type: typeof account, constructor: account?.constructor?.name, keys: Object.keys(account).slice(0, 25), address: (account as any)?.address, stringified: JSON.stringify(account).slice(0, 500) } : null;
              fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:appStateChange',message:'Session retrieved successfully - account object',data:{hasAccount:!!account,accountAddress:(account as any)?.address,accountInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
              // #endregion
              connectionPromise.resolve(account);
              setConnectionPromise(null);
            } catch (error) {
              // #region agent log
              fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:appStateChange',message:'Error retrieving session',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
              // #endregion
              connectionPromise.reject(error);
              setConnectionPromise(null);
            }
          }
        }
      }
    });

    return () => {
      resumeListener.then(listener => listener.remove());
    };
  }, [connectors, connectionPromise]);

  const resolvePlayerName = () => {
    const candidateName = (userName || "Adventurer").trim();
    const truncatedName = candidateName.slice(0, 31);
    try {
      stringToFelt(truncatedName);
      return truncatedName;
    } catch {
      return "Adventurer";
    }
  };

  const enterDungeon = async (payment: Payment, txs: any[]) => {
    if (!account) return;
    const resolvedName = resolvePlayerName();
    const resolvedRecipient = account.address;

    let gameId = await buyGame(
      account,
      payment,
      resolvedName,
      txs,
      1,
      () => {
        navigate(`/${dungeon.id}/play?mode=entering`);
      },
      resolvedRecipient
    );

    if (gameId) {
      await delay(2000);
      navigate(`/${dungeon.id}/play?id=${gameId}`, { replace: true });
      fetchTokenBalances();
      if (!skipIntroOutro) {
        setShowOverlay(false);
      }
    } else {
      navigate(`/${dungeon.id}`, { replace: true });
    }
  };

  const bulkMintGames = async (amount: number, callback: () => void) => {
    amount = Math.min(amount, 50);
    const resolvedName = resolvePlayerName();

    await buyGame(
      account,
      { paymentType: "Ticket" },
      resolvedName,
      [],
      amount,
      () => {
        setTokenBalances(prev => ({
          ...prev,
          "TICKET": (Number((prev as any)["TICKET"]) - amount).toString()
        }));
        callback();
      }
    );
  };

  const createBurner = async () => {
    setCreatingBurner(true);
    let account = await createBurnerAccount(demoRpcProvider);

    if (account) {
      setBurner(account);
    }
    setCreatingBurner(false);
  };

  async function fetchTokenBalances() {
    let balances = await getTokenBalances(NETWORKS.SN_MAIN.paymentTokens);
    setTokenBalances(balances);

    let goldenTokenAddress = NETWORKS.SN_MAIN.goldenToken;
    const allTokens = await getGameTokens(address!, goldenTokenAddress);

    if (allTokens.length > 0) {
      const cooldowns = await goldenPassReady(goldenTokenAddress, allTokens);
      setGoldenPassIds(cooldowns);
    }
  }

  const acceptTermsOfService = () => {
    setShowTermsOfService(false);
  };

  return (
    <ControllerContext.Provider
      value={{
        account:
          currentNetworkConfig.chainId === ChainId.WP_PG_SLOT
            ? burner
            : account,
        address:
          currentNetworkConfig.chainId === ChainId.WP_PG_SLOT
            ? burner?.address
            : address,
        playerName: userName || "Adventurer",
        isPending: isConnecting || isPending || creatingBurner,
        tokenBalances,
        goldenPassIds,
        showTermsOfService,
        acceptTermsOfService,

        openProfile: () => (connector as any)?.controller?.openProfile(),
        openBuyTicket: () => (connector as any)?.controller?.openStarterPack(3),
        login: async () => {
          // #region agent log
          fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Login function entry',data:{connectorsCount:connectors.length,connectorIds:connectors.map(c=>c.id),isNative:Capacitor.isNativePlatform(),platform:Capacitor.getPlatform()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
          // Check for existing session on SessionConnector first
          const sessionConnector = connectors.find(
            (conn) => conn.id === "controller_session" || conn.id?.includes("session")
          );

          // #region agent log
          fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Session connector lookup',data:{found:!!sessionConnector,sessionConnectorId:sessionConnector?.id,isNative:Capacitor.isNativePlatform()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion

          if (sessionConnector && Capacitor.isNativePlatform()) {
            const sessionConnectorAny = sessionConnector as any;
            
            // #region agent log
            const controllerState = {
              hasController: !!sessionConnectorAny.controller,
              hasAccount: !!sessionConnectorAny.controller?.account,
              accountAddress: sessionConnectorAny.controller?.account?.address,
              controllerKeys: sessionConnectorAny.controller ? Object.keys(sessionConnectorAny.controller).slice(0, 20) : [],
              controllerMethods: sessionConnectorAny.controller ? Object.getOwnPropertyNames(Object.getPrototypeOf(sessionConnectorAny.controller)).slice(0, 20) : []
            };
            fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Checking controller state for existing session',data:controllerState,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            
            // Check if session already exists
            if (sessionConnectorAny.controller?.account) {
              // #region agent log
              fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Existing session found, returning',data:{address:sessionConnectorAny.controller.account.address},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              // Session exists, return it
              return {
                account: sessionConnectorAny.controller.account.address,
                chainId: await sessionConnectorAny.controller.chainId(),
              };
            }

            // #region agent log
            fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'No existing session, initiating new connection',data:{hasConnectionPromise:!!connectionPromise},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion

            // Clear any corrupted stored session data before connecting
            // #region agent log
            fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Starting storage cleanup',data:{hasClearMethod:typeof sessionConnectorAny.controller?.clearStoredSession === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
            // #endregion
            
            // Clear controller's stored session
            try {
              if (typeof sessionConnectorAny.controller.clearStoredSession === 'function') {
                sessionConnectorAny.controller.clearStoredSession();
                // #region agent log
                fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Controller clearStoredSession() called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
                // #endregion
              }
            } catch (clearError: any) {
              // #region agent log
              fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Error calling clearStoredSession',data:{error:String(clearError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
              // #endregion
            }

            // Also clear localStorage items that might contain corrupted data
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                const keysToRemove: string[] = [];
                for (let i = 0; i < window.localStorage.length; i++) {
                  const key = window.localStorage.key(i);
                  if (key && (key.includes('cartridge') || key.includes('controller') || key.includes('session') || key.includes('starknet'))) {
                    keysToRemove.push(key);
                  }
                }
                keysToRemove.forEach(key => {
                  window.localStorage.removeItem(key);
                });
                // #region agent log
                fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Cleared localStorage items',data:{keysRemoved:keysToRemove.length,keys:keysToRemove},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
                // #endregion
              }
            } catch (localStorageError: any) {
              // #region agent log
              fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Error clearing localStorage',data:{error:String(localStorageError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
              // #endregion
            }

            // Small delay to ensure storage clearing takes effect
            await delay(100);

            // No session exists, initiate new connection
            // Store promise for resume handler
            const promise = new Promise((resolve, reject) => {
              // #region agent log
              fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Creating connection promise',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
              // #endregion
              setConnectionPromise({ resolve, reject });
            });

            // #region agent log
            const controllerInfo = {
              hasController: !!sessionConnectorAny.controller,
              hasConnectMethod: typeof sessionConnectorAny.controller?.connect === 'function',
              connectType: typeof sessionConnectorAny.controller?.connect,
              controllerProps: sessionConnectorAny.controller ? Object.keys(sessionConnectorAny.controller).filter(k => !k.startsWith('_')).slice(0, 15) : [],
              redirectUrl: sessionConnectorAny.controller?._redirectUrl,
              rpcUrl: sessionConnectorAny.controller?._rpcUrl,
            };
            fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'About to call controller.connect()',data:{connectorId:sessionConnector.id,...controllerInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion

            // Initiate connection (will open browser) - call controller.connect() directly
            try {
              // Call controller.connect() to open browser - it may return a promise
              const connectResult = sessionConnectorAny.controller.connect();
              // #region agent log
              fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Controller.connect() called',data:{resultType:typeof connectResult,isPromise:connectResult instanceof Promise,hasThen:!!connectResult?.then},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
              
              // If it returns a promise, handle it but don't await (browser should open)
              if (connectResult instanceof Promise) {
                connectResult.catch((error: any) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Controller.connect() promise rejected',data:{error:String(error),errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                  // #endregion
                });
              }
              
              // #region agent log
              fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Controller.connect() completed, browser should open',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
            } catch (error: any) {
              // #region agent log
              fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Controller.connect() synchronous error',data:{error:String(error),errorStack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
            }
            
            // Wait for resume to resolve
            return promise;
          }

          // #region agent log
          fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Falling back to regular connector',data:{hasSessionConnector:!!sessionConnector,isNative:Capacitor.isNativePlatform()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion

          // Fallback to regular connector for web
          const foundConnector = connectors.find((conn) => conn.id === "controller");
          // #region agent log
          fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'controller.tsx:login',message:'Regular connector lookup',data:{found:!!foundConnector,connectorId:foundConnector?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
          if (foundConnector) {
            connect({ connector: foundConnector });
          }
        },
        logout: () => disconnect(),
        enterDungeon,
        bulkMintGames,
      }}
    >
      {children}
    </ControllerContext.Provider>
  );
};

export const useController = () => {
  const context = useContext(ControllerContext);
  if (!context) {
    throw new Error("useController must be used within a ControllerProvider");
  }
  return context;
};
