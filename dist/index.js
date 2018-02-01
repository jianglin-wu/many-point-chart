(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.manyPointChart = factory());
}(this, (function () { 'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

/**********************************************************/
/*                                                        */
/*                       事件处理器                        */
/*                                                        */
/**********************************************************/
var EventEmitter = function () {
  function EventEmitter() {
    classCallCheck(this, EventEmitter);

    this.events = {};
  }

  //绑定事件函数


  createClass(EventEmitter, [{
    key: "on",
    value: function on(eventName, callback) {
      this.events[eventName] = this.events[eventName] || [];
      this.events[eventName].push(callback);
    }

    //触发事件函数

  }, {
    key: "emit",
    value: function emit(eventName) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var events = this.events[eventName];
      if (!events) {
        return;
      }

      events.forEach(function (event) {
        event.apply(null, args);
      });
    }
  }]);
  return EventEmitter;
}();

/**
 * 读取键名
 * 如：对象 object, 传入字符串 "a.b.c"，读取为 object[a][b][c]
 */
function readKeyValue(object, keyNames) {
  var target = object;
  keyNames.split('.').forEach(function (keyName) {
    target = target[keyName];
  });
  return target;
}

/**
 * 计算百分比
 */
function setPercentageDefault(value, difference, min) {
  return (value - min) / difference;
}

/**
 * 事件是否在路径中
 */
function isInPath(ctx, e, type, parames) {
  ctx.beginPath();
  if (type === 'point') {
    var x = parames.x,
        y = parames.y,
        radius = parames.radius,
        radian = parames.radian;

    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, 0, radian, true);
  } else if (type === 'rect') {
    var _x = parames.x,
        _y = parames.y,
        w = parames.w,
        h = parames.h;

    ctx.rect(_x, _y, w, h);
  }
  var ret = ctx.isPointInPath(e.offsetX, e.offsetY);
  ctx.closePath();
  return ret;
}

/**
 * 绘制圆点虚线
 */


/**
 * 刻度线
 */
function drawScale(ctx, location, parames) {
  var x = location.x,
      y = location.y,
      w = location.w,
      h = location.h;
  var title = parames.title,
      keyName = parames.keyName,
      lineWidth = parames.lineWidth,
      strokeStyle = parames.strokeStyle,
      fillStyle = parames.fillStyle;

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  return function (data) {
    var XList = [];
    var startY = y + lineWidth;
    var surplusH = h - lineWidth;
    var scaleHeight = surplusH * 0.3;
    var fontSize = surplusH * 0.5;
    var textTop = startY + scaleHeight + surplusH * 0.2 + fontSize;
    var scaleCount = data.length;
    var span = w / (scaleCount + 1);
    var offsetLeft = x + span;

    // 设置title
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = fillStyle;
    ctx.textAlign = 'left';
    ctx.font = fontSize + 'px Arial';
    ctx.fillText(title, x, textTop, span / 1.5);
    ctx.beginPath();
    data.forEach(function (item) {
      var name = readKeyValue(item, keyName);
      ctx.moveTo(offsetLeft, startY);
      ctx.lineTo(offsetLeft, startY + scaleHeight);
      ctx.textAlign = 'center';
      ctx.font = fontSize + 'px Arial';
      ctx.fillText(name, offsetLeft, textTop, span * 0.8);
      XList.push({
        name: name,
        span: span,
        offsetLeft: offsetLeft
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
  var x = location.x,
      y = location.y,
      w = location.w,
      h = location.h;
  var topShow = parames.topShow,
      bottomShow = parames.bottomShow,
      gridSpacingY = parames.gridSpacingY;

  var lineWidth = 1;
  var thisGridSpacingY = gridSpacingY;

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

  var gridCount = parseInt(h / thisGridSpacingY, 10);
  thisGridSpacingY += h % thisGridSpacingY / gridCount;
  var gridTop = y;
  ctx.beginPath();
  for (var i = 1; i < gridCount; i++) {
    gridTop += thisGridSpacingY;
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
  var x = location.x,
      y = location.y,
      w = location.w,
      h = location.h;
  var tables = parames.tables,
      offsetLeft = parames.offsetLeft,
      scaleTop = parames.scaleTop,
      gridSpacingY = parames.gridSpacingY;

  var fontSize = 12;
  var textWidth = offsetLeft * 0.8;
  var tableHeight = h / tables.length;
  ctx.textAlign = 'right';
  ctx.font = fontSize + 'px Arial';
  var lastBottomShow = scaleTop - (y + h) > h * 0.01;
  tables.forEach(function (_ref, index) {
    var title = _ref.title,
        fillStyle = _ref.fillStyle;

    var chartY = y + tableHeight * index;
    var textY = (tableHeight + fontSize) / 2 + chartY;
    ctx.fillStyle = fillStyle;
    ctx.fillText(title, textWidth, textY, textWidth);
    singleChart(ctx, {
      x: offsetLeft,
      y: chartY,
      w: w - offsetLeft,
      h: tableHeight
    }, {
      topShow: index === 0,
      gridSpacingY: gridSpacingY,
      bottomShow: index === tables.length - 1 ? lastBottomShow : true
    });
  });
  return function (XList, data) {
    return tables.map(function (table, tableIndex) {
      var keyName = table.keyName,
          min = table.min,
          max = table.max,
          setPercentage = table.setPercentage,
          lineWidth = table.lineWidth,
          pointRadius = table.pointRadius,
          pointRadian = table.pointRadian,
          fillStyle = table.fillStyle,
          strokeStyle = table.strokeStyle;

      var chartY = y + tableHeight * tableIndex;
      var difference = max - min;
      ctx.setLineDash([]);
      ctx.strokeStyle = strokeStyle;
      ctx.fillStyle = fillStyle;
      ctx.lineWidth = lineWidth;

      ctx.beginPath();
      var pointList = XList.map(function (_ref2, xIndex) {
        var name = _ref2.name,
            span = _ref2.span,
            offsetLeft = _ref2.offsetLeft;

        var x = offsetLeft;
        var values = data[xIndex][keyName];
        var setLint = function setLint(value) {
          var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

          var percentage = setPercentage(value, difference, min);
          var y = chartY + tableHeight - tableHeight * percentage;
          if (xIndex === 0 && index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          return { y: y, percentage: percentage, value: value };
        };
        if (Array.isArray(values)) {
          values = values.map(setLint);
        } else if (typeof values === 'number') {
          values = setLint(values);
        } else {
          values = [];
        }
        return { name: name, values: values, x: x, span: span };
      });
      ctx.stroke();

      // 设置圆点
      pointList.forEach(function (_ref3) {
        var values = _ref3.values,
            x = _ref3.x;

        values.forEach(function (_ref4) {
          var y = _ref4.y;

          ctx.beginPath();
          ctx.arc(x, y, pointRadius, 0, pointRadian, true);
          ctx.fill();
          ctx.stroke();
        });
      });
      return { pointList: pointList, chartY: chartY, tableHeight: tableHeight };
    });
  };
}

/**
 * 获取元素
 */
function getCanvasElement(el) {
  var canvas = null;
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

var ManyPoint = function (_EventEmitter) {
  inherits(ManyPoint, _EventEmitter);

  function ManyPoint(el, config) {
    classCallCheck(this, ManyPoint);

    var _this = possibleConstructorReturn(this, (ManyPoint.__proto__ || Object.getPrototypeOf(ManyPoint)).call(this));

    _this.ctx = null;
    _this.options = null;
    _this.data = null;
    _this.scaleList = null;
    _this.pointAllList = null;
    _this.eventList = [];
    _this.config = config;
    _this.canvas = getCanvasElement(el);
    _this.initCanvas();
    return _this;
  }

  /**
   * 初始化操作
   */


  createClass(ManyPoint, [{
    key: 'initCanvas',
    value: function initCanvas() {
      var _config = this.config,
          width = _config.width,
          height = _config.height;

      this.canvas.setAttribute('width', width);
      this.canvas.setAttribute('height', height);
      this.ctx = this.canvas.getContext('2d');
    }

    /**
     * 设置默认值
     */

  }, {
    key: 'setOptions',
    value: function setOptions(_ref) {
      var _ref$scale = _ref.scale,
          scale = _ref$scale === undefined ? {} : _ref$scale,
          _ref$chart = _ref.chart,
          chart = _ref$chart === undefined ? {} : _ref$chart;

      var options = {};
      options.scale = function (_ref2) {
        var _ref2$title = _ref2.title,
            title = _ref2$title === undefined ? '杆号' : _ref2$title,
            _ref2$keyName = _ref2.keyName,
            keyName = _ref2$keyName === undefined ? 'pole.poleName' : _ref2$keyName,
            _ref2$height = _ref2.height,
            height = _ref2$height === undefined ? 30 : _ref2$height,
            _ref2$lineWidth = _ref2.lineWidth,
            lineWidth = _ref2$lineWidth === undefined ? 1 : _ref2$lineWidth,
            _ref2$strokeStyle = _ref2.strokeStyle,
            strokeStyle = _ref2$strokeStyle === undefined ? '#000' : _ref2$strokeStyle,
            _ref2$fillStyle = _ref2.fillStyle,
            fillStyle = _ref2$fillStyle === undefined ? '#000' : _ref2$fillStyle;

        return { title: title, keyName: keyName, height: height, lineWidth: lineWidth, strokeStyle: strokeStyle, fillStyle: fillStyle };
      }(scale);
      options.chart = function (_ref3) {
        var _ref3$offsetLeft = _ref3.offsetLeft,
            offsetLeft = _ref3$offsetLeft === undefined ? 100 : _ref3$offsetLeft,
            _ref3$tables = _ref3.tables,
            tables = _ref3$tables === undefined ? [] : _ref3$tables,
            _ref3$tablesHeight = _ref3.tablesHeight,
            tablesHeight = _ref3$tablesHeight === undefined ? 0 : _ref3$tablesHeight,
            _ref3$gridSpacingY = _ref3.gridSpacingY,
            gridSpacingY = _ref3$gridSpacingY === undefined ? 20 : _ref3$gridSpacingY;

        var newChart = {};
        newChart.offsetLeft = offsetLeft;
        newChart.tablesHeight = tablesHeight;
        newChart.gridSpacingY = gridSpacingY;
        newChart.tables = tables.map(function (_ref4) {
          var _ref4$title = _ref4.title,
              title = _ref4$title === undefined ? '表名' : _ref4$title,
              _ref4$keyName = _ref4.keyName,
              keyName = _ref4$keyName === undefined ? '' : _ref4$keyName,
              _ref4$min = _ref4.min,
              min = _ref4$min === undefined ? 0 : _ref4$min,
              _ref4$max = _ref4.max,
              max = _ref4$max === undefined ? 100 : _ref4$max,
              _ref4$setPercentage = _ref4.setPercentage,
              setPercentage = _ref4$setPercentage === undefined ? null : _ref4$setPercentage,
              _ref4$pointRadius = _ref4.pointRadius,
              pointRadius = _ref4$pointRadius === undefined ? 6 : _ref4$pointRadius,
              _ref4$pointRadian = _ref4.pointRadian,
              pointRadian = _ref4$pointRadian === undefined ? 360 * Math.PI / 180 : _ref4$pointRadian,
              _ref4$fillStyle = _ref4.fillStyle,
              fillStyle = _ref4$fillStyle === undefined ? '#000' : _ref4$fillStyle,
              _ref4$strokeStyle = _ref4.strokeStyle,
              strokeStyle = _ref4$strokeStyle === undefined ? '#000' : _ref4$strokeStyle,
              _ref4$lineWidth = _ref4.lineWidth,
              lineWidth = _ref4$lineWidth === undefined ? 1 : _ref4$lineWidth;

          return {
            title: title, keyName: keyName, lineWidth: lineWidth, min: min, max: max, pointRadius: pointRadius, pointRadian: pointRadian,
            setPercentage: setPercentage || setPercentageDefault,
            fillStyle: fillStyle, strokeStyle: strokeStyle
          };
        });
        return newChart;
      }(chart);
      return this.options = options;
    }

    /**
     * 绘制图表
     */

  }, {
    key: 'draw',
    value: function draw(options, data) {
      this.setOptions(options);
      if (this.data) {
        this.clear();
        this.removeEvents();
      }
      this.data = data;
      this.layout();
    }
  }, {
    key: 'layout',
    value: function layout() {
      var ctx = this.ctx,
          config = this.config,
          options = this.options,
          data = this.data;
      var width = config.width,
          height = config.height;
      var scale = options.scale,
          chart = options.chart;
      var offsetLeft = chart.offsetLeft,
          tablesHeight = chart.tablesHeight,
          tables = chart.tables,
          gridSpacingY = chart.gridSpacingY;

      var scaleHeight = scale.height;
      var scaleTop = height - scaleHeight;

      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);

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
        offsetLeft: offsetLeft,
        tables: tables,
        scaleTop: scaleTop,
        gridSpacingY: gridSpacingY
      })(this.scaleList, data);
      this.watchEvents();
    }

    /**
     * 清除画板
     */

  }, {
    key: 'clear',
    value: function clear() {
      var ctx = this.ctx;
      var _config2 = this.config,
          width = _config2.width,
          height = _config2.height;

      ctx.clearRect(0, 0, width, height);
    }

    /**
     * 生成事件处理函数
     */

  }, {
    key: 'generateEventListener',
    value: function generateEventListener(eventName, trigger, tableTrigger, axisXTrigger, pointTrigger, tableNoTrigger, axisXNoTrigger, pointNoTrigger) {
      var ctx = this.ctx;
      var options = this.options;
      var pointAllList = this.pointAllList;
      function eventListener(e) {
        var isThisInPointPath = false;
        var isThisInAxisX = false;
        var isThisInTable = false;

        if (!trigger) {
          return;
        }
        trigger(e);
        pointAllList.forEach(function (_ref5, tableIndex) {
          var pointList = _ref5.pointList,
              chartY = _ref5.chartY,
              tableHeight = _ref5.tableHeight;

          pointList.forEach(function (_ref6, xIndex) {
            var values = _ref6.values,
                x = _ref6.x,
                name = _ref6.name,
                span = _ref6.span;

            var pointListWidth = (pointList.length + 1) * span;
            var tableLocation = {
              x: pointList[0].x - span,
              y: chartY,
              w: pointListWidth,
              h: tableHeight
            };
            var axisXLocation = {
              x: x - span / 2,
              y: chartY,
              w: span,
              h: tableHeight
            };
            if (isInPath(ctx, e, 'rect', tableLocation) && xIndex === 0 && tableTrigger) {
              tableTrigger(e, tableLocation, { tableIndex: tableIndex });
              isThisInTable = true;
            }
            if (isInPath(ctx, e, 'rect', axisXLocation) && axisXTrigger) {
              axisXTrigger(e, axisXLocation, { tableIndex: tableIndex, xIndex: xIndex });
              isThisInAxisX = true;
            }
            values.forEach(function (_ref7, valueIndex) {
              var y = _ref7.y;

              var tableOptions = options.chart.tables[tableIndex];
              var pointLocation = {
                x: x,
                y: y,
                radius: tableOptions.pointRadius,
                radian: tableOptions.pointRadian
              };
              var indexs = {
                tableIndex: tableIndex,
                xIndex: xIndex,
                valueIndex: valueIndex
              };
              if (isInPath(ctx, e, 'point', pointLocation) && pointTrigger) {
                pointTrigger(e, pointLocation, indexs);
                isThisInPointPath = true;
              }
            });
          });
        });

        // 当前事件没有在路径中触发
        if (!isThisInTable && tableNoTrigger) {
          tableNoTrigger(e);
        }
        if (!isThisInAxisX && axisXNoTrigger) {
          axisXNoTrigger(e);
        }
        if (!isThisInPointPath && pointNoTrigger) {
          pointNoTrigger(e);
        }
      }
      this.eventList.push({ eventName: eventName, eventListener: eventListener });
      this.canvas.addEventListener(eventName, eventListener);
      return eventListener;
    }

    /**
     * 注册监听事件
     */

  }, {
    key: 'watchEvents',
    value: function watchEvents() {
      var that = this;
      var isInTable = false;
      var isInAxisX = false;
      var isInPointPath = false;

      // 注册移入事件
      this.generateEventListener('mouseenter', function mouseenter(e) {
        that.emit('mouseenter', e);
      });

      // 注册移动事件
      this.generateEventListener('mousemove', function mousemove(e) {
        that.emit('mousemove', e);
      }, function tableMousemove(e, location, indexs) {
        if (isInTable) {
          that.emit('tableMousemove', e, location, indexs);
        } else {
          that.emit('tableMouseenter', e, location, indexs);
          isInTable = true;
        }
      }, function axisXMousemove(e, location, indexs) {
        if (isInAxisX) {
          that.emit('axisXMousemove', e, location, indexs);
        } else {
          that.emit('axisXMouseenter', e, location, indexs);
          isInAxisX = true;
        }
      }, function pointMousemove(e, location, indexs) {
        if (isInPointPath) {
          that.emit('pointMousemove', e, location, indexs);
        } else {
          that.emit('pointMouseenter', e, location, indexs);
          isInPointPath = true;
        }
      }, function tableMouseleave(e, indexs) {
        if (isInTable) {
          isInTable = false;
          that.emit('tableMouseleave');
        }
      }, function axisXMouseleave(e, indexs) {
        if (isInAxisX) {
          isInAxisX = false;
          that.emit('axisXMouseleave');
        }
      }, function pointMouseleave(e, indexs) {
        if (isInPointPath) {
          isInPointPath = false;
          that.emit('pointMouseleave');
        }
      });

      // 注册移出事件
      this.generateEventListener('mouseleave', function mouseleave(e) {
        that.emit('mouseleave', e);
        isInPointPath = false;
        isInAxisX = false;
        isInTable = false;
      });

      // 注册点击事件
      this.generateEventListener('click', function click(e) {
        that.emit('click', e);
      }, function tableClick(e, location, indexs) {
        that.emit('tableClick', e, location, indexs);
      }, function axisXClick(e, location, indexs) {
        that.emit('axisXClick', e, location, indexs);
      }, function pointClick(e, location, indexs) {
        that.emit('pointClick', e, location, indexs);
      });
    }

    /**
     * 清除所有事件
     */

  }, {
    key: 'removeEvents',
    value: function removeEvents() {
      var canvas = this.canvas;
      var eventList = this.eventList;
      eventList.forEach(function (_ref8) {
        var eventName = _ref8.eventName,
            eventListener = _ref8.eventListener;

        canvas.removeEventListener(eventName, eventListener);
      });
      this.eventList = [];
    }
  }]);
  return ManyPoint;
}(EventEmitter);

return ManyPoint;

})));
