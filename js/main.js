function drawSheetBackground(context){
	console.log(context.canvas.clientWidth, context.canvas.height);
	var c_width = context.canvas.width,
	c_height = context.canvas.height;
	for(var x=0;x<c_width;x+=10){
		context.moveTo(x,0);
		context.lineTo(x,c_height);	
	}
	for(var y=0;y<c_height;y+=10){
		context.moveTo(0,y);
		context.lineTo(c_width,y);
	}
	context.strokeStyle = "#eee";
	context.stroke();
}

$(document).ready(function(){
	var canvas =  document.getElementById('sheet'),
	context = canvas.getContext('2d'),
	focalLength = 40,
	objectDistance = 120,
	principalAxisPosition = context.canvas.height/2,
	lib = Naduism.optics,
	lens, ob;
	drawSheetBackground(context);
	head = lib.point.init(20,130);
	foot = lib.point.init(20,60);
	// draw principle axis
	//lib.line.draw(context,{x:0, y:principalAxisPosition}, {x:context.canvas.width, y:principalAxisPosition}, {});
	// create lens, pass type of lens, focal point, lens center
	var lens = lib.lens.create(context,"convex", focalLength, {x:context.canvas.width/2, y:principalAxisPosition});
	// create object, pass distance from lens center, height
	//var ob = lib.object.create(context,objectDistance, 50);
	//lens.rayThroughLensCenter(context, ob);
	//lens.rayParallelToAxis(context, ob);
	//lens.rayThroughFocalPoint(context, ob);

	$('#outer-container').on('click', '#play', function(){
		context.clearRect(0,0,canvas.width, canvas.height);
		drawSheetBackground(context);
		lens = lib.lens.create(context,"convex", $('#fLength').val() !== NaN ? parseFloat($('#fLength').val()) : 30, {x:context.canvas.width/2, y:principalAxisPosition});
		console.log('lens = ', lens);
		ob = lib.object.create(context,$('#objDist').val() !== NaN ? parseFloat($('#objDist').val()) : 120, 50);
		lens.rayThroughLensCenter(context, ob);
		lens.rayParallelToAxis(context, ob);
		lens.rayThroughFocalPoint(context, ob);
	})
		
})

