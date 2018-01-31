
/**
 * 获取元素
 */
export function getCanvasElement(el) {
  let canvas = null
  if (typeof el === 'string') {
    canvas = document.getElementById(el)
  } else {
    canvas = el
  }
  if (!canvas || !canvas.getContext) {
    logs('error', 'Elements do not exist or browsers do not support!')
    return false;
  }
  return canvas
}
