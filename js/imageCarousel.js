/* 
 * 	版本：		v20140523-v20170425
 *
 * 	使用要求/影响：		1. 在html页面引入此js之前,应先引入jquery.js(1.11.2版本或其他合适版本)
 *
 * 	参数：
 * 		options		1. 如果options为一个json格式参数列表，则将options作为初始参数，渲染此对象，忽略第二个参数。
 * 					2. 如果options为一个string，则将此string作为函数名，param作为函数参数列表，调用插件内置的方法。
 * 					（在此种情形下，断定当前对象已经被插件渲染过了，且插件中有此内置方法。如果当前对象未被插件渲染过，或插件未内置此
 * 					方法，则打印错误信息！）
 * 		param		一个数组，存放参数。只有当options为string时才生效。
 *
 * 	示例：
 * 		<style>
			.bannerBox{ width:800px;  height: 360px; margin: 0 auto; border:1px solid #ddd; background: #D7D7D7; overflow: hidden;}
			.bannerBox>img{ width:100%; height: 100%;}
		</style>
		
		<div class="bannerBox wqzImgBox">
			<img class="wqzImgBoxItem" src="images/banner1.jpg" />
			<img class="wqzImgBoxItem" src="images/banner2.jpg" />
			<img class="wqzImgBoxItem" src="images/banner3.jpg" />
			<img class="wqzImgBoxItem" src="images/banner4.jpg" />	
		</div>
		
		$(function(){
			$(".bannerBox").wqzImgBox({
				effectType:		3,
				showDuration:	1000,
				switchDuration: 1000,
				onAfterSwitch: function(){
					console.info("onAfterSwitch");
				}
			});
		});
 * 
 * 问题记录：
 * 		1. 如果第三方插件中的jquery扩展中定义了function wqzImgBox()方法，是否会对此插件有影响？
 * 		2. 如何使showDuration不包含switchDuration？
 * 			解决：每次执行动画前清除掉定时器，执行完动画后再重新启动定时器。
 * 		3. 执行过destroy方法后（clearInterval($plugin.timer)，timerStart()还在一直循环执行
 * 			解决方案：在每次执行timerStart()前判断是否已经destroy了,在destroy方法中，对会改变文档结构的unwrap()方法，延后执行
 * 
 * gitHub：	https://github.com/wuqingzhou/imageCarousel
 * 
 * 作者：	吴庆周 Email：wuqingzhou1989@yeah.net QQ：971532380
 * 
 */
