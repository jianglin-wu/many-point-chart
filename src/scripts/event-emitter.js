/**********************************************************/
/*                                                        */
/*                       事件处理器                        */
/*                                                        */
/**********************************************************/
export default class EventEmitter {
  constructor() {
    this.events = {}
  }

  //绑定事件函数
  on(eventName, callback) {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].push(callback);
  }

  //触发事件函数
  emit (eventName, ...args) {
    const events = this.events[eventName]
    if (!events) {
      return
    }

    events.forEach((event) => {
      event.apply(null, args)
    })
  }
}
