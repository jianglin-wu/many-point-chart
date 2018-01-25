var MockData = Mock.mock({
  "content|20-30": [
    {
      "pole": function() {
        var id = Mock.mock('@increment(100)');
        var stationId = Mock.mock('@increment(100)');
        return {
          "id": parseInt(id, 10),
          "poleName": "Y05-" + stationId,
          "stationId": stationId,
          "span": Mock.mock('@integer(0, 100)'),
          "kmMark": "",
          "stationOrInterval": null,
          "tensionPole": null,
          "mileage": 6360590,
          "hardSoftKind": null,
          "curveRadius": null
        }
      },
      // 弓网燃弧时间
      "ocurTimes|0-10": [
        // 时间戳毫秒数 1970-2018
      　function () {
          var time = Mock.mock('@date("yyyy/MM/dd")') + ' ' + Mock.mock('@time');
          return new Date(time).getTime();
        },
      ],
      // 弓网冲击力
      "wallops|0-10": [
        function () {
          // 正整数 0-100
          return Mock.mock('@integer(0, 100)')
        },
      ],
      // 弓网冲击加速度
      "accelerations|0-10": [
        function () {
          // 正整数 0-100
          return Mock.mock('@integer(0, 100)')
        },
      ],
      // 弓网温度
      "tempVals|0-10": [
        function () {
          // 浮点数
          return Mock.mock('@float(0, 100, 1, 3)')
        },
      ],
      // 弓网燃弧强度
      "strengths|0-10": [
        function () {
          // 浮点数
          return Mock.mock('@float(0, 100, 1, 3)')
        },
      ],
      // 接触网接触线磨损面积
      "caAbGathAreas|0-10": [
        function () {
          // 浮点数
          return Mock.mock('@float(0, 100, 1, 3)')
        },
      ],
      // 接触网接触线损耗值
      "caAbGathValues|0-10": [
        function () {
          // 浮点数
          return Mock.mock('@float(0, 100, 1, 3)')
        },
      ],
      // 接触网双支线水平距离
      "xDistances|0-10": [
        0,
      ],
      // 接触网双支线垂直距离
      "yDistances|0-10": [
        0,
      ],
      // 接触网导高
      "heights|0-10": [
        function () {
          // 浮点数
          return Mock.mock('@float(4000, 5000, 1, 3)')
        },
      ],
      // 接触网拉出值
      "staggers|0-10": [
        function () {
          // 浮点数
          return Mock.mock('@float(4000, 5000, 1, 3)')
        },
      ]
    },
  ],
});

var chratData = Mock.mock({
  status: "success",
  statusCode: "0000",
  statusMsg: "send success",
  entity: {
    content: MockData.content,
    totalElements: MockData.content.length,
  }
});

// var colorsData = Mock.mock({
//   "colors|7": [
//     function() {
//       return Mock.mock('@rgba')
//     },
//   ]
// }).colors;
// console.log(colorsData)