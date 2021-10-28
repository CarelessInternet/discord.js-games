import { Client } from './index';

export interface Handler {
	execute: (client: Client) => void;
}
