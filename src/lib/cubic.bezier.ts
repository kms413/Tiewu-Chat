/**
 * 生成一个 cubic-bezier 缓动函数
 * @param x1 - 第一个控制点的 x 坐标 (0-1)
 * @param y1 - 第一个控制点的 y 坐标 (0-1)
 * @param x2 - 第二个控制点的 x 坐标 (0-1)
 * @param y2 - 第二个控制点的 y 坐标 (0-1)
 * @param epsilon - 精度阈值，默认 1e-6
 * @returns 缓动函数，接受进度 t (0-1)，返回缓动后的值
 */
export default function createCubicBezierEase(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  epsilon: number = 1e-6
): (t: number) => number {
  const curveX = (t: number): number => {
    const v = 1 - t;
    return 3 * v * v * t * x1 + 3 * v * t * t * x2 + t * t * t;
  };

  const curveY = (t: number): number => {
    const v = 1 - t;
    return 3 * v * v * t * y1 + 3 * v * t * t * y2 + t * t * t;
  };

  const derivativeCurveX = (t: number): number => {
    const v = 1 - t;
    return 3 * (2 * (t - 1) * t + v * v) * x1 + 
           3 * (-t * t * t + 2 * v * t) * x2;
  };

  return function ease(t: number): number {
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    let t2 = t;
    let x2: number;
    let d2: number;
    for (let i = 0; i < 8; i++) {
      x2 = curveX(t2) - t;
      if (Math.abs(x2) < epsilon) {
        return curveY(t2);
      }
      d2 = derivativeCurveX(t2);
      if (Math.abs(d2) < 1e-6) {
        break;
      }
      t2 = t2 - x2 / d2;
    }

    let t0 = 0;
    let t1 = 1;
    t2 = t;


    if (t2 < t0) return curveY(t0);
    if (t2 > t1) return curveY(t1);

    while (t0 < t1) {
      x2 = curveX(t2);
      if (Math.abs(x2 - t) < epsilon) {
        return curveY(t2);
      }
      if (t > x2) {
        t0 = t2;
      } else {
        t1 = t2;
      }
      t2 = (t1 - t0) * 0.5 + t0;
    }

    return curveY(t2);
  };
}