import { useController } from '@/contexts/controller';
import { ellipseAddress } from '@/utils/utils';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { Button } from '@mui/material';
import { useAccount } from '@starknet-react/core';

function WalletConnect() {
  const { isPending, playerName, login, openProfile } = useController()
  const { account, address } = useAccount();

  // #region agent log
  const handleLoginClick = () => {
    fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WalletConnect.tsx:handleLoginClick',message:'Login button clicked',data:{account:!!account,address:!!address,isPending},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    try {
      fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WalletConnect.tsx:handleLoginClick',message:'Calling login function',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      login();
      fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WalletConnect.tsx:handleLoginClick',message:'Login function called successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    } catch (error) {
      fetch('http://127.0.0.1:7247/ingest/a7e82f58-654e-43f0-92f1-ed913cdf8b58',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WalletConnect.tsx:handleLoginClick',message:'Error in login click handler',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    }
  };
  // #endregion

  return (
    <>
      {account && address
        ? <Button
          loading={!playerName}
          onClick={() => openProfile()}
          startIcon={<SportsEsportsIcon />}
          color='primary'
          variant='contained'
          size='small'
          sx={{ 
            minWidth: '100px',
            pointerEvents: 'auto',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            cursor: 'pointer'
          }}
        >
          {playerName ? playerName : ellipseAddress(address, 4, 4)}
        </Button>

        : <Button
          loading={isPending}
          variant='contained'
          color='secondary'
          onClick={handleLoginClick}
          size='small'
          startIcon={<SportsEsportsIcon />}
          sx={{ 
            minWidth: '100px',
            pointerEvents: 'auto',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            cursor: 'pointer'
          }}
        >
          Log In X
        </Button>
      }
    </>
  );
}

export default WalletConnect
