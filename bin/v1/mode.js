/**
 * 数据模版生成
 * creation-time : 2018-04-03 19:30:42 PM
 */
;(function( global, factory ){
	global[ 'global' ] = global;
	if( typeof exports === 'object' ) {
		factory( require, exports, module );
	} else if (typeof define === 'function') {
		//AMD CMD
		define( 'mode', factory );
	} else {
		var MODULE = { exports : {} };
		factory( new Function, MODULE.exports, MODULE );
		global['mode'] = MODULE.exports;
	}
}( this, function( require, exports, module ) {
	/**
	 * 构造函数
	 */
	function Mode(mode) {
		this.mode 		= mode;
		this.attrs 		= this.getValues(this.mode) || [];
		this._storage_ 	= {};
	};
	var fxReName_s 		= 'this.__run_func__("$1",$2';
	var varReName_s 	= 'this._._$2$3';
	var $1 				= '$1';
	var $2 				= '$2';
	var $1$2 			= '$1$2';
	var filter 			= ['$', '?', '(', ')', '<', '>', '{', '}', '[', ']', '|', ':', '*', '+', '.', '\\'].join('|\\');
	//匹配"xxx()"的xxx
	var fxName_r 		= /([^\(]+)\(([^\)]*\))/;
	var CHECK_NAME 		= /(.*)(?:\.(\w{1,10}))$/;
	//非单字符 双字节字符
	var gt1Byte_r 		= /(?:([^\x00-\xff])\t)|([^\x00-\xff])/ig;
	var val_show_concat = '...';
	var VSC_LENGTH 		= val_show_concat.length;
	//var regExpSuffix 	= /(.{6})$/ig; ///(?:.{2}\.([^\.\W]{1,7})|.{4})$/ig;

	//var regExpSuffix_ 	= /\.(\w{1,9})$/ig;
	/**
	 * 匹配对象
	 * {?(表达式)?} == $1 {(var)} = $2 {(var)(.length)} = $2$3
	 * @type {RegExp}
	 */
	var regExp 			= /\{(?:\?\s*((?:(?!\?\}).)*)\s*\?|\s*(?:([\w-#$]+)([^\{\}]*))\s*)\}/gi;
	// var regExp 		= /\{(?:\?\s*([^\?]*)\s*\?|\s*(?:([^\?\{\}\(\)\.]*)([^\?\{\}\(\)]*))\s*)\}/ig;
	// ? () {} | : []
	var FILTER_R 		= new RegExp('(\\' + filter + ')', 'g');
	/**
	 * 简单的输出
	 * @param  {String} val 要输出的值
	 * @return {String}     输出参数值
	 */
	Mode.prototype.echo = function(val) {
		return val;
	};
	/**
	 * 
	 */
	Mode.prototype.toRegExp = function(str) {
		return new RegExp(str.replace(FILTER_R, '\\$1'), 'g');
	};
	/**
	 * 创建
	 * @param  {String} source  regExp匹配的$1
	 * @param  {String} value   regExp匹配结果
	 * @param  {Object} data    数据集
	 * @return {Mode}           对象本身
	 */
	Mode.prototype.create = function(source, value, data, index) {
		//创建对象内部临时变量
		this._ = {};
		//获取模板块级内的参数集合
		var vars = this.getValues(source);
		source = source.replace( fxName_r, fxReName_s);
		source = 'return ' + source.replace(regExp, varReName_s);
		var key;
		this._.$index = index >> 0;
		for (var i = vars.length; i--;) {
			key = vars[i].replace(regExp, $2);
			if (key === 'this') {
				this._['_this'] = data;
			} else {
				this._['_' + key] = data[key];
			}
		}
		this.val = this.val.replace(this.toRegExp(value), this.replaceFilter(this.eval(source)));
		delete this._;
		return this;
	};
	Mode.prototype.eval = function( str ) {
		return (new Function( str )).call(this);
	};
	/**
	 * 获取字符串中的模版变量
	 * @param  {String} str 字符串源
	 * @return {Array}     返回字符串变量列表数组
	 */
	Mode.prototype.getValues = function(str) {
		if (!str) str = this.mode;
		if (!str) return [];
		var list = str.match(regExp) || [];
		var map = {},
			key, newOrder = [];
		for (var i = list.length; i--;) {
			key = list[i];
			if (key in map) continue;
			map[key] = 0;
			newOrder.push(key);
		}
		map = list = null;
		return newOrder.sort(function(a, b) {
			return b.length - a.length;
		});
	};
	/**
	 * 单数据模板处理
	 * @param  {Array}      vars 模板内含有的参数集合
	 * @param  {Object}     data 数据源
	 * @param  {Function}   fx   回调
	 * @return {Mode}       对象本身
	 */
	Mode.prototype.one = function(vars, data, fx, index) {
		var key, vl, val;
		this.val = this.mode;
		if( typeof data == 'string' ) data = { $value : data };
		for (var i = 0, length = vars.length; i < length; i++) {
			key = vars[i].replace(regExp, $1$2);
			val = RegExp.$2;
			if ( val ) {
				vl = val === '$index' ? index >> 0 : data[key];
				if (/\$/.test(vl)) {
					vl = this.show(vl, 1000000);
				}
				this.val = this.val.replace(this.toRegExp(vars[i]), vl);
			} else {
				this.create(key, vars[i], data, index);
			}
		}
		if (fx instanceof Array) fx(data, this.val);
		return this;
	};
	/**
	 * 多数据模板处理
	 * @param  {Array}      vars 模板内含有的参数集合
	 * @param  {Object}     data 数据源集合
	 * @param  {Function}   fx   回调
	 * @return {Mode}       对象本身
	 */
	Mode.prototype.some = function(vars, data, fx, offset) {
		var html = '';
		for (var i = 0, length = data.length; i < length; i++) {
			html += this.one(vars, data[i], fx, offset + i).val;
		}
		this.val = html;
		return this;
	};
	/**
	 * 执行置换模板
	 */
	Mode.prototype.on = function(data, fx, offset) {
		var key = data instanceof Array ? 'some' : 'one';
		var length = this.attrs.length;
		if(length) this[key](this.attrs, data, fx, offset >> 0);

		return (!length && this.mode) || this.val;
	};

	Mode.prototype.replaceFilter = function(v) {
		return String.prototype.replace.call(v || v + '', /(\{|\$)/g, function(key) {
			return '&#' + key.charCodeAt(0) + ';';
		});
	};

	Mode.prototype.toDouble = function(name) {
		return name.replace(gt1Byte_r, '$2\t');
	};
	Mode.prototype.show = function(val, len, isShowSuffix) {
		val = val || '';
		if (!isShowSuffix) {
			if (CHECK_NAME.test(val) && RegExp.$2) {
				val = RegExp.$1;
			}
		}
		len = len || this.showlength || 20;
		var name = this.toDouble(val);
		nameL = name.length;
		if (nameL <= len) {
			return this.replaceFilter(val);
		}
		var half = ( ( len - VSC_LENGTH ) / 2 ) >> 0;
		var suffix = name.substr( 0 - half );//反取参数为负值
		name = name.substring(0, half);
		name = (name + val_show_concat + suffix).replace(gt1Byte_r, $1);
		//name = name.replace(/\t?(\.{3})\t?/, $1);
		return this.replaceFilter(name);
	};

	Mode.prototype.toString = function(val) {
		return !val ? val : val.toString().substr(1);
	};
	Mode.prototype.suffix = function(val) {
		return this.toString((val + '').match(regExpSuffix_));
	};
	/**
	 * 获取链式对象调用的方法对象
	 * @param  {String} varline  e.g :a.b.c.d.e
	 * @return {Function}         最终的e()
	 */
	Mode.prototype.__pick_var_line_ = function( varline ){
		var local = this._storage_;
		if( ! local[ varline ] ) {
			var vs;
			var rank = varline.split( '.' ), box;
			var first = rank[ 0 ];
			if( first in this ) box = this;// 先确认入口, 是模板对象还是全局对象
			else box = global;
			var i = 0, l = rank.length;
			for( ; i < l; i++ ){
				if( vs = box[ rank[ i ] ] ) {
					if( i != l - 1  ) box = vs;// 存储链式对象上线文
					continue;
				}
			}
			local[ varline ] = {
				fx 		: vs,
				parent 	: box// 获取上层对象
			};// 缓存数据关联
		}
		return local[ varline ];
	}
	/**
	 * 执行模板内的函数调用
	 */
	Mode.prototype.__run_func__ = function( fx ) {
		var setting = this.__pick_var_line_( fx );
		if( setting.fx instanceof Function ) {
			var args = Array.apply( null, arguments );
			args.shift();
			return setting.fx.apply( setting.parent, args );
		};
	};
	module.exports = Mode;
}));
