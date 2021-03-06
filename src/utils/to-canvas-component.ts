import { Pane } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import { FpsGraphBladeApi } from '@tweakpane/plugin-essentials/dist/types/fps-graph/api/fps-graph';
import { defineComponent, h, UnwrapRef } from 'vue';

export interface Config<SketchConfig = undefined> {
  animate: boolean;
  width?: number;
  height?: number;
  resizeDelay: number;
  sketchConfig: SketchConfig;
}

export interface InitControlsProps<SketchConfig> {
  pane: Pane;
  config: SketchConfig;
}

export interface InitProps<SketchConfig = undefined> {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  config?: SketchConfig;
  initControls: (cb: (props: InitControlsProps<SketchConfig>) => void) => void;
}

export interface FrameProps<CanvasState, SketchConfig = undefined> {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  state: CanvasState;
  timestamp: number;
  config?: SketchConfig;
}

export type InitFn<CanvasState, SketchConfig = undefined> = (
  props: InitProps<SketchConfig>
) => CanvasState | Promise<CanvasState>;
export type FrameFn<CanvasState, SketchConfig = undefined> = (
  props: FrameProps<CanvasState, SketchConfig>
) => Promise<CanvasState | void> | CanvasState | void;

export default function toCanvasComponent<
  CanvasState = undefined,
  SketchConfig = undefined
>(
  init: InitFn<CanvasState, SketchConfig>,
  frame: FrameFn<CanvasState, SketchConfig>,
  sketchbookConfigIn: Partial<Config<SketchConfig>> = {}
) {
  const sketchbookConfig: Config<SketchConfig> = Object.assign(
    {
      animate: true,
      resizeDelay: 50,
      sketchConfig: {} as SketchConfig,
    },
    sketchbookConfigIn
  );

  return defineComponent({
    render: () => h('canvas', { ref: 'canvas' }),
    data: () => ({
      width: 0,
      height: 0,
      hasChanged: true,
      canvasState: {} as CanvasState,
      sketchbookConfig: sketchbookConfig,
      ctx: null as CanvasRenderingContext2D | null,
      resizeTimeout: undefined as NodeJS.Timeout | undefined,
      pane: undefined as Pane | undefined,
      fpsGraph: undefined as FpsGraphBladeApi | undefined,
    }),
    async mounted() {
      const canvas = this.$refs.canvas as HTMLCanvasElement | null;

      if (!canvas) {
        throw new Error('No canvas');
      }

      this.ctx = canvas.getContext('2d');

      if (!this.ctx) {
        throw new Error('No canvas context');
      }

      const config = this.sketchbookConfig.sketchConfig as
        | SketchConfig
        | undefined;

      this.setSize();

      const initProps: InitProps<SketchConfig> = {
        ctx: this.ctx,
        width: this.width,
        height: this.height,
        config,
        initControls: (cb) => {
          if (!config) {
            return;
          }

          const pane = new Pane({
            title: 'Controls',
            expanded: !window.frameElement,
          });
          pane.registerPlugin(EssentialsPlugin);
          this.pane = pane;
          this.fpsGraph = pane.addBlade({
            view: 'fpsgraph',
            label: 'FPS',
            lineCount: 2,
          }) as FpsGraphBladeApi;

          pane.on('change', () => {
            this.hasChanged = true;
          });

          cb({ pane, config });
        },
      };

      const state = await init(initProps);
      if (state) {
        this.canvasState = state as UnwrapRef<CanvasState>;
      }

      this.callFrame(0);

      window.addEventListener('resize', this.handleResize);
    },
    unmounted() {
      window.removeEventListener('resize', this.handleResize);

      if (this.pane) {
        this.pane.dispose();
      }
    },
    methods: {
      async callFrame(timestamp: number) {
        const { ctx, width, height, canvasState, sketchbookConfig } = this;

        if (!ctx) {
          throw new Error('No canvas context');
        }

        if (this.fpsGraph) {
          this.fpsGraph.begin();
        }

        const hasChanged = this.hasChanged || sketchbookConfig.animate;

        if (hasChanged) {
          const frameProps: FrameProps<CanvasState, SketchConfig> = {
            ctx,
            width,
            height,
            state: canvasState as CanvasState,
            timestamp,
            config: sketchbookConfig.sketchConfig as SketchConfig | undefined,
          };

          const newState = await frame(frameProps);

          if (newState) {
            this.canvasState = newState as UnwrapRef<CanvasState>;
          }

          this.hasChanged = false;
        }

        if (this.fpsGraph) {
          this.fpsGraph.end();
        }

        requestAnimationFrame(this.callFrame);
      },
      handleResize() {
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        const resizeDelay = this.sketchbookConfig.resizeDelay;
        this.resizeTimeout = setTimeout(() => this.setSize(), resizeDelay);
      },
      setSize() {
        if (!this.ctx) {
          throw new Error('No canvas context');
        }

        const config = this.sketchbookConfig;

        const canvas = this.ctx.canvas;
        const dpr = window.devicePixelRatio;
        this.width = config?.width ?? canvas.clientWidth * dpr;
        this.height = config?.height ?? canvas.clientHeight * dpr;
        canvas.width = this.width;
        canvas.height = this.height;

        canvas.classList.toggle(
          'custom-size',
          !!(config?.width && config?.height)
        );

        this.hasChanged = true;
      },
    },
  });
}
