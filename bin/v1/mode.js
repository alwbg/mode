/**
 * 数据模版生成
 * creation-time : 2019-09-20 12:06:49 PM
 */
;(function( global, factory ){
	global[ 'global' ] = global;
	if( typeof exports === 'object' ) {
		factory( require, exports, module );
	} else if (typeof define === 'function') {
		//AMD CMD
		define( 'mode', factory );
	} else {
		var funcName = 'require';
		if( funcName && !global[ funcName ] ) {
			global[ funcName ] = function( id ) {
				return global[ id ];
			};
		};
		var MODULE = { exports : {} };
		factory( global[ funcName ] || function( id ) {
			alert( '需要实现 require(),加载模块:"' + id + '"' );
		}, MODULE.exports, MODULE );
		global[ 'mode' ] = MODULE.exports;
	}
}( this, function( require, exports, module ) {
	/**
	 * 构造函数
	 */
	function Mode(mode) {
		this.mode = mode;
		this.attrs = this.getValues(this.mode) || [];
		this._storage_ = {};
	};
	var SPACE = '';
	var $1 = '$1';
	var $2 = '$2';
	var $more = '$1$2$3';
	var RETURN = 'return ';
	var STR_DOWN_LINE = '_';
	var STR_DEFAULT = 'default';
	var SOME = 'some';
	var ONE = 'one';
	var G = 'g';
	// 
	var S_FUNX_RELOAD = 'this.__run_func__("$1",this.__check_args__($2))';
	var S_VAR_RENAME = 'this._._$2$3';
	var VAL_SHOW_CONCAT = '...';
	var DOT = '.';
	var TO_2BYTE = '$2\t';

	// 匹配"FX(arg1[,...])"的FX
	var R_FUNC_ARGS = /([^\(+\*]+)\(((?:(?!\)[\s;]*$).)*)\)/;
	var R_SHOW_SUFFIX = /(.*)(?:\.(\w{1,10}))$/;

	//非单字符 双字节字符
	var R_GET1BYTE = /(?:([^\x00-\xff])\t)|([^\x00-\xff])/ig;
	var VSC_LENGTH = VAL_SHOW_CONCAT.length;

	// 过滤的字符
	var filter = ['$', '?', '(', ')', '<', '>', '{', '}', '[', ']', '|', ':', '*', '+', DOT, '\\'].join('|\\');
	/**
	 * 匹配对象
	 * {?(表达式)?} == $1 {(var)} = $2 {(var)(.length)} = $2$3
	 * @type {RegExp}
	 */
	var R_PICK_BLOCK = /(?:(?!\\)\{)(?:\?\s*((?:(?!\?\}).)*)\s*\?|\s*((?:(?![^\\])[\}\{])*[\w-#$]*)([\.\w-#$]*)\s*)(?:(?!\\)\})/gi;

	// ? () {} | : []
	var FILTER_R = new RegExp('(\\' + filter + ')', G);
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
		var REs = this._r_s_ || (this._r_s_ = {});
		return REs[str] || (REs[str] = new RegExp(str.replace(FILTER_R, '\\$1'), G));
	};

	function $esc(str) {
		return str.replace(/\\(?=\{|\})/g, SPACE);
	}

	var real = {
		'$index': function(data, key, index) {
			return index >> 0;
		},
		'$offset': function(data, key, index) {
			return this.offset;
		},
		'this': function(data, key, index) {
			return data;
		},
		'default': function(data, key, index) {
			return data[key];
		}
	}

	function toReal(self, data, key, index) {
		return (real[key] || real[STR_DEFAULT]).call(self, data, key, index);
	}
	/**
	 * 创建
	 * @param  {String} source  R_PICK_BLOCK匹配的$1
	 * @param  {String} value   R_PICK_BLOCK匹配结果
	 * @param  {Object} data    数据集
	 * @return {Mode}           对象本身
	 */
	Mode.prototype.create = function(source, value, data, index) {
		//创建对象内部临时变量
		var _ = this._ = {};
		//获取模板块级内的参数集合
		var vars = this.getValues(source);
		source = $esc(RETURN + source
			.replace(R_PICK_BLOCK, S_VAR_RENAME)
			.replace(R_FUNC_ARGS, S_FUNX_RELOAD)
		);
		// console.log(vars, source)
		var key;
		var val;
		for (var i = vars.length; i--;) {
			key = vars[i].replace(R_PICK_BLOCK, $2);
			_[STR_DOWN_LINE + key] = toReal(this, data, key, index);
		}
		this.val = this.val.replace(this.toRegExp(value), this.RFilter(this.eval(source)));
		delete this._;
		return this;
	};
	Mode.prototype.eval = function(str) {
		return (new Function(str)).call(this);
	};
	/**
	 * 获取字符串中的模版变量
	 * @param  {String} str 字符串源
	 * @return {Array}     返回字符串变量列表数组
	 */
	Mode.prototype.getValues = function(str) {
		if (!str) str = this.mode;
		if (!str) return [];
		var list = str.match(R_PICK_BLOCK) || [];
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
		if (typeof data == 'string') data = {
			$value: data
		};
		for (var i = 0, length = vars.length; i < length; i++) {
			key = vars[i].replace(R_PICK_BLOCK, $more);
			val = RegExp.$2;
			if (val) {
				vl = toReal(this, data, val, index);
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
		var html = SPACE;
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
		if (!(fx instanceof Function)) offset = fx, fx = undefined;
		this.offset = this.offset || offset >> 0;
		var key = data instanceof Array ? SOME : ONE;
		var length = this.attrs.length;
		if (length) this[key](this.attrs, data, fx, offset >> 0);

		return $esc((!length && this.mode) || this.val);
	};

	// 过滤
	Mode.prototype.RFilter = function(v) {
		return String.prototype.replace.call(v || v + SPACE, /(\{|\$)/g, function(key) {
			return '&#' + key.charCodeAt(0) + ';';
		});
	};

	Mode.prototype.toDouble = function(name) {
		return name.replace(R_GET1BYTE, TO_2BYTE);
	};
	Mode.prototype.show = function(val, len, isShowSuffix) {
		val = val || SPACE;
		if (!isShowSuffix) {
			if (R_SHOW_SUFFIX.test(val) && RegExp.$2) {
				val = RegExp.$1;
			}
		}
		len = len || this.showlength || 20;
		var name = this.toDouble(val);
		nameL = name.length;
		if (nameL <= len) {
			return this.RFilter(val);
		}
		var half = ((len - VSC_LENGTH) / 2) >> 0;
		var suffix = name.substr(0 - half); //反取参数为负值
		name = name.substring(0, half);
		name = (name + VAL_SHOW_CONCAT + suffix).replace(R_GET1BYTE, $1);
		//name = name.replace(/\t?(\.{3})\t?/, $1);
		return this.RFilter(name);
	};

	Mode.prototype.suffix = function(val) {
		return R_SHOW_SUFFIX.test(val) ? RegExp.$2 : SPACE;
	};
	/**
	 * 获取链式对象调用的方法对象
	 * @param  {String} varline  e.g :a.b.c.d.e
	 * @return {Function}         最终的e()
	 */
	Mode.prototype.__pick_var_line_ = function(varline) {
		var local = this._storage_;
		if (!local[varline]) {
			var vs;
			var rank = varline.split(DOT),
				box;
			var first = rank[0];
			if (first in this) box = this; // 先确认入口, 是模板对象还是全局对象
			else box = global;
			var i = 0,
				l = rank.length;
			for (; i < l; i++) {
				if (vs = box[rank[i]]) {
					if (i != l - 1) box = vs; // 存储链式对象上线文
					continue;
				}
			}
			local[varline] = {
				fx: vs,
				parent: box // 获取上层对象
			}; // 缓存数据关联
		}
		return local[varline];
	}

	Mode.prototype.IF = function(bool, t, f) {
		return bool ? t : f;
	}
	// 判断参数
	Mode.prototype.__check_args__ = function() {
		return Array.apply(null, arguments) || [];
	}
	/**
	 * 执行模板内的函数调用
	 */
	Mode.prototype.__run_func__ = function(fx, args) {
		var setting = this.__pick_var_line_(fx);
		if (setting.fx instanceof Function) {
			return setting.fx.apply(setting.parent, args);
		} else {
			return fx + ' not found!';
		};
	};

	var _room = document.createElement('div');
	// 计算
	function _Source(mode, source, offset) {
		return mode.on(source, offset != undefined ? offset : 1)
	}

	function _Children(parent) {
		var childs = parent.children;
		return childs.length > 1 ? parent.cloneNode() : childs[0];
	}

	function _GetChildByIndex(child, index) {
		var children = child.parentNode.children;
		var length = children.length;
		index = index >= 0 ? Math.min(length, index) : length + (index + 1) /*-1为末尾*/ ;
		return children[index];
	}
	/**
	 * IE9及以上, Safari, Firefox
	 * @Time   2019-09-17
	 * @param  {Array|JSON}   source 数据源
	 * @param  {DOM}   target 要替换的
	 */
	Mode.prototype.replaceWith = function(source, target, offset) {
		_room.innerHTML = _Source(this, source, offset);
		var parent = target.parentNode;
		var child = _Children(_room);
		parent.insertBefore(child, target);
		parent.removeChild(target);
		return this;
	}

	Mode.prototype.insert = function(source, target, index, offset) {
		_room.innerHTML = _Source(this, source, offset);
		var parent = target.parentNode;
		var child = _Children(_room);
		index = +index;
		var order = _GetChildByIndex(target, index);
		parent[order ? 'insertBefore' : 'appendChild'](child, order);
		return this;
	}
	module.exports = Mode;
}));
