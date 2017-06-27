/**
 * 数据模版生成
 * creation-time : 2017-06-27 18:13:43 PM
 */
;(function( global, factory ){
	global[ 'global' ] = global; 
	if( typeof exports === 'object' ) {
		factory( require, exports, module );
	} else if (typeof define === 'function') {
		//AMD CMD
		define( 'mode', factory );
	} else {
		var module = { exports : {} }
		factory( new Function, module.exports, module );
		global['Mode'] = module.exports;
	}
}( this, function( require, exports, module ) {
	/**
	 * 构造函数
	 */
	function Mode( mode ){
		this.mode 	= mode;
		this.attrs 	= this.getValues( this.mode ) || [];
	};

	/**
	 * 匹配对象
	 * {?(表达式)?} == $1 {(var)} = $2 {(var)(.length)} = $2$3
	 * @type {RegExp}
	 */
	Mode.prototype.regExp = /\{(?:\?\s*([^\?]*)\s*\?|\s*(?:([^\?\{\}\(\)\.]*)([^\?\{\}\(\)]*))\s*)\}/ig;
	// ? () {} | : []
	var filter = [ '$', '?', '(', ')', '<', '>', '{', '}', '[', ']', '|', ':', '*', '+', '.', '\\' ].join( '|\\' );
	Mode.prototype.regExpFx = new RegExp( '(\\' + filter + ')', 'g' );
	/**
	 * 简单的输出
	 * @param  {String} val 要输出的值
	 * @return {String}     输出参数值
	 */
	Mode.prototype.echo = function( val ){
		return val;
	}
	/**
	 * 
	 */
	Mode.prototype.toRegExp = function( str ){
		return new RegExp( str.replace( this.regExpFx, '\\$1' ) , 'g' );
	}
	/**
	 * 创建
	 * @param  {String} source  this.regExp匹配的$1
	 * @param  {String} value   this.regExp匹配结果
	 * @param  {Object} data    数据集
	 * @return {Mode}           对象本身
	 */
	Mode.prototype.create = function( source, value, data ){
		//创建对象内部临时变量
		this._      = {};
		//获取模板块级内的参数集合
		var vars    = this.getValues( source );

		source      = 'with( this ){' + source.replace( this.regExp, '_._$2$3' ) + '}';

		var key;
		for( var i = vars.length; i--; ){
			key = vars[ i ].replace( this.regExp, '$2' );

			if( key == 'this' ){
				this._[ '_this' ] = data;
			} else {
				this._[ '_' + key ] = data[ key ];
			}
		}
		this.val = this.val.replace( this.toRegExp( value ) , this.replaceFilter( eval( source ) ) );
		delete this._;
		return this;
	}

	/**
	 * 获取字符串中的模版变量
	 * @param  {String} str 字符串源
	 * @return {Array}     返回字符串变量列表数组
	 */
	Mode.prototype.getValues = function( str ){
		if( ! str ) str = this.mode
		if( ! str ) return []
		var list = str.match( this.regExp ) || [];
		var map = {}, key, newOrder = [];
		for( var i = list.length; i--; ){
			key = list[ i ];
			if( key in map ) continue;
			map[ key ] = 0;
			newOrder.push( key );
		}
		map = list = null;
		return newOrder.sort( function( a, b ){
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
	Mode.prototype.one = function( vars, data, fx ){
		var key, vl;
		this.val = this.mode;
		for( var i = 0, length = vars.length; i < length; i++ ){
			key = vars[ i ].replace( this.regExp, '$1$2' );
			if( RegExp.$2 ){
				vl = data[ key ]
				if( /\$/.test( vl ) ){
					vl = this.show( vl, 1000000 )
				}
				this.val = this.val.replace( this.toRegExp( vars[ i ] ), vl )
			} else {
				this.create( key, vars[ i ], data )
			}
		}
		if( fx instanceof Array ) fx( data, this.val );
		return this;
	}
	/**
	 * 多数据模板处理
	 * @param  {Array}      vars 模板内含有的参数集合
	 * @param  {Object}     data 数据源集合
	 * @param  {Function}   fx   回调
	 * @return {Mode}       对象本身
	 */
	Mode.prototype.some = function( vars, data, fx ){
		var html = ''
		for( var i = 0, length = data.length; i < length; i++ ){
			html += this.one( vars, data[ i ], fx ).val;
		}
		this.val = html;
		return this;
	}
	/**
	 * 执行置换模板
	 */
	Mode.prototype.on = function( data, fx ){
		var key = data instanceof Array ? 'some' : 'one';
		var length = this.attrs.length;
		length && this[ key ]( this.attrs, data, fx )

		return ( ! length && this.mode ) || this.val ;
	}
	///.replace(/([^\x00-\xff])/g, "$1＿").replace( /(?:(.{8}).*(.{1}\.[^\.]{1,9})|([^\.]{8}).*([^\.]{7}))$/ig, '$1$3...$2$4' )
	Mode.prototype.regExpShow = /(?:([^\x00-\xff])\|)|([^\x00-\xff])/ig;
	Mode.prototype.regExpSuffix = /(.{6})$/ig///(?:.{2}\.([^\.\W]{1,7})|.{4})$/ig;

	Mode.prototype.regExpSuffix_ = /\.(\w{1,9})$/ig;
	var CHECK_NAME = /(.*)(?:\.(\w{1,10}))$/;

	Mode.prototype.replaceFilter = function( v ){
		return String.prototype.replace.call( v || v+'', /(\{|\$)/g, function( key ){
			return '&#' + key.charCodeAt( 0 ) + ';';
		} )
	}

	Mode.prototype.toDouble = function( name ){
		return name.replace( this.regExpShow, '$2\|' )
	}
	Mode.prototype.show = function( val, len, s ){
		val = val || '';
		if( ! s ){
			if( CHECK_NAME.test( val ) && RegExp.$2 ){
				val = RegExp.$1;
			}
		}
		len = len || this.showlength || 20;
		var name    = this.toDouble( val );
			nameL   = name.length;
		if( nameL <= len ){
			return this.replaceFilter( val )
		}
		//获取后缀
		var suffix  = name.match( this.regExpSuffix )[ 0 ],
			suffixL = suffix.length;
		name = name.substring( 0, len - suffixL );
		name = ( name +'...'+ suffix ).replace( this.regExpShow, '$1' );
		name = name.replace( /\|?(\.{3})\|?/, '$1' );
		return this.replaceFilter( name );
	}

	Mode.prototype.toString = function( val ){
		return ! val ? val : val.toString().substr( 1 );
	}
	Mode.prototype.suffix = function( val ){
		return this.toString( (val + '').match( this.regExpSuffix_ ) );
	}

	module.exports = Mode;
}))