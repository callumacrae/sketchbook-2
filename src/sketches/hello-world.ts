import toCanvasComponent, {
  InitFn,
  FrameFn,
} from '../utils/to-canvas-component';

interface CanvasState {
  num: number;
}

export const config = {
  var: 1,
};

const init: InitFn<CanvasState> = ({ width }) => {
  console.log(width);
  return { num: 0.25 + Math.random() * 0.5 };
};

const frame: FrameFn<CanvasState> = ({
  ctx,
  state,
  width,
  height,
  timestamp,
}) => {
  ctx.clearRect(0, 0, width, height);

  ctx.beginPath();
  ctx.arc(
    width * state.num,
    height / 2 + Math.sin(timestamp / 1e3) * 100,
    100,
    0,
    Math.PI * 2
  );
  ctx.fill();
};

export default toCanvasComponent<CanvasState>(init, frame);
