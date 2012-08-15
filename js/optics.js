var Naduism = Naduism || {};
Naduism.optics = Naduism.optics || {};
Naduism.optics.point = (function(){
	var x,y;
	function init(_x,_y){
		return {x :_x , y :_y};
	}

	return {
		init:init
	};
}());

Naduism.optics.object = (function(){
	// coordinates of the object on the axis
	// and height of the object
	var ht,position,dist;
	function create(context, distance, height){
		console.log("create object pos", distance);
		var lc = Naduism.optics.lens.getLensCenter();
		Naduism.optics.line.drawArrow(context, {x:lc.x - distance, y:(lc.y-height)}, {x:lc.x-distance, y:lc.y}, {});
		ht = height;
		console.log(ht);
		position = {x:lc.x-distance,y:lc.y};
		dist = distance;
		return this;
	}
	function getHeight(){
		return ht;
	}
	function getDistance(){
		return dist;
	}
	function getPosition(){
		return position;
	}


	return {
		create:create,
		getHeight: getHeight,
		getPosition: getPosition,
		getDistance: getDistance
	}
}());

Naduism.optics.lens = (function(){

	var principalAxis = 0,
	lensCenter = {x:0, y:0},
	type, focalLength, showImage = false, image ;
	function createPrincipalAxis(context,position){
		Naduism.optics.line.draw(context,{x:0, y:position.y}, {x:context.canvas.width, y:position.y}, {});
		principalAxis = position.y;
		lensCenter.x = position.x;
		lensCenter.y = position.y;
	}

	function getLensCenter(){
		return lensCenter;
	}
	// for now you can create lens only in the center
	// TODO make it mor flexible
	function create(context, _type, _focalLength, position){
		type = _type || 'convex';
		focalLength = _focalLength;
		createPrincipalAxis(context, position);

		if(type === 'convex'){
			drawConvexLens(context, {x:0, y:0}, 15,{});
			Naduism.optics.util.mark(context, {x:position.x-focalLength, y:principalAxis});
			Naduism.optics.util.mark(context, {x:position.x+focalLength, y:principalAxis});
		}
		else{
			drawConcaveLens(context, {x:0, y:0}, 35,{});
		}
		
		return this;
	}

	function getType(){return type;}
	function getFocalLength(){return focalLength;}

	function drawConvexLens(ctxt,center,radius, options){
		console.log(ctxt,center,radius, options);
		ctxt.save();
		ctxt.translate(ctxt.canvas.width/2, ctxt.canvas.height/2);
		ctxt.scale(1,9);
		ctxt.beginPath();
		ctxt.arc(center.x, center.y, radius, 0, 2*Math.PI, false);
		// draw lines in the lens
		ctxt.moveTo(center.x-radius,center.y);
		ctxt.lineTo(center.x+radius, center.y);	
		ctxt.moveTo(center.x,center.y-radius);
		ctxt.lineTo(center.x, center.y+radius);	
		ctxt.restore();
		ctxt.fillStyle = options.fillColor || '#ddd';
		ctxt.fill();
		ctxt.strokeStyle = options.strokeColor || '#999';
		ctxt.lineWidth = options.lineWidth || 1;
		ctxt.stroke();
	}

	function drawConcaveLens(ctxt,center,radius, options){
		console.log("no concave lens yet");
		//drawConvexLens(ctxt,center,radius, options);
	}

	function getSlope(pt1, pt2){
		return (pt2.y - pt1.y)/(pt2.x - pt1.x);
	}
	function getIntercept(m, pt){
		return pt.y - m*pt.x;
	}

	function calculateImagePos(object){
		//1/v+1/u = 1/f
		var v = (focalLength*object.getDistance())/(object.getDistance()-focalLength);
		image = {y:lensCenter.y, x:v+lensCenter.x, height:Math.abs(object.getHeight()*v/object.getDistance())};
		console.log("image=", image);
	}

	function animate(context,start,end,m,c,boundaryCondition,time){
		//console.log(end.x,end.y);
		// new end x and y
		var x,y;
		// draw line
		Naduism.optics.line.draw(context, start, {x:end.x, y:end.y}, {color:'#999'});	
		// increase x by some pixels then calculate y (new end points)
		x = end.x+10;
		y = m*x + c;
		// check for boundary condition
		// and call animate with the old end as starting point and end point
		//if(x < context.canvas.width && y < context.canvas.height){
		if(boundaryCondition.call(null,x,y)){
			setTimeout(function(){
					animate(context,end,{x:x,y:y},m,c,boundaryCondition,time);
				}
			, time);
		}
	}

	function rayThroughLensCenter(context, obj){
		// need object height
		// lens center position
		var objPos = obj.getPosition(),
		startPos =  {x:objPos.x, y:objPos.y - obj.getHeight()},
		endPos = getLensCenter(),
		x = x0 = startPos.x, y = y0 = startPos.y,
		m = getSlope(startPos,endPos),
		c = getIntercept(m, startPos);
		if(!image) calculateImagePos(obj);
		//Naduism.optics.line.draw(context, startPos, endPos);
		// calculate y = mx+c, then for every x until canvas width, keep calculating y
		// and keep redrawing the line from the beginning
		//console.log(startPos);
		animate(context,startPos,{x:x, y:y},m,c,function(x,y){
				if(x <= context.canvas.width && y <= context.canvas.height){
					return true;
				}else return false;
			},500);
	}

	
	function rayParallelToAxis(context, obj){
		// get object height
		// get lens focal length
		var objPos = obj.getPosition(),
		startPos =  {x:objPos.x, y:objPos.y - obj.getHeight()},
		endPos = {x:startPos.x+obj.getDistance(), y:startPos.y},
		m = getSlope(startPos, endPos),
		c = getIntercept(m,startPos);
		if(!image) calculateImagePos(obj);
		// animate till lens - parallel
		animate(context,startPos,startPos,m,c,function(x,y){
				if(x <= lensCenter.x){
					return true;
				}else {
					// now animate from lens through focal point on the the other side
					startPos = endPos;
					endPos = {x:lensCenter.x + focalLength, y:lensCenter.y};
					m = getSlope(startPos, endPos),
					c = getIntercept(m,startPos);
					animate(context,startPos,startPos,m,c,function(x,y){
							if(x <= context.canvas.width && y <= context.canvas.height){
								return true;
							}else return false;
						},500);
						
					return false;
				}
			},500);

		


		//Naduism.optics.line.draw(context, startPos, {x:startPos.x+obj.getDistance(), y:startPos.y});
	}
	function rayThroughFocalPoint(context, obj){
		// get object height
		// get lens focal length
		// lens center position
		var objPos = obj.getPosition(),
		startPos =  {x:objPos.x, y:objPos.y - obj.getHeight()},
		endPos = {x:lensCenter.x - focalLength, y:lensCenter.y},
		m = getSlope(startPos, endPos),
		c = getIntercept(m,startPos);
		if(!image) calculateImagePos(obj);
		animate(context,startPos,startPos,m,c,function(x,y){
				if(x <= lensCenter.x){
					return true;
				}else {
					// now animate from lens parallel to principal axis
					startPos.x = lensCenter.x;
					startPos.y = m*startPos.x + c;
					m = 0;
					c = getIntercept(m,startPos);
					animate(context,startPos,startPos,m,c,function(x,y){
							if(x > image.x && !showImage){
								displayImage(context);
								showImage = true;
							}
							if(x < context.canvas.width){
								return true;
							}else return false;
						},500);
						
					return false;
				}
			},500);
		
		//Naduism.optics.line.draw(context, startPos, {x:endPos.x - focalLength, y:endPos.y});
	}

	function displayImage(context){
		var head = {x:image.x, y:image.height+image.y},
		foot = {x:image.x, y:image.y};
		Naduism.optics.line.drawArrow(context,head,foot);
		image = undefined;
	}


	return {
		rayThroughFocalPoint : rayThroughFocalPoint,
		rayParallelToAxis : rayParallelToAxis,
		rayThroughLensCenter : rayThroughLensCenter,
		create: create,
		getLensCenter: getLensCenter,
		getType: getType
	}

}());


