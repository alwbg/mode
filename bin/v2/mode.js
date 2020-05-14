/**
 * 数据模版生成
 * creation-time : 2020-05-13 18:41:26 PM
 */
;(function( global, factory ){
	global[ 'global' ] = global;
	if( typeof exports === 'object' ) {
		factory( require, exports, module );
	} else if (typeof define === 'function') {
		//AMD CMD
		define( 'mode', factory );
	} else {
		var funcName = '';
		if( funcName && !global[ funcName ] ) {
			global[ funcName ] = function( id ) {
				return global[ id ];
			};
		};
		var MODULE = { exports : {} };
		factory( global[ funcName ] || function( id ) {
			alert( '需要实现 (),加载模块:"' + id + '"' );
		}, MODULE.exports, MODULE );
		global[ 'mode' ] = MODULE.exports;
	}
}( this, function( require, exports, module ) {
	/**
	 * 模版
	 * @autor alwbg@163.com | soei
	 * @Date 2014/4/1
	 * @update 2015/12/23
	 * @update 2016/3/30
	 */
	var self = this;
	var Nil;

	/**
	 * 静态字符串
	 * @type {Object}
	 */
	var _S_DEFINED = {
		$1: '$1',
		$2: '$2',
		$1$2: '$1$2',

		//正则全局标示符
		GLOBAL: 'g',
		//转换为类似双字节字符串, JS中的.length不区分单字节还是双字节
		//@see REGEXPS.TO_ONE_OR_TOW_BYTE
		TO_2BYTE: '\t$2'
	}

	var SPACE = '';
	var INDEX = '$index';
	var RUN_FX_KEY = '__pick_value_for_you_';

	var DOT = '.';

	var MODE_STRING_NAME = '__mode__';

	var LINK_DOM_KEY = '__link__';

	var UNDEFINED = ' not found!';

	var _SOURCE = 'source';
	var CALLER = '_Invoke__';
	var _S_EXPR = 'try{var nil;return |;}catch(e){return ' + CALLER + '.error(e),"";}';
	//匹配变量, 替换赋值用
	var _A_MODE_VAR_FORMAT = [_SOURCE, '["$2"]$3'].join(SPACE); /*["$2"]*/
	//过滤的特殊字符
	var filter = ['?', '(', ')', '{', '}', '|', ':', '[', ']', '*', '+', '.', '\\', '$'].join('|\\');

	//正则对象声明
	var _R_DEFINED = {
		/**
		 * 匹配模版变量
		 * {?(表达式)?} == $1 {(attr)} = $2 {(attr)(.length)} = $2$3
		 * {(?表达式?)或者(属性名称)}
		 * {?(表达式)?}||{attr}
		 * @type {RegExp}
		 */
		PICK_EXPR: /(?:(?!\\)\{)(?:\?\s*((?:(?!\?\}).)*)\s*\?|\s*((?:(?![^\\])[\}\{])*[\w-#$@'"]*)([\.\w-#$\[\]\(\)'"]*)\s*)(?:(?!\\)\})/gi,
		//匹配表达式外壳 "{?$1?}"
		PICK_EXPR_ALL: /\{\?\s*((?!\?\}).*)\s*\?\}/ig,

		FILTER_FX: new RegExp('(\\' + filter + ')', _S_DEFINED.GLOBAL),

		/**
		 * 查找非单字节以外
		 * @type {RegExp}
		 */
		TO_ONE_OR_TOW_BYTE: /(?:\t([^\x00-\xff])|([^\x00-\xff]))/ig,
		//匹配后缀名
		SHOW_SUFFIX: /^(.*)(?:\.(\w{1,10}))$/,
		// 内部模板使用
		OWN_TAG: /<([A-Z]+\w+)(?:\s+((?:(?!\/>|>).)*)|)(?:\/>|>((?:(?!\<\/\1>)[\w\W])*)<\/\1>|)/gm
	};
	var ARGS_STRING = '<div data-component="{?_did__("$1")?}" class="$1-Room" {?{hide}?"style=\'display:none\'":""?}>{?_createChildMode__("$1", source, {$index});?}</div>';
	// source={$1}||(source.auto=false,source["$1".toLowerCase()]? source:[]),components.$1.on(source, nil, nil, nil, source.auto === nil ? true : source.auto)
	// 组件
	var COMPONENTS_TAG_NAME = '$1{?{tag}||"div"?}';
	var ELEMENT_NAME = 'div';
	var HTML_MODE = '<$1 $2>$3</$1>';

	// 处理字符串内的变量
	var _QUOT = {
		0: '"+($1)+"',
		1: "'+($1)+'",
		leftright: /(\{[^\{\}]+\})/g,
		// '{name||0}' -> {name}||0
		spare: [/(\|{2}[^\}]+)(\})/g, '$2$1'],
		single: "'"
	};
	/**
	 * 格式化模版数据为JSString 代码
	 * @type {Array}
	 */
	var _A_PICK_MODE_VALUE = [
		// /(?:(")[^"]*\{[^\{\}]+\}[^"]*"|(')[^']*\{[^\{\}]+\}[^']*')/g /(["']+)[^\1]*\{[^\{\}]+\}[^\1]*\1/g
		// 替换字符串内的属性 'string{属性}Number' -> 'string'+{属性}+'Number'
		[/(?:[?,:+\(;!&~><=]\s*|^\s*)(["'])(?:(?!\1).)*\{[^\{\}]+\}(?:(?!\1).)*\1/g, function(source, quot) {
			// console.log(source)
			return replaces(source, [
				[_QUOT.leftright, _QUOT[+(quot == _QUOT.single)]],
				_QUOT.spare
			])
		}],
		// 替换为对象属性模板
		[/\{\s*((?:\$offset|\$index))\s*\}/g, '{#$1}'],
		// 替换属性指向 指向内部模板对象 而非数据本身
		[/\{#\s*(?:this\.?)?([^}]+)\}/g, CALLER + '.$1'],
		// 转换对象, 做指引使用
		[/({\s*this\s*})/g, _SOURCE],
		//替换模版中属性参数
		[_R_DEFINED.PICK_EXPR, _A_MODE_VAR_FORMAT],
		[
			// 替换
			/(?:^|((?:[$]?\w+\s*\.)+)|;|,|\+|\-|\*|\/|[\r\n\t])\s*(\w+)\s*\(([^\)]?)/g,
			function(source, $1, $2, $3) {
				return CALLER + DOT + RUN_FX_KEY + '("' + ($1 || SPACE) + $2 + '"' + ($3 ? ',' + $3 : SPACE)
			}
		]
	];

	var _A_PICK_EVAL_VALUE = [
		//替换模版中属性参数
		[_R_DEFINED.PICK_EXPR, _A_MODE_VAR_FORMAT],
		[/(\")/g, '\\$1']
	]
	//过滤字符 影响RegExp匹配的时候,HTML渲染
	var _A_FILTER_REPLACE = [
		[/(\{|\$)/g, function(key) {
			return '&#' + key.charCodeAt(0);
		}]
	];
	/**  
	 * @see _S_EXPR
	 **/
	var _R_SEP = /(\|)/;
	/**
	 * @see String.prototype.firstChar2LowerCase
	 **/
	var _R_FIRST_CHAR_IS_UPPERCASE = /^([A-Z])/;
	//判断是否
	var _R_SYSTEM_FILTER = /(?:\s|)(if|while|for|with|switch)(?:\s*\()/;

	//获取模版数据的相应方法
	var _A_PICK_VALUE_BY = [_S_EXPR.replace(_R_SEP, '$1'), _S_EXPR.replace(_R_SEP, 'eval("$1");')];
	//过滤所用列表
	var _A_PICK_FILTER_LIST = [_A_PICK_MODE_VALUE, _A_PICK_EVAL_VALUE];

	var INSERT_OR_APPEND = ['insertBefore', 'appendChild'];

	var ComponentsTag = {};
	// 标签匹配 <Tag >
	var TAG_FILTER_REGEXP_STRING = ['(<|<\\/)', Nil, '(?=\\s|>)'];

	function createComponentsTagNameReplaceRegExp(name) {
		return ComponentsTag[name] || (TAG_FILTER_REGEXP_STRING[1] = name, ComponentsTag[name] = new RegExp(TAG_FILTER_REGEXP_STRING.join(SPACE), _S_DEFINED.GLOBAL));
	}
	// 不含有bind的扩展
	if (!Function.prototype.bind) {
		Function.prototype.bind = function() {
			var bindFx = this;
			// fun.bind.call(!Func)
			if (!(bindFx instanceof Function)) throw 'This is not a Function!';
			var args = _Arguments2Array(arguments);
			var host = args.shift();
			return function() {
				var argument = _Arguments2Array(arguments);
				Array.prototype.unshift.apply(argument, args);
				return bindFx.apply(host, argument);
			}
		};
	}

	function execFx() {
		var args = _Arguments2Array(arguments);
		var fx = args.shift();
		return fx instanceof Function ? fx.apply(args.shift(), args) : Nil;
	}
	/**
	 * 字符串批量替换
	 * @param  {String} value    元字符串
	 * @param  {Array} replacel  要替换的列表
	 */
	function replaces(value, replacel, box) {
		for (var i = 0, val; val = replacel[i++];) {
			value = SPACE.replace.apply(value, val);
		}
		return box ? SPACE.replace.call(box, _R_SEP, value) : value;
	}
	//创建一个方法包含模版
	function giveMeGoods(execJs, expression) {
		(expression || (expression = _R_SYSTEM_FILTER.test(execJs))) /*是否为ES自带逻辑语法*/ , expression = +!!expression;
		execJs = replaces(execJs, _A_PICK_FILTER_LIST[expression], _A_PICK_VALUE_BY[expression]);
		// console.log(_A_PICK_FILTER_LIST,expression)
		return new Function(CALLER, _SOURCE, execJs);
	}
	/**
	 * 内部模板
	 */
	function components(has, mode, M) {
		M.elements = DOM.createElement();
		if (has) {
			var components = M.components = {};
			var own, name, cur, innerHtml;
			while (own = has.shift()) {
				_R_DEFINED.OWN_TAG.test(own);
				name = RegExp.$1;
				innerHtml = RegExp.$3;
				mode = mode.replace(own, ARGS_STRING.replace(/\$1/g, name));
				if (!innerHtml) own = own.replace(_R_DEFINED.OWN_TAG, HTML_MODE);
				cur = components[name] = new Mode(
					own.replace(createComponentsTagNameReplaceRegExp(name), COMPONENTS_TAG_NAME)
				);
				cur.parentMode = M;
				cur._name__ = name;
			}
			M.auto = true;
			M.elements.innerHTML = mode;
		}
		return mode;
	}
	/**
	 * 创建模版工厂  目前为数组数据结构
	 * @param  {Mode} M     Mode对象
	 * @param  {String} mode 模版字符串
	 */
	function buildModeFactory(M, mode) {
		// 判断是否含有内部模板元素
		mode = components(mode.match(_R_DEFINED.OWN_TAG), mode, M);
		//获取模板内参数列表
		var list = mode.match(_R_DEFINED.PICK_EXPR) || [];

		var simplyMap = {},
			execJs, sourceJs, execJsFactory = [];
		//获取模版中的参数变量集合
		for (var i = list.length; i--;) {
			sourceJs = list[i];
			if (sourceJs in simplyMap) continue;
			simplyMap[sourceJs] = null;
			//去掉{?.....?}中的外壳 "{?", "?}"
			execJs = sourceJs.replace(_R_DEFINED.PICK_EXPR_ALL, _S_DEFINED.$1);
			//添加列表
			execJsFactory.push({
				R: stringToRegExp(sourceJs),
				goods: giveMeGoods(execJs),
				source: sourceJs
			})
		}
		execJsFactory.sort(function(a, b) {
			return b.source.length - a.source.length;
		});

		M.execJsFactory = execJsFactory;
		//模版
		M[MODE_STRING_NAME] = mode;
	}

	function stringToRegExp(str) {
		return new RegExp(str.replace(_R_DEFINED.FILTER_FX, '\\$1'), _S_DEFINED.GLOBAL);
	}
	/**
	 * 模版对象
	 * @param {String|Mode} mode 模版
	 * @param {Boolean} auto 打开自动模式
	 */
	function Mode(mode, auto) {
		if (mode instanceof Mode) return mode;

		this.auto = !!auto;
		this._storage_ = {
			rank: {},
			_dids__: {}
		};
		//建立模版工厂
		buildModeFactory(this, mode);
	};
	/**
	 * 过滤特殊字符
	 * @param  {String} v 数据源
	 */
	function filterReplace(v) {
		return replaces(v || v + SPACE, _A_FILTER_REPLACE)
	}
	Mode.prototype.filterReplace = filterReplace;

	/**
	 * 创建
	 * @Time   2019-09-20
	 * @param  {Mode}   attrs  Mode实例
	 * @param  {JSON}   source Mode数据
	 * @return {String}          处理后的字符串
	 */
	function invoke(that, source, start) {
		start != Nil && (that.$index = start);
		var val = that[MODE_STRING_NAME];
		// 获取执行队列
		var execJsFactory = that.execJsFactory;
		for (var i = 0, map; map = execJsFactory[i++];) {
			val = val.replace(map.R, /*filterReplace*/ (map.goods.call(map, that, source)));
		}
		return val;
	}
	var factory = {
		/**
		 * 单数据模板处理
		 * @param  {Object}     data 数据源
		 * @param  {Function}   fx   回调
		 * @return {String}       处理后的字符串
		 */
		one: function(host, data, fx, start) {
			var source = invoke(host, data, start);
			execFx(fx, host, data, source);
			return source;
		},
		/**
		 * 多数据模板处理
		 * @param  {Object}     data 数据源集合
		 * @param  {Function}   fx   回调
		 * @return {String}       处理后的字符串
		 */
		some: function(host, data, fx) {
			var html = SPACE,
				length = data.length;
			for (var i = host.$start; i < length; i++) {
				host.$index = i;
				html += this.one(host, data[i], fx);
			}
			return html;
		}
	}

	var INDEX_MAP = ['one', 'some'];
	var RANDOM = Math.random();

	//对象原型
	var EMPTY_ARRAY = [];
	var EMPTY_ARRAY_SLICE = EMPTY_ARRAY.slice;
	/**
	 * 实现继承扩展 merge( O1, O2, O3[,...], data# 要扩展数据 #, cover# 是否覆盖添加 # )
	 */
	function merge(s, o, e, i) {
		var key, cover, data, source, args;
		/* 格式化参数 */
		args = EMPTY_ARRAY_SLICE.call(arguments);
		/*获取最后一位*/
		cover = args.pop();
		/* 归位 */
		args.push(cover);
		/*是否是boolean类型*/
		if (!/false|true/ig.test(cover)) {
			//默认不替换
			args.push(false);
		}
		cover = args.pop();
		data = args.pop();
		while (source = args.shift()) {
			for (key in data) {
				if (cover || !(source.hasOwnProperty && source.hasOwnProperty(key))) {
					source[key] = data[key];
				}
			}
		}
	};
	/**
	 * 执行置换模板
	 */
	Mode.prototype.on = function(data, fx, start, offset, auto) {
		this.$start || (this.$start = start >> 0);
		this.$offset || (this.$offset = offset >> 0);
		execFx(this.init, this, data);
		var host;
		// 获取是否来自数据参数 Mode对象
		if (data != Nil && (host = data.host || data.$host || data.$mode, host instanceof Mode)) {
			host.auto != Nil || (host.auto = true);
			return host.on(data.data);
		}
		// 判断是否为为子模版
		if (this.parentMode instanceof Mode) {
			this.auto = data.auto;
			merge(this, data, true);
			data = data.data || data;
		}
		(auto === true && (this.auto = auto)) || (auto = this.auto);
		//选择执行相应的执行函数
		var source = factory[INDEX_MAP[+(data instanceof Array)]](this, data, fx);
		return auto ? _InAutoMode(this, data, source) : source;
	}
	// 首字母小写
	String.prototype.firstChar2LowerCase = function() {
		return this.replace(_R_FIRST_CHAR_IS_UPPERCASE, function(_$, $1) {
			return $1.toLowerCase();
		})
	}
	Mode.prototype._did__ = function(name) {
		// console.log(line)
		var context = this;
		var picker = ['$index', '_name__'],
			pickerlength = picker.length,
			i, line = SPACE,
			tem;
		while (context) {
			host = context;
			for (i = 0; i < pickerlength; i++) {
				tem = host[picker[i]];
				if (tem === Nil) continue;
				else line && (line = '.' + line)
				line = tem + line;
			}
			context = context.parentMode;
		}
		this._key__ = line;
		// console.log(line)
		var indexs = [];
		this._host__(INDEX, indexs);
		return name + '-' + indexs.join(SPACE);
	}
	/**
	 * 创建子模版
	 */
	Mode.prototype._createChildMode__ = function(name, source) {
		var data = source[name] || (data = source[name.firstChar2LowerCase()] || [], /* 如果为空设置默认 */ data = {
			// 设置内嵌模板是否为数据驱动UI
			auto: true,
			data: data
		});
		return this.components[name].on(data, Nil, Nil, Nil, data.auto === Nil ? true : data.auto);
	}

	/**
	 * 输出指定长度字符 中间省略哈替换
	 * @param  {String} val 目标字符
	 * @param  {Number} len 输出长度字符, 一个汉字 两个字符
	 * @param  {Boolean} showsuffix   是否显示后缀
	 */
	Mode.prototype.show = function(val, len, showsuffix) {
		val = val + SPACE;
		var suffix;
		if (_R_DEFINED.SHOW_SUFFIX.test(val) && (suffix = RegExp.$2) && !showsuffix) {
			val = RegExp.$1;
		}
		len = len || this.showlength || 20;
		//转换字符 模拟字节
		val = val.replace(_R_DEFINED.TO_ONE_OR_TOW_BYTE, _S_DEFINED.TO_2BYTE);
		if (val.length > len) {
			var offset = (suffix && suffix.length + 1) || 0;
			var half = len / 2 >>> 0;
			offset = showsuffix ? Math.max(offset - half, 0) : 0;

			val = toShort(val, len, half, offset);
		}
		//还原
		val = val.replace(_R_DEFINED.TO_ONE_OR_TOW_BYTE, _S_DEFINED.$1$2);
		return filterReplace(val);
	}
	/**
	 * 设置显示样式的临时缓存@see #toShort
	 * @type {Object}
	 */
	var M_ = {};
	/**
	 * 设置显示样式
	 * @param  {String} val 要设置的字符
	 * @param  {Number} l   显示长度
	 * @return {String}     处理后的
	 */
	function toShort(val, len, half, offset) {
		var key = len + '-' + half + '-' + offset;
		var left = Math.max(half - offset, 2);
		var right = len - left;
		half = M_[key] || (M_[key] = new RegExp('(.{' + left + '}).*(.{' + right + '})', _S_DEFINED.GLOBAL));
		//console.log( len, half, 'offset:',offset,left ,right,val.replace( half, '$1...$2' ))
		return val.replace(half, '$1...$2')
	}

	Mode.prototype.toString = function(val) {
		return !val ? this[MODE_STRING_NAME] : val.toString().substr(1);
	}
	//获取后缀名
	Mode.prototype.suffix = function(val) {
		return (val + SPACE).replace(_R_DEFINED.SHOW_SUFFIX, _S_DEFINED.$1);
	}

	Mode.prototype.error = function(e) {
		self.echo && self.echo(e);
	}
	/**
	 * 获取指定属性的对象
	 * @param {String} start 要获取的属性名称
	 */
	Mode.prototype.parent = function(start) {
		var context = this;
		while (context) {
			if (start in context) return context;
			context = context.parentMode;
		}
	}

	Mode.prototype._host__ = function(key, line) {
		!(key instanceof Array) && (key === Nil ? Nil : key = [key]);
		var host,
			context = this,
			val, index, length, pick, mark;
		var hasPick = key && line;
		while (context) {
			if (hasPick) {
				index = 0;
				length = key.length;
				if (length == 1) {
					val = context[key[index]];
					pick = val === Nil ? val >> 0 : val
				} else {
					pick = {};
					mark = 0;
					for (; index < length; index++) {
						val = context[key[index]];
						(val === Nil && mark++) || (pick[key[index]] = val);
					}
				}
				mark >> 0 || line.unshift(pick);
			}
			host = context;
			context = context.parentMode;
		}
		return host;
	}

	Mode.prototype.$name = function() {
		return this._name__;
	}
	// 获取数据宿主
	Mode.prototype.$observer = function(key) {
		var observer;
		for (var k in this.observer) {
			observer = this.observer[k], key === Nil ? observer[LINK_DOM_KEY] : observer;
			break;
		}
		return observer || [];
	}
	// 获取观察者 LINK_DOM_KEY
	Mode.prototype.takeObserverLink = function() {
		return this.$observer()[LINK_DOM_KEY] || [];
	}
	/**
	 * 获取链式对象调用的方法对象
	 * @param  {String} varline  e.g :a.b.c.d.e
	 * @return {Function}         最终的e()
	 */
	var __pick_var_line_ = function(Mo, varline) {
		var local = Mo._storage_;
		if (!local[varline]) {
			var vs;
			var rank = varline.split(DOT),
				box;
			if (rank[0] == CALLER) {
				rank.shift();
			}
			// 先确认入口, 是模板对象还是全局对象
			box = Mo.parent(rank[0]) || global;
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

	/**
	 * 执行模版参数中的方法
	 * @return {String}      处理后的数据
	 */
	Mode.prototype[RUN_FX_KEY] = function() {
		var args = _Arguments2Array(arguments);
		var name = args.shift(),
			val;

		var setting = __pick_var_line_(this, name);
		if (setting.fx instanceof Function) {
			val = setting.fx.apply(setting.parent, args);
			return val === Nil ? SPACE : val;
		} else {
			return name + UNDEFINED;
		};
	}

	/**
	 * 模板内部函数
	 * @Time  2019-09-23
	 * @param {Boolean}   bool expres
	 * @param {Object}   t    [description]
	 * @param {Object}   f    [description]
	 */
	Mode.prototype.IF = function(bool, t, f) {
		return bool ? t : f;
	}

	function _Arguments2Array(args) {
		return Array.apply(null, args);
	}
	var STRING_NAME = 'string';

	function isString(str) {
		return typeof str == STRING_NAME;
	}

	var hasIDSel = /^#(\d[^\s]*)\s*/;
	var aQuerySimplyOrMulti = ['querySelector', 'querySelectorAll'];
	var DOM = {
		// elements: document.createElement('div'),
		isDom: function(target){ return target && target.nodeType == 1},
		createElement: function(eleName){return document.createElement(eleName || ELEMENT_NAME)},
		append: function(parent, child, newone){return parent[INSERT_OR_APPEND[+!newone]](child, newone)},
		insertBefore: function(child, newone) {
			var parent = child.parentNode;
			parent && parent[INSERT_OR_APPEND[0]](newone, child);
			return newone;
		},
		insertAfter: function(child, newone) {
			var next;
			if(next = child.nextElementSibling){
				DOM.insertBefore(next, newone)
			} else {
				DOM.insertBefore(child, newone);
				DOM.insertBefore(newone, child);
			}
			return newone
		},
		// 删除节点
		remove: function(target) {
			target.parentNode && target.parentNode.removeChild(target);
		},
		// 获取子节点
		family: function(Mo, source, offset) {
			var elements = Mo.elements;
			elements.innerHTML = factory.one(Mo, source, null, offset);
			var childs = elements.children;
			return childs.length > 1 ? elements.cloneNode() : childs[0];
		},
		query: function(sel, context, multi) {
			if (isString(sel) && hasIDSel.test(sel)) {
				context = document.getElementById(RegExp.$1);
				sel = sel.replace(hasIDSel, SPACE);
				if (sel == SPACE) return sel;
			}
			if (isString(context) && context != SPACE) {
				context = DOM.query(context);
			}
			if (context instanceof Array) {
				var sim, _;
				while (sim = context.shift()) {
					if (_ = DOM.query(sel, sim, multi)) {
						return _;
					}
				}
			} else
				return (context || document)[aQuerySimplyOrMulti[+!!multi]](sel);
		},
		getChildByIndex: function(parent, index) {
			var children = parent.children;
			var length = children.length;
			index = index >= 0 ? Math.min(length, index) : length + (index + 1) /*-1为末尾*/ ;
			return {
				child: children[index],
				index: index
			};
		},
		getElementPropertyValue: function(target, attr, value) {
			if (target && target.nodeType == 1) {
				return value != Nil ? target[attr] = value : value = target[attr], value != Nil ? value : target.getAttribute(attr);
			}
		}
	}
	Mode.dom = DOM;
	/**
	 * 替换;IE9及以上, Safari, Firefox
	 * @Time   2019-09-17
	 * @param  {Array|JSON}   source 数据源
	 * @param  {DOM}   target 要替换的
	 */
	Mode.prototype.replaceWith = function(source, target, offset) {
		var newly = DOM.family(this, source, offset);
		DOM.insertBefore(target, newly);
		DOM.remove(target);
		return newly;
	}

	Mode.prototype.push = function(inner, key, value) {
		var components = this.components,
			component;
		if (key instanceof Function) value = key;
		if (components && (component = components[inner])) {
			component[key || 'replace'] = value;
		}
	}

	/**
	 * 插入
	 * @Time   2019-09-24
	 * @param  {Object}   source 数据源
	 * @param  {Node|Element|HTMLElement}   target 要插入位置元素的对象
	 * @param  {Number}   index  开始索引
	 */
	Mode.prototype.insert = function(source, target, offset, index) {
		var newly = DOM.family(this, source, offset);
		// need check
		var parent = target && target.parentNode || this.elements;
		index = +index;
		var data = DOM.getChildByIndex(parent, index);
		// DOM操作
		DOM.append(parent, newly, data.child);
		data.newly = newly;
		return data;
	}

	var ElementBindMap = {
		R_ATTR: /\[([^\[\]]+)\]/g,
		take: function(property, value) {
			return DOM.getElementPropertyValue(this, property, value);
		},
		bind: function(Mo, observer) {
			var property = Mo.bind /*数据参数为JSON,JSON属性bind,之后附属Mo*/ ;
			if (property == Nil) return;
			var
				tbind, sim, attribute,
				R = this.R_ATTR,
				take = this.take,
				hostBox = observer.data,
				source = observer[LINK_DOM_KEY];
			// 判断是否含有选择器
			var hasSelector = R.test(property);

			if (hasSelector) {
				attribute = RegExp.$1;
				property = property.replace(R, SPACE);
			} else {
				attribute = property;
			};
			for (var i = hostBox.length; i-- > 0;) {
				sim = source[i];
				if (hasSelector) sim = DOM.query(property, sim) || sim;
				tbind = take.bind(sim, attribute);
				addListener(hostBox[i], attribute, tbind, tbind);
			}
		}
	}
	// 进入观察者
	function _InAutoMode(Mo, data, source) {
		var line = [];
		var Pare = Mo._host__(INDEX, line);
		// 去掉自身
		line.pop();
		var Par, MoName = Mo._name__;
		var lineKey = line.join(SPACE);
		var observer = Mo.observer || (Mo.observer = {});

		var isObserver = observer[lineKey] instanceof Observer;
		// console.log(data);
		isObserver || (observer[lineKey] = new Observer());

		observer = observer[lineKey];
		//设置data
		observer.data = data;
		// parent && (parent.data[parent.$index][Mo._name__.toLowerCase()] = observer.data)
		// console.log(, data)

		Mo.data = observer.data;
		Mo.elements.innerHTML = source;
		source = _Arguments2Array(Mo.elements.children);

		observer[LINK_DOM_KEY] = source;
		// 绑定自定义属性 内部依赖observer[LINK_DOM_KEY]
		ElementBindMap.bind(Mo, observer);

		observer.host = Mo;
		if (Par = Mo.parentMode) {
			storage = Pare._storage_;
			var dids = storage._dids__;
			var sdids = dids[MoName] || (dids[MoName] = {});
			sdids[lineKey] = {
				name: MoName,
				elements: source,
				data: observer.data || data
			};
			var rootstorage = Par._storage_.rank;
			(rootstorage[MoName] || (rootstorage[MoName] = [])).push(lineKey);
			return execFx(Mo.replace, Mo, source, data, Par), SPACE;
		} else {
			// console.log(Mo.$index, JSON.stringify(data));
			createComponents(Mo);
			execFx(Mo.onend, Mo);
			return _Arguments2Array(Mo.elements.children);
		}
	}

	function createComponents(Mo) {
		var ranks = Mo._storage_.rank,
			rank, _rank, host = Mo._host__(),
			parent, selector,
			relay, length, newly, mel, index;
		var _dids__ = host._storage_._dids__,
			comp;
		for (var i in ranks) {
			// console.log(`============${i}============`)
			rank = ranks[i];
			length = rank.length;
			for (index = 0; index < length; index++) {
				// console.log(Mo.$data, (Mo.parentMode||{}).$data)
				_rank = rank[index];
				map = _dids__[i][_rank];
				// Mo.$data.push(map.data);
				selector = '[data-component=' + map.name + '-' + _rank + ']';
				parent = DOM.query(selector, host.elements);
				relay = parent;
				if (relay) {
					mel = map.elements.length;
					while (newly = map.elements[--mel]) {
						relay = DOM.insertBefore(relay, newly);
					}
					DOM.remove(parent);
				}
			}
			if (comp = Mo.components[i]) {
				createComponents(comp);
			}
		}
	}

	/**
	 * 注册观察对象
	 * @Time   2019-09-21
	 * @param  {Obejct}   that      被观察者
	 * @param  {String|Number}   attribute 观察字段
	 * @param  {Function}   set       当设值的时候调用
	 * @param  {Function}   get       获取时调用
	 */
	function addListener(that, attribute, set, get, configurable) {
		try {
			Object.defineProperty(that, attribute, {
				set: set,
				get: get,
				configurable: configurable === Nil ? true : configurable/* 可否被删除, true:可以删除 */
			})
		} catch (e) {}
	}
	/**
	 * 属性修改
	 * @Time   2019-09-23
	 * @param  {JSON}   data  源数据
	 * @param  {Number}   i    数据索引
	 * @param  {Object}   value 设置的值
	 */
	function _Set(data, i, trigger, value) {
		data[i] = value;
		execFx(trigger || this.trigger, this, data, i, value);
	}
	/**
	 * 属性获取
	 * @Time   2019-09-23
	 * @param  {JSON}   data 数据源
	 * @param  {Number}   i    [description]
	 * @return {Object}        [description]
	 */
	function _Get(data, i) {
		return data[i];
	}

	function observerByChild(host, $private, data, index) {
		var _data = $private.data;
		index != Nil || (index = _data.length);
		if (!_data[index]) {
			addListener(
				$private.observer,
				index,
				_Set.bind(host, _data, index, $private.trigger),
				_Get.bind(host, _data, index)
			);
		}
		host.data[index] = data;
		$private.data[index] = data;
	}
	/*赋值是添加观察者*/
	function observerBySet($private, value) {
		// 判断是否为数组
		var index;
		var _data = $private.data;
		if (value instanceof Array) {
			_data || (_data = $private.data = []);
			$private.observer || ($private.observer = []);
			var
				length = value.length,
				dlength = _data.length;
			for (index = 0; index < length; index++) {
				// 注册观察对象
				observerByChild(this, $private, value[index], index);
			}
			var diff = dlength - length;
			// 删除多余数据
			for (var di = diff; di-- > 0;) {
				this.remove(length + di);
			}
			_data.length = length;
			var self = this;
			$private.observer.push = function(data) {
				observerByChild(self, $private, data, this.length);
			}
		} else {
			_data || (_data = $private.data = {});
			$private.observer || ($private.observer = {});
			for (index in value) {
				observerByChild(this, $private, value[index], index);
			}
		}
	}
	/**
	 * 添加观察者
	 * @param {Function}   trigger [description]
	 */
	function Observer(trigger) {
		var $private = {
			data: Nil /*$data*/ ,
			observer: Nil /*$observer*/ ,
			trigger: trigger
		};
		// 设置属性data
		addListener(this, 'data', observerBySet.bind(this, $private), function() {
			return $private.observer;
		});
	}
	Observer.prototype.trigger = function(source, i, data) {
		// 删除
		if (data == RANDOM) {
			// 删除DOM关联
			DOM.remove(this[LINK_DOM_KEY][i]);
			this[LINK_DOM_KEY].splice(i, 1);
			try {
				this.data.splice(i, 1);
			} catch (e) {
				delete this.data[i];
			}
		} else {
			// 设值
			if (isNaN(+i)) return;
			this[LINK_DOM_KEY] && this.invoke(i, data, i in this[LINK_DOM_KEY] ? Nil /*replace*/ : true /*append*/ );
		}
	}
	Observer.prototype.remove = function(index) {
		try {
			this.data[index] = RANDOM;
		} catch (e) {}
	}
	Observer.prototype.invoke = function(index, data, append) {
		var domMap = this[LINK_DOM_KEY];
		var target = domMap[index];
		var resource;
		// 默认替换
		if (append === Nil) {
			if (!target) return;
			resource = this.host.replaceWith(data, target, index);
		} else {
			var offset = index;
			if (!target) {
				target = domMap[index - 1];
				offset = -1;
			}
			resource = this.host.insert(data, target, index, offset);
			index = resource.index;
			resource = resource.newly;
		}
		domMap[index] = resource;
	}

	/**
	 * 数据分页
	 * @Time 2019-10-15
	 */
	var TAG = 'li';
	var DOT3 = '...';
	var COMPONENTS_LI = 'Li';
	var COMPONENTS_LIST = 'List';
	var DISABLED = 'disabled';
	var PREV_NEXT_CLASS = ['prev', 'next'];
	var PREV_NEXT = ['← Previous', 'Next → '];
	var MODE_STRING = '<List/><div><div class="page-code-left"><div class="page-inner-info">{?Math.min({count},({pageNum}-1)*{max}+1)?} - {?Math.min({pageNum}*{max}, {count})?}  &nbsp;  共 {count} 条记录</div></div><div class="page-code-right"><div class="pagination"><ul><Li data-index="{$index}" data-name="{#name}" class="{?{disabled}||""?} {?{cur}?"active" : ""?} {?{clazz}||"";?}" handle="{#handle}"><a href="javascript:;">{?{name}||{index}?}</a></Li></ul></div></div></div>';
	Mode.Page = function() {
		this.Room = new Mode(MODE_STRING);
		this.trigger();
	};
	Mode.Page.prototype.trigger = function(){
		
		var Page = this.Room;
		var Def = {};
		this.on = function(args){
			return Page.on(args)
		}
		this.pn = function(index, pn, count, max) {
			var lr = +(pn > 0);
			var state = lr ? index == count || count == 0 : index == 1;
			this.dz.push({
				tag: TAG,
				name: PREV_NEXT[lr],
				clazz: PREV_NEXT_CLASS[lr],
				disabled: state ? DISABLED : SPACE,
				index: lr ? Math.min(count, index + pn) : Math.max(1, index + pn),
				max: max,
				pages: count
			});
		}

		this.push = function(name, clazz, cur, index) {
			cur = cur === Nil ? false : cur;
			this.dz.push({
				tag: TAG,
				name: name,
				clazz: clazz || SPACE,
				index: index == Nil ? name : index,
				cur: cur,
				disabled: cur ? DISABLED : SPACE
			})
		}

		this.createData = function(data) {
			// 每页显示数量
			var max = data.max;
			// 数据总量
			var count = data.count;
			// 当前索引
			var index = +data.pageNum;
			// var handle = data.handle;
			// this.handle = handle;
			// 计算总的页数
			var pages = Math.ceil(count / max);

			var i = 0;
			// 当前左右显示位数
			var offset = data.offset || 3;

			offset = Math.min(offset, (pages / 2) >> 0);

			max = Math.min(offset * 2 + 1, pages);
			// 计算左偏移量
			var left = Math.min(index - 1, offset) + offset - Math.min(offset, pages - index);
			// 计算总的显示 除去头尾外的长度
			// 计算开始值
			var start = Math.max(1, index - left);
			this.pn(index, -1, pages, data.max);
			// 首页编号及省略号现实逻辑style="background-color:#eee"
			if (start > 1) this.push(1);
			if (start > 2) this.push(DOT3, Nil, Nil, start - 1);
			// 中间编号显示逻辑
			for (; i < max; i++) {
				this.push(start + i, Nil, index == start + i);
			}
			if (pages - start - max > 0) this.push(DOT3, Nil, Nil, start + max);
			// 尾页编号及省略号的显示逻辑style="background-color:#eee"
			if (pages - start - max + 1 > 0) this.push(pages);
			this.pn(index, 1, pages, self.max);
		}
		this.isDisabled = function(data) {
			return data.disabled === DISABLED
		}
		this.findDataByIndex = function(index) {
			return (((Page.data||Def)[COMPONENTS_LI]||Def).data||Def)[index];
		}
		this.findListDataByIndex = function(index) {
			return (((Page.data ||Def)[COMPONENTS_LIST]||Def).data||Def)[index];
		}
		var self = this;
		Page.init = function(data) {
			self.dz = [];
			self.createData(data);
			data[COMPONENTS_LI] = {
				handle: data.handle,
				data: self.dz
			}
			merge(Page.components[COMPONENTS_LI], data[COMPONENTS_LI], true);
			delete self.dz;
		}
		// Mode.Page.prototype = Page;
	}

	function Hash(model, sep) {
		var nameMap = model.split(/(?:\||,)/g);
		var indexMap = {},
			modeMap = [],
			sim;
		for (var index = nameMap.length; index-- > 0;) {
			sim = nameMap[index];
			indexMap[sim] = index;
			modeMap.unshift('{?decodeURIComponent({' + sim + '}||"")?}');
		}
		this.indexMap = indexMap;
		this.nameMap = nameMap;
		this.mode = new Mode(modeMap.join(sep || '|'));
	}
	Hash.prototype.toJson = function(args) {
		var nm = this.nameMap;
		if (args instanceof Array);
		else return {};
		var resource = {},
			sim;
		for (var index = args.length; index-- > 0;) {
			sim = nm[index];
			if (!sim) continue;
			resource[sim] = args[index];
		}
		return resource;
	}
	Hash.prototype.toString = function(data) {
		return this.mode.on(data);
	}
	Mode.Hash = Hash;

	module.exports = Mode;
}));
