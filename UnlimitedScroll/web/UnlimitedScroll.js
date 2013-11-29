(function($){
		UnlimitedScroll = function($el,options){
			this.sWrapper = $el;	//外部容器
			this.sContent = $el.find(':first-child');	//内部容器

			this.wrapperHeight = $el.height();	//外部容器高度
			this.contentHeight = 0;		//内部容器高度

			this.arr = []; //数据数组
			this.arrLength = 0;	//数据数组长度
			this.posArr = [];	//位移数组
			this.posLength = 0;	//位移数组长度

			this.isEnd = 0;	//是否数据末尾

			this.arrStart = 0;	//页面容纳起点
			this.arrEnd = 0;	//页面容纳终点
			this.s = null;	//滚动条对象
			this.sMark = 0;	//记录滚动条当前位置

			//可传递参数
			this.options = {
				num : 10,		//每页个数
				initItem : null,	//初始化数据方法	
				getData : null,	//获取数据方法,数据数目最少为num的2倍
				loadHeight : 30,	//加载条高度
				loadPanel : $('<div>加载更多...</div>').css({
					'position': 'absolute',
					'height':'30px',
					'line-height': '30px',
					'width':'100%',
					'text-align': 'center'
				})	//加载条样式
			}
			for (i in options) this.options[i] = options[i];
			
			this.init();	//初始化
		}

		UnlimitedScroll.prototype = {
			//更新数组
			updateArr: function(index){
				var data = this.options.getData(index);
				this.isEnd = data.isEnd;
				this.arr = this.arr.concat(data.arr);
				this.arrLength = this.arr.length;
			
			},	
			//计算数据末数
			calculateArrEnd:function(){
				this.arrEnd = this.arrStart + this.options.num * 4;
				if(this.arrEnd > this.arrLength){
					this.arrEnd = this.arrLength;
				}
			},
			//计算item高度，更新位置数组
			calculateItemHeight: function($item){
				
				$item.css({
					top:this.contentHeight+'px'
				}).appendTo(this.sContent);
				
				this.posArr.push(this.contentHeight);
				this.posLength = this.posArr.length;

				var h = $item.height();
				return h;
			},
			//移除Item
			removeItem: function(start,end){
				for(var i=start;i<=end;i++){
					$('.item'+i).remove();
				}
			},
			//加载新Item
			loadNewContent: function(start,end){
				for(var i = start;i < end;i++){
					var $item = this.options.initItem(this.arr[i]);
					this.contentHeight+=this.calculateItemHeight($item);
					$item.attr('class','item'+i);
				}
				this.resetHeight();
			},
			//重新设置滚动条高度
			resetHeight: function(){
				/**
				**添加加载条高度
				**/
				if(!this.arrStart){		//初始位置为0时
					if(!this.isEnd && this.arrLength <= this.arrEnd){
						this.contentHeight += this.options.loadHeight;
					}
				}else{	//初始位置不为0时
					if(!this.isEnd && this.arrEnd == this.arrLength){
						this.contentHeight += this.options.loadHeight;
					}
				}
				
				/**
				**重置高度和滚动条
				**/
				this.sContent.height(this.contentHeight);

				if(this.s){
					this.s.refresh();
				}else{
					this.initScroll();
				}
			},
			//加载已记录Item
			resetContent: function(){
				this.sContent.html('');
				
				var buffer = this.StringBuffer();
				for(var i = this.arrStart;i < this.arrEnd;i++){
					var $item = this.options.initItem(this.arr[i]);
					$item.attr('class','item'+i).css({
						'top':this.posArr[i]+'px'
					});
					buffer.append($item[0].outerHTML);
				}
				this.sContent.append(buffer.toString());
			},
			StringBuffer: function(){
				function StringBuffer() { 
					this._strs = new Array; 
				} 
				StringBuffer.prototype.append = function (str) { 
					this._strs.push(str); 
				}; 
				StringBuffer.prototype.toString = function() { 
					return this._strs.join(""); 
				}; 	
				return new StringBuffer();
			},
			//刷新容器内容
			refreshContent: function(flag){
				if(flag == 0){
					//初始时容器内容变化
					var start = this.arrStart;
					var end = this.arrEnd;
					this.loadNewContent(start,end);
				}else if(flag == 1){
					//向下时容器内容变化
					if(this.posLength < this.arrLength && this.arrEnd == this.posLength){
						//未记录位置
						this.removeItem(this.arrStart,this.arrStart+this.options.num);
						var start = this.arrEnd;
						this.arrStart = this.arrStart + this.options.num;
						this.calculateArrEnd();
						var end = this.arrEnd;
						this.loadNewContent(start,end);
					}else{
						//已记录位置
						this.arrStart = this.arrStart + this.options.num;
						this.calculateArrEnd();
						this.resetContent();
					}
				}else if(flag == 2){
					//向上时容器内容变化
					this.arrStart = this.arrStart - this.options.num;
					this.calculateArrEnd();
					this.resetContent();
				}
			},	
			//初始化滚动条
			initScroll: function(){
				var _this = this;
				_this.s = new iScroll(_this.sWrapper[0], {
				    scrollbarClass: 'myScrollbar',
				    bounce: false,
				    checkDOMChanges: false,
				    momentum:false,
				    onBeforeScrollEnd: function(){
				    	_this.sMark = -_this.s.y;

				    	//下拉
				    	var downPosFlag = _this.arrStart + 2 * _this.options.num;
				    	if(downPosFlag < _this.arrLength){
				    		var downPos = _this.sContent.find('.item'+downPosFlag).position().top;
				    		if(_this.sMark > downPos){
				    			_this.refreshContent(1);
				    			_this.initLoad();
				    			_this.bindLoadEvent();
				    		}
				    	}
				    
				    	//上拉
				    	var upPosFlag = _this.arrStart + _this.options.num;
				    	if(upPosFlag > _this.arrEnd){
				    		upPosFlag = _this.arrEnd;
				    	}
				    	var upPos = _this.sContent.find('.item'+(upPosFlag-1)).position().top;
				    	
				    	if(_this.sMark < upPos && _this.arrStart != 0){
				    		_this.refreshContent(2);
				    	}

		    	    	
				    }
				});
			},	
			initLoad: function(){
				if(this.arrEnd == this.arrLength && !this.sContent.find(this.options.loadPanel).length && !this.isEnd){
					this.options.loadPanel.off('click');
					this.options.loadPanel.css({
						top:this.contentHeight - this.options.loadHeight
					}).appendTo(this.sContent);
				}
			},
			bindLoadEvent: function(){
				var _this = this;
				_this.options.loadPanel.on('click',function(){
					_this.contentHeight = _this.contentHeight - _this.options.loadHeight;
					_this.options.loadPanel.remove();

					_this.updateArr(_this.arrLength);
					_this.refreshContent(1);
					_this.initLoad();
				})
			},
			init: function(options){
				this.updateArr(0);
				this.calculateArrEnd();
				this.refreshContent(0);
				this.initLoad();
				this.bindLoadEvent();
			}		
		}
})(jQuery);


