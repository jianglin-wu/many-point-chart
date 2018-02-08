import { readKeyValue } from './utils'

/**
 * 事件是否在路径中
 */
export function isInPath (ctx, e, type, parames) {
  ctx.beginPath()
  if (type === 'point') {
    const { x, y, radius, radian } = parames
    ctx.moveTo(x, y)
    ctx.arc(x, y, radius, 0, radian, true)
  } else if (type === 'rect') {
    const { x, y, w, h } = parames
    ctx.rect(x, y, w, h)
  }
  const ret = ctx.isPointInPath(e.offsetX, e.offsetY)
  ctx.closePath()
  return ret
}


/**
 * 绘制圆点虚线
 */
export function dottedLine (ctx, x1, y1, x2, y2, interval) {
  if (!interval) {
    interval = 5
  }
  var isHorizontal = true
  if (x1 == x2) {
    isHorizontal = false
  }
  var len = isHorizontal ? x2 - x1 : y2 - y1
  ctx.moveTo(x1, y1)
  var progress = 0
  while (len > progress) {
    progress += interval
    if (progress > len) {
      progress = len
    }
    if (isHorizontal) {
      ctx.moveTo(x1 + progress, y1)
      ctx.arc(x1 + progress, y1, 1, 0, Math.PI * 2, true)
      ctx.fill()
    } else {
      ctx.moveTo(x1, y1 + progress)
      ctx.arc(x1, y1 + progress, 1, 0, Math.PI * 2, true)
      ctx.fill()
    }
  }
}

/**
 * 刻度线
 */
export function drawScale(ctx, location, parames) {
  const { x, y, w, h } = location
  const { title, keyName, lineWidth, strokeStyle, fillStyle } = parames
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = strokeStyle
  ctx.fillStyle = fillStyle
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()
  return function (data) {
    const XList = []
    const startY = y + lineWidth
    const surplusH = h - lineWidth
    const scaleHeight = surplusH * 0.3
    const fontSize = surplusH * 0.3
    const textTop = startY + scaleHeight + (surplusH * 0.2) + fontSize
    const scaleCount = data.length
    let span = w / (scaleCount + 1)
    let offsetLeft = x + span

    // 设置title
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = strokeStyle
    ctx.fillStyle = fillStyle
    ctx.textAlign = 'left'
    ctx.font = fontSize + 'px Arial'
    ctx.fillText(title, x, textTop, span / 1.5)
    ctx.beginPath()
    data.forEach((item) => {
      const name = readKeyValue(item, keyName)
      ctx.moveTo(offsetLeft, startY)
      ctx.lineTo(offsetLeft, startY + scaleHeight)
      ctx.textAlign = 'center'
      ctx.font = fontSize + 'px Arial'
      ctx.fillText(name, offsetLeft, textTop, span * 0.8)
      XList.push({
        name,
        span,
        offsetLeft,
      })
      offsetLeft += span
    })
    ctx.stroke()
    return XList
  }
}



/**
 * 单张表中的图
 */
export function singleChart(ctx, location, parames) {
  const { x, y, w, h } = location
  const { topShow, bottomShow, gridSpacingY } = parames
  const lineWidth = 1
  let thisGridSpacingY = gridSpacingY

  if (topShow || bottomShow) {
    ctx.setLineDash([])
    ctx.strokeStyle = '#000'
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    // 顶部线条
    if (topShow) {
      ctx.moveTo(x, y + lineWidth)
      ctx.lineTo(x + w, y + lineWidth)
    }
    // 底部线条
    if (bottomShow) {
      ctx.moveTo(x, y + h - lineWidth)
      ctx.lineTo(x + w, y + h - lineWidth)
    }
    ctx.stroke()
  }

  const gridCount = parseInt(h / thisGridSpacingY, 10)
  thisGridSpacingY += (h % thisGridSpacingY) / gridCount
  let gridTop = y
  ctx.beginPath()
  for (let i = 1; i < gridCount; i++) {
    gridTop　+= thisGridSpacingY
    ctx.strokeStyle = '#ccc'
    // ctx.strokeStyle = '#eee'
    // // 绘制圆点虚线
    // dottedLine(ctx, x - 4, gridTop, x + w, gridTop, 8)

    // 绘制方块虚线
    ctx.setLineDash([5, 2, 25, 10])
    ctx.moveTo(x, gridTop)
    ctx.lineTo(x + w, gridTop)
  }
  ctx.stroke()
}



/**
 * 图表
 */
export function drawTables(ctx, location, parames) {
  const { x, y, w, h } = location
  const { tables, offsetLeft, scaleTop, gridSpacingY } = parames
  const fontSize = 12
  const textWidth = offsetLeft * 0.8
  const tableHeight = h / tables.length
  ctx.textAlign = 'right'
  ctx.font = fontSize + 'px Arial'
  const lastBottomShow = scaleTop - (y + h) > h * 0.01
  tables.forEach(({ title, fillStyle }, index) => {
    const chartY = y + (tableHeight * index)
    const textY = (tableHeight + fontSize) / 2 + chartY
    ctx.fillStyle = fillStyle
    ctx.fillText(title, textWidth, textY, textWidth)
    singleChart(ctx, {
        x: offsetLeft,
        y: chartY,
        w: w - offsetLeft,
        h: tableHeight,
      }, {
        topShow: index === 0,
        gridSpacingY,
        bottomShow: index === tables.length - 1 ? lastBottomShow : true,
    })
  })
  return function (XList, data) {
    return tables.map((table, tableIndex) => {
      const {
        keyName, min, max, setPercentage, lineWidth,
        pointRadius, pointRadian, fillStyle, strokeStyle,
      } = table
      const chartY = y + (tableHeight * tableIndex)
      const difference = max - min
      ctx.setLineDash([])
      ctx.strokeStyle = strokeStyle
      ctx.fillStyle = fillStyle
      ctx.lineWidth = lineWidth

      ctx.beginPath()
      const pointList = XList.map(({ name, span, offsetLeft }, xIndex) => {
        const x = offsetLeft
        let values = data[xIndex][keyName]
        const setLint = (value, index = 0) => {
          let percentage = setPercentage(value, difference, min)
          const y = chartY + tableHeight - (tableHeight * percentage)
          if (xIndex === 0 && index === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
          return { y, percentage, value }
        }
        if (Array.isArray(values)) {
          values = values.map(setLint)
        } else if (typeof values === 'number') {
          values = setLint(values)
        } else {
          values = []
        }
        return { name, values, x, span }
      })
      ctx.stroke()

      // 设置圆点
      pointList.forEach(({ values, x }) => {
        values.forEach(({ y }) => {
          ctx.beginPath()
          ctx.arc(x, y, pointRadius, 0, pointRadian, true)
          ctx.fill()
          ctx.stroke()
        })
      })
      return { pointList, chartY, tableHeight }
    })
  }
}
