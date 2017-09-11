import config from 'config';
import pry from 'pryjs';

import runHC from './user'

let sockets = [];
const socket = runHC();
sockets.push( socket );
