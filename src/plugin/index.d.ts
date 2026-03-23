import * as Rspack from '@rspack/core';

export interface ESADPluginOptions {
  type: 'host' | 'module';
  name?: string;
  cdnUrl?: string;
}

export function withESAD(config: Rspack.Configuration, options: ESADPluginOptions): Rspack.Configuration;
