import Arc from './Arc';
 
class Line extends Arc { 
  
  constructor(options) {
    super(options);
    const {
      labels, font, label ,mouse,onLineClick,unikey,mapParentFrame,lineovertext
    } = options;
    Object.assign(this, {
      font,
      label,
      labels,
      mouse,
      onLineClick,unikey,mapParentFrame,lineovertext
    });
    this.last_mouse = {x:-1,y:-1}; 
  } 
  draw(context) {   
    Object.assign(context, {
      lineWidth: this.lineWidth,
      strokeStyle: this.color,
      fillStyle: this.strokeStyle
    }); 
    context.beginPath();
    context.arc(
      this.centerX,
      this.centerY,
      this.radius,
      this.startAngle,
      this.endAngle,
      false
    );
     
    context.stroke();
    if(this.mouse.enableMouseOverStatus == true){
      if(context.isPointInStroke(this.mouse.mov_mouse.x,this.mouse.mov_mouse.y)){
        if (this.label) {
          const [startLabel, endLabel] = this.labels;
          Object.assign(context, { font: this.font });
          if (this.lineovertext) {
              for(let i = 0 ;i<this.lineovertext.length ; i++){
                const x =  15; //this.startX 
                const y = 5 + (i*15);// this.startY
                context.fillText(this.lineovertext[i] , this.mouse.mov_mouse.x+ x, this.mouse.mov_mouse.y+ y);  
              }
              
          } 
        }
      }
    }
    if(this.mouse.enableClickStatus == true){
      if(context.isPointInStroke(this.mouse.cl_mouse.x,this.mouse.cl_mouse.y)){
         console.log(this.mouse.cl_mouse,this.last_mouse)
        if(this.last_mouse.x != this.mouse.cl_mouse.x || this.last_mouse.y !=this.mouse.cl_mouse.y){
          //this.onLineClick(this.unikey);  
          var json = {
            "cmd":"RE1006",
            "data": this.unikey
          }
          this.mapParentFrame.postMessage(json, '*'); 
          this.last_mouse = this.mouse.cl_mouse;  
          this.mouse.cl_mouse = {x:-1,y:-1}; 
        }  
      }
    }
    
    if (this.label) {
      const [startLabel, endLabel] = this.labels;
      Object.assign(context, { font: this.font });
      if (startLabel) {
        const x = this.startX - 15;
        const y = this.startY + 5;
        context.fillText(startLabel, x, y);
      }
      if (endLabel) {
        const x = this.endX - 15;
        const y = this.endY - 5;
        context.fillText(endLabel, x, y);
      }
    }
    context.closePath();
    this.current_context = context; 
  }
}

export default Line;
