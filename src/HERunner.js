import runHE from './he'

let sockets = [];
const socket = runHE();
sockets.push( socket );
socket.then( ( s ) => s.setOperationStatus( 'available' ) )
