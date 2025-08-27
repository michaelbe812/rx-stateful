import '@analogjs/vite-plugin-angular/setup-zone';
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });
