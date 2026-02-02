
import type { MaybePromise } from 'bun';

import type { BunifyRequest } from './../request';
import type { BunifyResponse } from '../response';


export type RequestMiddleware = (request: BunifyRequest) => MaybePromise<BunifyResponse | undefined>