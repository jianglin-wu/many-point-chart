import EventEmitter from './scripts/event-emitter.js'
import { logs } from './scripts/utils'

/**
 * 读取键名
 * 如：对象object, 键名"a.b.c" 读取为 object[a][b][c]
 */
function readKeyValue (object, keyNames) {
  let target = object
  keyNames.split('.').forEach((keyName) => {
    target = target[keyName]
  })
  return target
}

/**
 * 获取　Canvas
 */
function getCanvasElement(el) {
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

/**
 * 绘制圆点虚线
 */
function　dottedLine(ctx, x1, y1, x2, y2, interval) {
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
function drawScale(ctx, location, parames) {
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
    const fontSize = surplusH * 0.5
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
function singleChart(ctx, location, parames) {
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
function drawTables(ctx, location, parames) {
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

/**
 * 计算百分比
 */
function setPercentageDefault (value, difference, min) {
  return (value - min) / difference
}

/**
 * 事件是否在路径中
 */
function isInPath (ctx, e, type, parames) {
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


class Xmany extends EventEmitter {
  constructor (el, config) {
    super()
    this.ctx = null
    this.options = null
    this.data = null
    this.scaleList = null
    this.pointAllList = null
    this.eventList = []
    this.config = config
    this.canvas = getCanvasElement(el)
    this.initCanvas()
  }

  /**
   * 初始化操作
   */
  initCanvas () {
    const { width, height } = this.config
    this.canvas.setAttribute('width', width)
    this.canvas.setAttribute('height', height)
    this.ctx = this.canvas.getContext('2d')
  }

  /**
   * 设置默认值
   */
  setOptions ({ scale = {}, chart = {}}) {
    const options = {}
    options.scale = (({
      title = '杆号', keyName　= 'pole.poleName', height = 30,
      lineWidth = 1, strokeStyle = '#000', fillStyle = '#000',
    }) => {
      return { title, keyName, height, lineWidth, strokeStyle, fillStyle }
    })(scale)
    options.chart = (({ offsetLeft = 100, tables = [], tablesHeight = 0, gridSpacingY = 20 }) => {
      const newChart = {}
      newChart.offsetLeft = offsetLeft
      newChart.tablesHeight = tablesHeight
      newChart.gridSpacingY = gridSpacingY
      newChart.tables = tables.map(({
        title = '表名', keyName = '', min = 0, max = 100,
        setPercentage = null, pointRadius = 6, pointRadian = 360 * Math.PI / 180,
        fillStyle = '#000', strokeStyle = '#000', lineWidth = 1,
      }) => {
        return {
          title, keyName, lineWidth, min, max, pointRadius, pointRadian,
          setPercentage: setPercentage || setPercentageDefault,
          fillStyle, strokeStyle,
        }
      })
      return newChart
    })(chart)
    return this.options = options
  }

  draw (options, data) {
    this.setOptions(options)
    if (this.data) {
      this.clear()
      this.removeEvents()
    }
    this.data = data
    this.layout()
  }

  layout () {
    const { ctx, config, options, data } = this
    const { width, height } = config
    const { scale, chart } = options
    const { offsetLeft, tablesHeight, tables, gridSpacingY } = chart
    const scaleHeight = scale.height
    const scaleTop = height - scaleHeight

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)

    this.scaleList = drawScale(ctx, {
        x: offsetLeft,
        y: height - scaleHeight,
        w: width - offsetLeft,
        h: scaleHeight,
      },
      scale,
    )(data)
    this.pointAllList = drawTables(ctx, {
        x: 0,
        y: 0,
        w: width - 0,
        h: tablesHeight || scaleTop,
      }, {
        offsetLeft,
        tables,
        scaleTop,
        gridSpacingY,
    })(this.scaleList, data)
    this.watchEvents()
  }

  /**
   * 清除画板
   */
  clear () {
    const ctx = this.ctx
    const { width, height } = this.config
    ctx.clearRect(0, 0, width, height)
  }

  /**
   * 生成事件处理函数
   */
  generateEventListener (
    eventName,
    trigger,
    tableTrigger,
    axisXTrigger,
    pointTrigger,
    tableNoTrigger,
    axisXNoTrigger,
    pointNoTrigger,
  ) {
    const ctx = this.ctx
    const options = this.options
    const pointAllList = this.pointAllList
    const that = this
    function eventListener (e) {
      let isThisInPointPath = false
      let isThisInAxisX = false
      let isThisInTable = false

      if (!trigger) {
        return
      }
      trigger(e)
      pointAllList.forEach(({ pointList, chartY, tableHeight }, tableIndex) => {
        pointList.forEach(({ values, x, name, span }, xIndex) => {
          const pointListWidth = (pointList.length + 1) * span
          const tableLocation = {
            x: pointList[0].x - span,
            y: chartY,
            w: pointListWidth,
            h: tableHeight,
          }
          const axisXLocation = {
            x: x - (span / 2),
            y: chartY,
            w: span,
            h: tableHeight,
          }
          if (isInPath(ctx, e, 'rect', tableLocation) && xIndex === 0 && tableTrigger) {
            tableTrigger(e, tableLocation, { tableIndex })
            isThisInTable = true
          }
          if (isInPath(ctx, e, 'rect', axisXLocation) && axisXTrigger) {
            axisXTrigger(e, axisXLocation, { tableIndex, xIndex })
            isThisInAxisX = true
          }
          values.forEach(({ y }, valueIndex) => {
            const tableOptions = options.chart.tables[tableIndex]
            const pointLocation = {
              x: x,
              y: y,
              radius: tableOptions.pointRadius,
              radian: tableOptions.pointRadian,
            }
            const indexs = {
              tableIndex,
              xIndex,
              valueIndex,
            }
            if(isInPath(ctx, e, 'point', pointLocation) && pointTrigger) {
              pointTrigger(e, pointLocation, indexs)
              isThisInPointPath = true
            }
          })
        })
      })

      // 当前事件没有在路径中触发
      if (!isThisInTable && tableNoTrigger) {
        tableNoTrigger(e)
      }
      if (!isThisInAxisX && axisXNoTrigger) {
        axisXNoTrigger(e)
      }
      if (!isThisInPointPath && pointNoTrigger) {
        pointNoTrigger(e)
      }
    }
    this.eventList.push({ eventName, eventListener })
    this.canvas.addEventListener(eventName, eventListener);
    return eventListener
  }

  /**
   * 注册监听事件
   */
  watchEvents () {
    const that = this
    let isInTable = false
    let isInAxisX = false
    let isInPointPath = false

    // 注册移入事件
    this.generateEventListener(
      'mouseenter',
      function mouseenter(e) {
        that.emit('mouseenter', e)
      }
    )

    // 注册移动事件
    this.generateEventListener(
      'mousemove',
      function mousemove(e) {
        that.emit('mousemove', e)
      },
      function tableMousemove(e, location, indexs) {
        if (isInTable) {
          that.emit('tableMousemove', e, location, indexs)
        } else {
          that.emit('tableMouseenter', e, location, indexs)
          isInTable = true
        }
      },
      function axisXMousemove(e, location, indexs) {
        if (isInAxisX) {
          that.emit('axisXMousemove', e, location, indexs)
        } else {
          that.emit('axisXMouseenter', e, location, indexs)
          isInAxisX = true
        }
      },
      function pointMousemove(e, location, indexs) {
        if (isInPointPath) {
          that.emit('pointMousemove', e, location, indexs)
        } else {
          that.emit('pointMouseenter', e, location, indexs)
          isInPointPath = true
        }
      },
      function tableMouseleave(e, indexs) {
        if (isInTable) {
          isInTable = false
          that.emit('tableMouseleave')
        }
      },
      function axisXMouseleave(e, indexs) {
        if (isInAxisX) {
          isInAxisX = false
          that.emit('axisXMouseleave')
        }
      },
      function pointMouseleave(e, indexs) {
        if (isInPointPath) {
          isInPointPath = false
          that.emit('pointMouseleave')
        }
      },
    )

    // 注册移出事件
    this.generateEventListener(
      'mouseleave',
      function mouseleave(e) {
        that.emit('mouseleave', e)
        isInPointPath = false
        isInAxisX = false
        isInTable = false
      }
    )

    // 注册点击事件
    this.generateEventListener(
      'click',
      function click(e) {
        that.emit('click', e)
      },
      function tableClick(e, location, indexs) {
        that.emit('tableClick', e, location, indexs)
      },
      function axisXClick(e, location, indexs) {
        that.emit('axisXClick', e, location, indexs)
      },
      function pointClick(e, location, indexs) {
        that.emit('pointClick', e, location, indexs)
      },
    )
  }

  /**
   * 清除所有事件
   */
  removeEvents () {
    const canvas = this.canvas
    const eventList = this.eventList
    eventList.forEach(({ eventName, eventListener }) => {
      canvas.removeEventListener(eventName, eventListener)
    })
    this.eventList = []
  }
}

export default Xmany
