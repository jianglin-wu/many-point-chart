var name = "Xmany";
var version = "1.0.0";

function logs(type, message) {
  if (typeof type !== 'string' || console[type] === undefined) {
    console.error('Logs function "type" parameter invalid!');
    return;
  }
  if (type === 'error') {
    throw new Error(message);
  }
  console[type](message);
}

/**********************************************************/
/*                                                        */
/*                       事件处理器                        */
/*                                                        */
/**********************************************************/
class EventEmitter {
  constructor() {
    this.events = {};
  }

  //绑定事件函数
  on(eventName, callback) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(callback);
  }

  //触发事件函数
  emit(eventName, ...args) {
    const events = this.events[eventName];
    if (!events) {
      return;
    }

    events.forEach(event => {
      event.apply(null, args);
    });
  }
}

/**
 * 读取键名
 * 如：对象object, 键名"a.b.c" 读取为 object[a][b][c]
 */
function readKeyValue(object, keyNames) {
  let target = object;
  keyNames.split('.').forEach(keyName => {
    target = target[keyName];
  });
  return target;
}

/**
 * 获取　Canvas
 */
function getCanvasElement(el) {
  let canvas = null;
  if (typeof el === 'string') {
    canvas = document.getElementById(el);
  } else {
    canvas = el;
  }
  if (!canvas || !canvas.getContext) {
    logs('error', 'Elements do not exist or browsers do not support!');
    return false;
  }
  return canvas;
}

/**
 * 刻度线
 */
function drawScale(ctx, location, parames) {
  const { x, y, w, h } = location;
  const { title, keyName, lineWidth, strokeStyle, fillStyle } = parames;
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  return function (data) {
    const XList = [];
    const startY = y + lineWidth;
    const surplusH = h - lineWidth;
    const scaleHeight = surplusH * 0.3;
    const fontSize = surplusH * 0.5;
    const textTop = startY + scaleHeight + surplusH * 0.2 + fontSize;
    const scaleCount = data.length;
    let span = w / (scaleCount + 1);
    let offsetLeft = x + span;

    // 设置title
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = fillStyle;
    ctx.textAlign = 'left';
    ctx.font = fontSize + 'px Arial';
    ctx.fillText(title, x, textTop, span / 1.5);
    ctx.beginPath();
    data.forEach(item => {
      const name$$1 = readKeyValue(item, keyName);
      ctx.moveTo(offsetLeft, startY);
      ctx.lineTo(offsetLeft, startY + scaleHeight);
      ctx.textAlign = 'center';
      ctx.font = fontSize + 'px Arial';
      ctx.fillText(name$$1, offsetLeft, textTop, span * 0.8);
      XList.push({
        name: name$$1,
        span,
        offsetLeft
      });
      offsetLeft += span;
    });
    ctx.stroke();
    return XList;
  };
}

/**
 * 单张表中的图
 */
function singleChart(ctx, location, parames) {
  const { x, y, w, h } = location;
  const { topShow, bottomShow } = parames;
  const lineWidth = 1;
  // 虚线行距
  let gridSpacingY = 40;

  if (topShow || bottomShow) {
    ctx.setLineDash([]);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    // 顶部线条
    if (topShow) {
      ctx.moveTo(x, y + lineWidth);
      ctx.lineTo(x + w, y + lineWidth);
    }
    // 底部线条
    if (bottomShow) {
      ctx.moveTo(x, y + h - lineWidth);
      ctx.lineTo(x + w, y + h - lineWidth);
    }
    ctx.stroke();
  }

  const gridCount = parseInt(h / gridSpacingY, 10);
  gridSpacingY += h % gridSpacingY / gridCount;
  let gridTop = y;
  ctx.beginPath();
  for (let i = 1; i < gridCount; i++) {
    gridTop += gridSpacingY;
    ctx.strokeStyle = '#ccc';
    // ctx.strokeStyle = '#eee'
    // // 绘制圆点虚线
    // dottedLine(ctx, x - 4, gridTop, x + w, gridTop, 8)

    // 绘制方块虚线
    ctx.setLineDash([5, 2, 25, 10]);
    ctx.moveTo(x, gridTop);
    ctx.lineTo(x + w, gridTop);
  }
  ctx.stroke();
}

/**
 * 图表
 */
