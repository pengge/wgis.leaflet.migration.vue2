import linearScale from 'uc-fun/lib/linearScale';
import Line from './Line';
import Pulse from './Pulse';
import Spark from './Spark';
import { extend } from './utils';
import { STYLE } from './config';
import Popover from './popver';

const mergeStyle = (style) => {
  if (!style) return STYLE;

  return { ...STYLE, ...style };
};

class Migration {
  // options = { map, canvas, data, options, container }
  constructor({ options, container, ...otherOptions }) {
    const {
      replacePopover, onShowPopover, onHidePopover, direction, order,onLineClick,enableMouseOverStatus,enableClickStatus,mapParentFrame, ...style
    } = options;
    Object.assign(this, {
      ...otherOptions,
      direction,
      container,
      order: order || false,
      style: mergeStyle(style),
      playAnimation: true,
      started: false,
      store: {
        arcs: [],
        pulses: [],
        sparks: []
      },
      mouse:{
        //点击的鼠标点情况
        cl_mouse:{
          x:-1,
          y:-1
        }, 
        //点击的鼠标点情况
        mov_mouse:{
          x:-1,
          y:-1
        }, 
        enableMouseOverStatus,
        enableClickStatus
      },
      mapParentFrame,
     
      onLineClick,
    });
     
    this.popover = new Popover({
      replacePopover, onShowPopover, onHidePopover, container
    });
    this.context = this.canvas.getContext('2d');
    //加入事件 
    let that = this;
    if(this.mouse.enableMouseOverStatus == true ){
      this.canvas.addEventListener('mousemove', function(event) {//mousemove
       
        //标准的获取鼠标点击相对于canvas画布的坐标公式  
        var x = event.clientX - that.canvas.getBoundingClientRect().left;
        var y = event.clientY - that.canvas.getBoundingClientRect().top;
        that.mouse.mov_mouse.x = x;
        that.mouse.mov_mouse.y = y; 
    
      }, false); 
    }
    
    if(this.mouse.enableClickStatus == true){
        this.canvas.addEventListener('click', function(event) {//onclick
       
        //标准的获取鼠标点击相对于canvas画布的坐标公式 
        //console.log('当前鼠标点击位置',event.clientX,event.clientY); 
        var x = event.clientX - that.canvas.getBoundingClientRect().left;
        var y = event.clientY - that.canvas.getBoundingClientRect().top;
        that.mouse.cl_mouse.x = x;
        that.mouse.cl_mouse.y = y;  
        }, false);
    }

  
   
      
  }

  _onclick(e) {
     console.log(e)
  }

  setStyle(style) {
    this.style = mergeStyle(style);
    this.refresh();
  }

  setData(data) {
    this.data = data;
    this.refresh();
  }

  /*
   * 更新数据
   */
  refresh() {
    const { data, direction } = this;
    if (!data || data.length === 0) {
      return;
    }
    this.clear();

    const dataRange = extend(data, i => i.value);
    const {
      popover,
      container, style: {
        arcWidth, minRadius, label, maxRadius
      }
    } = this;
    const radiusScale = linearScale(dataRange, [minRadius, maxRadius || 2 * minRadius]);
    let mouse = this.mouse;
    let onLineClick = this.onLineClick;
    let mapParentFrame = this.mapParentFrame;
    data.forEach((item, index) => {
       //console.log('item',item);
      const {
        from, to, labels, color,unikey,lineovertext
      } = item; 
      const arc = new Line({
        startX: from[0],
        startY: from[1],
        endX: to[0],
        endY: to[1],
        labels, label, width: arcWidth, color,mouse,onLineClick,unikey,mapParentFrame,lineovertext
      });
      // const zoom = this.map.getZoom();
      const radius = radiusScale(item.value);
      // 计算每一个圆环的大小
      let pulseOption = {
        x: to[0],
        y: to[1],
        dataRange,
        radius,
        maxRadius,
        container,
        index,
        data: item,
        popover
      };
      if (direction === 'in') {
        pulseOption = Object.assign(pulseOption, { x: from[0], y: from[1] });
      }
      // 圆环脉冲
      const pulse = new Pulse(pulseOption);
      const spark = new Spark({
        startX: from[0],
        startY: from[1],
        endX: to[0],
        endY: to[1],
        width: minRadius,
        color,
        direction
      });

      this.store.arcs.push(arc);
      this.store.pulses.push(pulse);
      this.store.sparks.push(spark);

      this.index = 0;
    });

    this.start();
  }

  clear() {
    this.store.pulses.forEach(pulse => pulse.clear());
    this.store = {
      arcs: [],
      pulses: [],
      sparks: []
    };
    // 更新状态
    this.playAnimation = true;
    this.started = false;
    // 清除绘画实例，如果没有这个方法，多次调用start，相当于存在多个动画队列同时进行
    window.cancelAnimationFrame(this.requestAnimationId);
  }

  draw(shapes) {
    const { context } = this;
    shapes.forEach(shap => shap.draw(context));
    for (let i = 0, len = shapes.length; i < len; i++) {
      shapes[i].draw(context);
    }
  }

  start() {
    const {
      started, store, context, canvas: { width, height }, order
    } = this;
    if (!started) {
      this.draw(store.pulses);
      const drawFrame = () => {
        this.requestAnimationId = window.requestAnimationFrame(drawFrame);
        if (this.playAnimation) {
          context.clearRect(0, 0, width, height);
          Object.keys(store).forEach((key) => {
            const shapes = store[key];
            if (order && key === 'sparks') {
              const item = shapes[this.index];
              item.draw(context, order);
              if ((item.endAngle - item.trailAngle) * 180 / Math.PI < 0.5) {
                item.trailAngle = item.startAngle;
                if (this.index < shapes.length - 1) {
                  this.index += 1;
                } else {
                  this.index = 0;
                }
              }
            } else { 
              shapes.forEach(shap => shap.draw(context));
            }
          });
        }
      };
      drawFrame();
      this.started = true;
    }
  }

  play() {
    this.playAnimation = true;
  }

  pause() {
    this.playAnimation = false;
  }
}

export default Migration;