// Naduism.optics.ray = (function (){
// 	function rayThroughLensCenter(object,lens){
// 		// need object height, position
// 		// lens center position
// 		console.log(object.getPosition());
// 	}

// 	return {
// 		// throughFocalPoint : rayThroughFocalPoint,
// 		// parallelToAxis : rayParallelToAxis,
// 		throughLensCenter : rayThroughLensCenter
// 	}

// }());


Naduism.optics.line = (function (){
		function drawArrow(ctxt,head,foot, options){
			options = options || {};
			console.log("head = ",head);
			console.log("foot = ",foot);
			ctxt.beginPath();
			ctxt.moveTo(foot.x,foot.y);
			ctxt.lineTo(head.x,head.y);	
			//draw head
			if(foot.y > head.y && foot.x == head.x){
				ctxt.lineTo(head.x+10, head.y+10);
				ctxt.moveTo(head.x,head.y);
				ctxt.lineTo(head.x-10, head.y+10);
			}else if(foot.y <= head.y && foot.x == head.x){ // downward arrow
				ctxt.lineTo(head.x+10, head.y-10);
				ctxt.moveTo(head.x,head.y);
				ctxt.lineTo(head.x-10, head.y-10);
			}else if(foot.x > head.x && foot.y == head.y){ // lefttward
				ctxt.lineTo(head.x+10, head.y+10);
				ctxt.moveTo(head.x,head.y);
				ctxt.lineTo(head.x+10, head.y-10);
			}else if(foot.x <= head.x && foot.y == head.y){ //rightward
				ctxt.lineTo(head.x-10, head.y+10);
				ctxt.moveTo(head.x,head.y);
				ctxt.lineTo(head.x-10, head.y-10);
			}
			ctxt.strokeStyle = options.color || '#333';
			ctxt.lineWidth = options.lineWidth || 3;
			ctxt.lineJoin = "round";
			ctxt.stroke();
		}

		function drawLine(ctxt,start,end, options){
			options = options || {};
			ctxt.beginPath();
			ctxt.moveTo(end.x,end.y);
			ctxt.lineTo(start.x,start.y);	
			ctxt.strokeStyle = options.color || '#333';
			ctxt.lineWidth = options.lineWidth || 1;
			ctxt.stroke();
		}

		return {
			draw : drawLine,
			drawArrow : drawArrow
		}
}());

Naduism.optics.circle = (function(){
	
	function drawCircle(ctxt,center,radius, options){
		ctxt.beginPath();
		ctxt.arc(center.x, center.y, radius, 0, 2*Math.PI, false);
		ctxt.fillStyle = options.fillColor || '#ddd';
		ctxt.fill();
		ctxt.strokeStyle = options.strokeColor || '#bbb';
		ctxt.lineWidth = options.lineWidth || 1;
		ctxt.stroke();
	}
	
	return {
		drawCircle: drawCircle
	}
}());

Naduism.optics.util = (function(){
	function mark(ctxt, point, options){
		options = options || {};
		var radius = options.radius || 3;
		ctxt.beginPath();
		ctxt.arc(point.x, point.y, radius, 0, 2*Math.PI, false);
		ctxt.fillStyle = options.fillColor || '#333';
		ctxt.fill();
	}
	return {
		mark: mark
	}
}());