$.fn.wqzImgBox?console.error("jQuery插件冲突！\n文件："+decodeURIComponent(document.scripts[document.scripts.length-1].src)+"\n冲突原因：命名空间重复\n冲突详情：$.fn.wqzImgBox此命名空间已存在！\n插件已停止运行！"):
(function($){
	$.fn.wqzImgBox = function(options,param){
		// 执行对外开放的方法
		if (typeof options === "string"){
			var state = this.data("_wqzImgBox");
			var method;
			if (state){	// 当前对象已被初始化过
				method = $.fn.wqzImgBox.methods[options];
				if (method){	// 插件中存在此方法
					return method(this,param);
				}else{
					console.error("错误：wqzImgBox插件未提供此方法："+options);	
				}
				return this;
			}else{
				console.error("错误："+this[0].outerHTML+"元素尚未被wqzImgBox插件渲染过！无法调用方法："+options);
			}
			return this;
		}

		// 渲染插件
		return this.each(function(){
			var _options = $.extend(true,{},$.fn.wqzImgBox.defaultSettings,options||{});
			var plugin = new wqzImgBox(_options,$(this));
			plugin.generate();
			$(this).data("_wqzImgBox",plugin);
		});
	};

	// 默认配置
	$.fn.wqzImgBox.defaultSettings = {
		effectType:		0,			// 要执行的特效的编号
									// 0：表示水平切换
									// 1: 淡入淡出切换
									// 2: 挤压切换
									// 3: 擦除切换
		showDuration:	1000,		// 每张图片显示的时长（不包含切换时间）
		switchDuration:	200,		// 切换图片所花时间
		easing:	"linear",			// 要使用的擦除效果的名称。提供"linear" 和 "swing" 和 "ease"
		btBar:{
			enable:	false,			// 是否显示底部工具栏
			align:	"center",		// 底部工具栏布局方式(left,right,center)
			enableSwitch:	false,	// 是否允许通过底部工具栏来切换图片
			switchType:	"click",	// 底部工具栏切换图片的默认触发方式。默认为"click"
			gap:		10,			// 每个元素之间的间隙
			
			bottomPx:	10,			// 底部工具栏距离底部的距离,单位为px
			leftPx:	10,				// 底部工具栏距离左侧的距离(前提是底部工具栏水平方向布局方式为left)
			rightPx:	10			// 底部工具栏距离右侧的距离(前提是底部工具栏水平方向布局方式为right)
		},
		sideBar:{
			enable:	false			// 是否显示侧边栏
		},
		onAfterSwitch:	function(){}
	};
	
	// 对外方法
	$.fn.wqzImgBox.methods = {
		// 注销此对象上的插件
		destroy: function($elem,param){
			var $plugin = $elem.data("_wqzImgBox");
//			console.info("destroy: " + $plugin.timerArray.toString());
			$plugin.enable = false;
			clearInterval($plugin.timer);
			if( $plugin._options.btBar.enable ){
				$plugin.$btBar.remove();
			}
//			if( $elem.data("_wqzImgBox")._options.sideBar.enable ){
//				$elem.data("_wqzImgBox").$ltSideBar.remove();
//				$elem.data("_wqzImgBox").$rtSideBar.remove();
//			}
			if($plugin._options.effectType == 3){
				setTimeout(function(){
					$elem.find(".wqzImgBoxItem").unwrap();					
				},100);
			}
//			clearInterval($plugin.timer);
			$elem.removeData("_wqzImgBox");
		}
	};

	// 插件对象
	function wqzImgBox(_options,$elem){
		this._options = _options;
		this.$elem = $elem;						// 目标对象
		this.$imgChild = $elem.find(".wqzImgBoxItem");		// 目标容器中的图片
		this.curImgNo = 0;						// 当前显示的图片编号
		this.tgtImgNo = 1;						// 将要显示的图片的编号
		this.$btBar = null;						// 底部工具栏
//		this.$btBarChild = null;				// 底部工具栏子项
//		this.$ltSideBar = null;					// 左侧工具栏
//		this.$rtSideBar = null;					// 右侧工具栏
		this.timer = null;						// 定时器
		this.enable = true;
//		this.curTime = (new Date()).getTime();	// 当前时间
//		this.timerArray = new Array();			// 生成过的定时器列表
	};
		
	/* 
	 * 插件对象原型扩展
	 * 	generate		生成插件
	 * 	layout			布局
	 * 	bindEvent		绑定事件
	 * 	containerLayout	目标容器布局
	 * 	timerStart		启动定时器
	 * 	showNextImg		显示下一张图片
	 * 	imgSwitch		切换图片
	 */
	wqzImgBox.prototype = {
		generate: function(){	// 生成插件
			this.enable = true;
			this.layout();		// 布局
			this.bindEvent();	// 绑定事件
		},
		layout: function(){			// 布局
			var $plugin = this;
			$plugin.containerLayout();	// 目标容器布局
			if($plugin._options.btBar.enable){
				$plugin.btBarLayout();	// 底部工具栏布局
			}
//			$plugin.sideBarLayout();	// 侧边栏布局
		},
		bindEvent: function(){	// 绑定事件
			this.timerStart();	// 定时器
//			this.btBarEvent();	// 底部工具栏事件
//			this.sideBarEvent();	// 侧边栏事件
		},
		containerLayout: function(){	// 目标容器布局
			var $plugin = this;
			var effectTypeName = "en" + $plugin._options.effectType;
			
			// 初始化目标元素
			$plugin.$elem.css({
				overflow:	"hidden"
			});
			if ($plugin.$elem.css("position") == "static"){
				$plugin.$elem.css("position","relative");
			}
			// 初始化图片
			($plugin.effectInit[effectTypeName] || $plugin.effectInit["en0"])($plugin);
		},
		btBarLayout: function(){	// 底部工具栏布局
			var $plugin = this;
			var imgNumber = $plugin.$imgChild.length;
			
			// 底部工具栏容器
			var $btBar = $("<div></div>").css({
				"z-index":	999,
				position:	"absolute",
				bottom:		$plugin._options.btBar.bottomPx
			});
			if($plugin._options.btBar.align=="right"){
				$btBar.css("right",$plugin._options.btBar.rightPx);
			}else if($plugin._options.btBar.align=="left"){
				$btBar.css("left",$plugin._options.btBar.leftPx);
			}else{
				$btBar.css({
					margin:	"0 auto"
				});
			}
			
			// 底部工具栏小点
			for(var i=0; i<imgNumber; i++){
				var $btBarNode = $("<div></div>").css({
					"margin-right": (i==imgNumber-1)?0:$plugin._options.btBar.gap,
					background:	"#868686",
					opacity:	0.8,
					float:		"left",
					width: 		"16px",
					height: 	"16px",
					"border-radius":	"50%"
				}).hover(function(){
					$(this).css("background","#4BA2EF");
				},function(){
					$(this).css("background","#868686");
				}).appendTo($btBar);
			}
			
			$btBar.appendTo($plugin.$elem);
			$plugin.$btBar = $btBar;
		},
		timerStart: function(){			// 启动定时器
			var $plugin = this;
			$plugin.timer = setTimeout(function(){
				$plugin.showNextImg();
			},$plugin._options.showDuration);
			console.info("已绑定定时器： " + $plugin.timer);
//			$plugin.timerArray.push($plugin.timer);
		},
		showNextImg: function(){		// 显示下一张图片
			var $plugin = this;
			$plugin.tgtImgNo = ($plugin.curImgNo+1)%$plugin.$imgChild.length;
			$plugin.imgSwitch($plugin.curImgNo,$plugin.tgtImgNo,"rollToLeft");
		},
		imgSwitch: function(curImgNo,tgtImgNo,rollTo){		// 切换图片。
			// curImgNo:	表示当前图片编号
			// tgtImgNo：	表示目标图片编号
			// rollTo：		表示滚动方向。rollToLeft：表示向左滚；rollToRight：表示向右滚；null或其他值表示：滚动不分左右
			var $plugin = this;
			var effectTypeName = "en" + $plugin._options.effectType;
			($plugin.effectList[effectTypeName] || $plugin.effectList["en0"])($plugin,curImgNo,tgtImgNo,rollTo,function(){
				// 切换完后执行回调函数
				$plugin.curImgNo = $plugin.tgtImgNo;
				if($plugin._options.btBar.enable){
					$plugin.$btBar.children().css("background","#868686").eq($plugin.curImgNo).css("background","#4BA2EF");
				}
				$plugin._options.onAfterSwitch.call($plugin.$imgChild.eq($plugin.curImgNo)[0]);
				
				if($plugin.enable){
					$plugin.timerStart();				// 启动定时器
				}
			});
		},
		/*=================================== 图片切换效果初始化 开始 ====================================================*/
		effectInit:	{	// 图片切换效果初始化
			en0: function($plugin){			// 水平切换初始化
				$plugin.$imgChild.each(function(index,dom){
					$(this).css({
						width:	"100%",
						height:	"100%",
						position:	"absolute",
						left:	0,
						top:	index==0?0:"100%"
					});
				});
			},
			en1: function($plugin){			// 淡入淡出切换初始化
				$plugin.$imgChild.each(function(index,dom){
					$(this).css({
						width:	"100%",
						height:	"100%",
						position:	"absolute",
						left:	0,
						top:	0,
						display: index==0?"display":"none"
					});
				});
			},
			en2: function($plugin){			// 挤压切换初始化
				var imgNumber = $plugin.$imgChild.length;
				$plugin.$imgChild.each(function(index,dom){
					$(this).css({
						"z-index":	imgNumber - index,
						width:	"100%",
						height:	"100%",
						position:	"absolute",
						top:	0,
						display:	index==0?"block":"none"
					});
				});
			},
			en3: function($plugin){			// 擦除切换初始化
				var imgNumber = $plugin.$imgChild.length;
				$plugin.$imgChild.each(function(index,dom){
					$(this).css({
//						"z-index":	imgNumber - index,
						width:	$plugin.$elem.innerWidth(),
						height:	$plugin.$elem.innerHeight(),
						position:	"absolute",
						left:	0,
						top:	0,
						overflow:	"hidden"
					}).wrap(function(){
						return $("<div></div>").css({
//							"z-index":	$(this).css("z-index"),
							"z-index":	imgNumber - index,
							width: "100%",
							height:	"100%",
							position:	"absolute",
							left:	0,
							top:	0,
							display:	index==0?"block":"none"
						})
					});
				});
			}
		},
		/*=================================== 图片切换效果初始化 结束 ====================================================*/
		/*=================================== 图片切换效果 开始 ==========================================================*/
		effectList: {
			en0: function($plugin,curImgNo,tgtImgNo,rollTo,callback){	// 水平切换
				var $cur = $plugin.$imgChild.eq(curImgNo);		// 当前图片
				var $target = $plugin.$imgChild.eq(tgtImgNo);	// 目标图片
				var duration = $plugin._options.switchDuration;
				var easing = $plugin._options.easing=="linear"?"linear":"swing";
				var curLtRst = 0;								// 当前图片最终left值
				var targetLtInit = 0;							// 目标图片初始left值
				var targetLtRst = "0%";							// 目标图片最终left值
				
				if(rollTo=="rollToRight"){
					targetLtInit = "-100%";
					curLtRst = "100%";
				}else{
					targetLtInit = "100%";
					curLtRst = "-100%";
				}
				
				// 初始化元素初始位置
				$cur.css({
					top:	0,
					left:	0
				});
				$target.css({
					top:	0,
					left:	targetLtInit
				});
	
				// 执行动画
				$cur.animate({
					left:	curLtRst
				},duration,easing);
				$target.animate({
					left:	targetLtRst
				},duration,easing,callback);
			},
			en1: function($plugin,curImgNo,tgtImgNo,rollTo,callback){	// 淡入淡出切换
				var $cur = $plugin.$imgChild.eq(curImgNo);		// 当前图片
				var $target = $plugin.$imgChild.eq(tgtImgNo);	// 目标图片
				var duration = $plugin._options.switchDuration;
				var easing = $plugin._options.easing=="linear"?"linear":"swing";
				
				// 执行动画
				$cur.fadeOut(duration,easing);
				$target.fadeIn(duration,easing);
				
				// 执行回调函数
				setTimeout(function(){
					callback();
				},duration);
			},
			en2: function($plugin,curImgNo,tgtImgNo,rollTo,callback){	// 挤压切换
				var $cur = $plugin.$imgChild.eq(curImgNo);		// 当前图片
				var $target = $plugin.$imgChild.eq(tgtImgNo);	// 目标图片
				var duration = $plugin._options.switchDuration;
				var easing = $plugin._options.easing=="linear"?"linear":"swing";
				var curCssInit,targetCssInit;
				
				if(rollTo=="rollToRight"){
					curCssInit = {
						width:		"100%",
						display:	"block",
						right:		0,
						left:		"auto"
					};
					targetCssInit = {
						width:		"0%",
						display:	"block",
						left:		0,
						right:		"auto"
					}
				}else{
					curCssInit = {
						width:		"100%",
						display:	"block",
						left:		0,
						right:		"auto"
					};
					targetCssInit = {
						width:		"0%",
						display:	"block",
						right:		0,
						left:		"auto"
					}
				}
				
				$cur.css(curCssInit);
				$target.css(targetCssInit);
				
				$cur.animate({
					width:	"0%"
				},duration,easing);
				$target.animate({
					width:	"100%"
				},duration,easing);
				
				// 执行回调函数
				setTimeout(function(){
					callback();
				},duration);
			},
			en3: function($plugin,curImgNo,tgtImgNo,rollTo,callback){	// 擦除切换
				var $cur = $plugin.$imgChild.eq(curImgNo);		// 当前图片
				var $target = $plugin.$imgChild.eq(tgtImgNo);	// 目标图片
				var duration = $plugin._options.switchDuration;
				var easing = $plugin._options.easing=="linear"?"linear":"swing";
				var imgNumber = $plugin.$imgChild.length;
				var curCssInit,targetCssInit;
				
				$plugin.$imgChild.parent().hide();
				if(rollTo=="rollToRight"){
					curCssInit = {
						width:		"100%",
						display:	"block",
						right:		0,
						left:		"auto"
					};
					targetCssInit = {
						width:		"100%",
						display:	"block",
						left:		0,
						right:		"auto"
					}
				}else{
					curCssInit = {
						width:		"100%",
						display:	"block",
						left:		0,
						right:		"auto"
					};
					targetCssInit = {
						width:		"100%",
						display:	"block",
						right:		0,
						left:		"auto"
					}
				}
				
				$cur.parent().css(curCssInit);
				$target.parent().css(targetCssInit);
				
				$cur.parent().animate({
					width:	"0%"
				},duration,easing);
				$target.parent().animate({
					width:	"100%"
				},duration,easing);
				
				// 执行回调函数
				setTimeout(function(){
					$cur.parent().hide().css("z-index",$cur.css("z-index"));
					$target.parent().css("z-index",imgNumber+2);
					callback();
				},duration);
			}
		}
		
		/*=================================== 图片切换效果 结束 ==========================================================*/
	};
})(jQuery)
