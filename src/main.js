import EventEmitter from './scripts/event-emitter.js'
import { logs, setPercentageDefault } from './scripts/utils'
import { drawScale, drawTables, isInPath } from './scripts/modul'
import { getCanvasElement } from './scripts/dom'

class ManyPoint extends EventEmitter {
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

  /**
   * 绘制图表
   */
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

export default ManyPoint
