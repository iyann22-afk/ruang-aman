declare module 'vanilla-tilt' {
  export interface TiltOptions {
    reverse?: boolean;
    max?: number;
    perspective?: number;
    scale?: number;
    speed?: number;
    transition?: boolean;
    axis?: string | null;
    reset?: boolean;
    easing?: string;
    glare?: boolean;
    'max-glare'?: number;
    'glare-prerender'?: boolean;
    'mouse-event-element'?: string | null;
    gyroscope?: boolean;
    gyroscopeMinAngleX?: number;
    gyroscopeMaxAngleX?: number;
    gyroscopeMinAngleY?: number;
    gyroscopeMaxAngleY?: number;
  }

  export interface TiltVanillaElement extends HTMLElement {
    vanillaTilt?: {
      destroy: () => void;
      getValues: () => any;
      reset: () => void;
    };
  }

  export default class VanillaTilt {
    static init(elements: HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>, options?: TiltOptions): void;
    destroy(): void;
  }
}
