import React from 'react';

type ConnectionStatusType = 'connected' | 'connecting' | 'disconnected' | 'error';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
}

declare const ConnectionStatus: React.FC<ConnectionStatusProps>;
export default ConnectionStatus;
