/**
 * Type declarations for optional highcharts dependencies.
 * These allow the library to compile even when highcharts is not installed.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'highcharts' {
  const Highcharts: any;
  export default Highcharts;
}

declare module 'highcharts-react-official' {
  import { ComponentType } from 'react';
  const HighchartsReact: ComponentType<any>;
  export default HighchartsReact;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