function drawTables(ctx, location, parames) {
  const { x, y, w, h } = location;
  const { tables, offsetLeft, scaleTop } = parames;
  const fontSize = 12;
  const textWidth = offsetLeft * 0.8;
  const tableHeight = h / tables.length;
  ctx.textAlign = 'right';
  ctx.font = fontSize + 'px Arial';
  const lastBottomShow = scaleTop - (y + h) > h * 0.01;
  tables.forEach(({ title, fillStyle }, index) => {
    const chartY = y + tableHeight * index;
    const textY = (tableHeight + fontSize) / 2 + chartY;
    ctx.fillStyle = fillStyle;
    ctx.fillText(title, textWidth, textY, textWidth);
    singleChart(ctx, {
      x: offsetLeft,
      y: chartY,
      w: w - offsetLeft,
      h: tableHeight
    }, {
      topShow: index === 0,
      bottomShow: index === tables.length - 1 ? lastBottomShow : true
    });
  });
  return function (XList, data) {
    return tables.map((table, tableIndex) => {
      const {
        keyName, min, max, setPercentage, lineWidth,
        pointRadius, pointRadian, fillStyle, strokeStyle
      } = table;
      const chartY = y + tableHeight * tableIndex;
      const difference = max - min;
      ctx.setLineDash([]);
      ctx.strokeStyle = strokeStyle;
      ctx.fillStyle = fillStyle;
      ctx.lineWidth = lineWidth;

      ctx.beginPath();
      const pointList = XList.map(({ name: name$$1, span, offsetLeft }, xIndex) => {
        const x = offsetLeft;
        let values = data[xIndex][keyName];
        const setLint = (value, index = 0) => {
          let percentage = setPercentage(value, difference, min);
          const y = chartY + tableHeight - tableHeight * percentage;
          if (xIndex === 0 && index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          return { y, percentage, value };
        };
        if (Array.isArray(values)) {
          values = values.map(setLint);
        } else if (typeof values === 'number') {
          values = setLint(values);
        } else {
          values = [];
        }
        return { name: name$$1, values, x, span };
      });
      ctx.stroke();

      // 设置圆点
      pointList.forEach(({ values, x }) => {
        values.forEach(({ y }) => {
          ctx.beginPath();
          ctx.arc(x, y, pointRadius, 0, pointRadian, true);
          ctx.fill();
          ctx.stroke();
        });
      });
      return { pointList, chartY, tableHeight };
    });
  };
}

/**
 * 计算百分比
 */
function setPercentageDefault(value, difference, min) {
  return (value - min) / difference;
}

class Xmany extends EventEmitter {
  constructor(el, config) {
    super();
    this.ctx = null;
    this.options = null;
    this.data = null;
    this.scaleList = null;
    this.pointAllList = null;
    this.config = config;
    this.canvas = getCanvasElement(el);
    this.initCanvas();
  }

  /**
   * 初始化操作
   */
  initCanvas() {
    const { width, height } = this.config;
    this.canvas.setAttribute('width', width);
    this.canvas.setAttribute('height', height);
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * 设置默认值
   */
  setOptions({ scale = {}, chart = {} }) {
    const options = {};
    options.scale = (({
      title = '杆号', keyName = 'pole.poleName', height = 30,
      lineWidth = 1, strokeStyle = '#000', fillStyle = '#000'
    }) => {
      return { title, keyName, height, lineWidth, strokeStyle, fillStyle };
    })(scale);
    options.chart = (({ offsetLeft = 100, tables = [], tablesHeight = 0 }) => {
      const newChart = {};
      newChart.offsetLeft = offsetLeft;
      newChart.tablesHeight = tablesHeight;
      newChart.tables = tables.map(({
        title = '表名', keyName = '', min = 0, max = 100,
        setPercentage = null, pointRadius = 6, pointRadian = 360 * Math.PI / 180,
        fillStyle = '#000', strokeStyle = '#000', lineWidth = 1
      }) => {
        return {
          title, keyName, lineWidth, min, max, pointRadius, pointRadian,
          setPercentage: setPercentage || setPercentageDefault,
          fillStyle, strokeStyle
        };
      });
      return newChart;
    })(chart);
    return this.options = options;
  }

  draw(options, data) {
    this.setOptions(options);
    if (this.data) {
      this.clear();
    }
    this.data = data;
    this.layout();
  }

  layout() {
    const { ctx, config, options, data } = this;
    const { width, height } = config;
    const { scale, chart } = options;
    const { offsetLeft, tablesHeight, tables } = chart;
    const scaleHeight = scale.height;
    const scaleTop = height - scaleHeight;
    this.scaleList = drawScale(ctx, {
      x: offsetLeft,
      y: height - scaleHeight,
      w: width - offsetLeft,
      h: scaleHeight
    }, scale)(data);
    this.pointAllList = drawTables(ctx, {
      x: 0,
      y: 0,
      w: width - 0,
      h: tablesHeight || scaleTop
    }, {
      offsetLeft,
      tables,
      scaleTop
    })(this.scaleList, data);
    this.watchEvent();
    this.addEvent();
  }

  clear() {
    const ctx = this.ctx;
    const { width, height } = this.config;
    ctx.clearRect(0, 0, width, height);
  }

  watchEvent() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const pointAllList = this.pointAllList;
    const that = this;
    let isInPointPath = false;
    let isInAxisX = false;
    let isInTable = false;
    canvas.addEventListener('mouseenter', function () {
      that.emit('mouseenter');
    });
    canvas.addEventListener('mousemove', function (e) {
      let isThisInPointPath = false;
      let isThisInAxisX = false;
      let isThisInTable = false;
      that.emit('mousemove');
      pointAllList.forEach(({ pointList, chartY, tableHeight }, tableIndex) => {
        pointList.forEach(({ values, x, name: name$$1, span }, xIndex) => {
          const pointListWidth = (pointList.length + 1) * span;
          values.forEach(({ y }, valueIndex) => {
            if (that.inPointPath(x, y, e.offsetX, e.offsetY, tableIndex)) {
              if (isInPointPath) {
                that.emit('pointMousemove', e, { x, y }, { tableIndex, xIndex, valueIndex });
              } else {
                that.emit('pointMouseenter', e, { x, y }, { tableIndex, xIndex, valueIndex });
                isInPointPath = true;
              }
              isThisInPointPath = true;
            }
            if (that.inAxisX(x, chartY, span, tableHeight, e.offsetX, e.offsetY, tableIndex)) {
              if (isInAxisX) {
                that.emit('axisXMousemove', e, { x, y: chartY, w: span, h: tableHeight }, { tableIndex, xIndex });
              } else {
                that.emit('axisXMouseenter', e, { x, y: chartY, w: span, h: tableHeight }, { tableIndex, xIndex });
                isInAxisX = true;
              }
              isThisInAxisX = true;
            }
            if (that.inTable(pointList[0].x - span, chartY, pointListWidth, tableHeight, e.offsetX, e.offsetY, tableIndex)) {
              if (isInTable) {
                that.emit('tableMousemove', e, { x: pointList[0].x - span, y: chartY, w: pointListWidth, h: tableHeight }, { tableIndex });
              } else {
                that.emit('tableMouseenter');
                isInTable = true;
              }
              isThisInTable = true;
            }
          });
        });
      });

      // 从内部移出
      if (!isThisInPointPath && isInPointPath) {
        isInPointPath = false;
        that.emit('pointMouseleave');
      }
      if (!isThisInAxisX && isInAxisX) {
        isInAxisX = false;
        that.emit('axisXMouseleave');
      }
      if (!isThisInTable && isInTable) {
        isInTable = false;
        that.emit('tableMouseleave');
      }
    });

    canvas.addEventListener('mouseleave', function () {
      that.emit('mouseleave');
      isInPointPath = false;
      isInAxisX = false;
      isInTable = false;
    });
  }

  /**
   * 坐标是否在绘制的坐标点上
   * x1,y1 为点坐标位置
   * x2,y2 为事件位置参数
   */
  inPointPath(x1, y1, x2, y2, tableIndex) {
    const ctx = this.ctx;
    const { pointRadius, pointRadian } = this.options.chart.tables[tableIndex];
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.arc(x1, y1, pointRadius, 0, pointRadian, true);
    const ret = ctx.isPointInPath(x2, y2);
    ctx.closePath();
    return ret;
  }

  /**
   * 坐标是否在 x 轴上
   * x1,y1 为点坐标位置
   * x2,y2 为事件位置参数
   */
  inAxisX(x1, y1, span, h, x2, y2, tableIndex) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(x1 - span / 2, y1, span, h);
    const ret = ctx.isPointInPath(x2, y2);
    ctx.closePath();
    return ret;
  }

  /**
   * 坐标是否单个表格中
   * x1,y1 为点坐标位置
   * x2,y2 为事件位置参数
   */
  inTable(x1, y1, w, h, x2, y2, tableIndex) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(x1, y1, w, h);
    const ret = ctx.isPointInPath(x2, y2);
    ctx.closePath();
    return ret;
  }

  addEvent() {
    // this.on('pointMouseenter', () => {
    //   this.canvas.style.cursor = 'pointer'
    // })
    // this.on('pointMouseleave', () => {
    //   this.canvas.style.cursor = 'default'
    // })
    // this.on('pointMouseleave', () => {
    //   this.ctx.beginPath()
    //   this.ctx.moveTo(x, chartY)
    //   this.ctx.lineTo(x, chartY + tableHeight)
    //   this.ctx.stroke()
    // })
  }
}

Xmany.prototype.name = name;
Xmany.prototype.version = version;

export default Xmany;
//# sourceMappingURL=index.esm.js.map
