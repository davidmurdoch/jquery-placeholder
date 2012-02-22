/*! http://mths.be/placeholder v2.0.3 by @mathias */
;(function(window, document, $) {

	var isInputSupported = 'placeholder' in document.createElement('input'),
	    isTextareaSupported = 'placeholder' in document.createElement('textarea'),
	    prototype = $.fn,
	    valHooks = $.valHooks,
	    hooks,
	    placeholder,
	    Placeholder;

	if (isInputSupported && isTextareaSupported) {

		placeholder = prototype.placeholder = function() {
			return this;
		};

		placeholder.input = placeholder.textarea = true;

	} else {
		
		placeholder = prototype.placeholder = function() {
			return this
				.filter((isInputSupported ? 'textarea' : ':input') + '[placeholder]')
				.not('.placeholder')
				.bind({
					'focus.placeholder': clearPlaceholder,
					'blur.placeholder': setPlaceholder
				})
				.data('placeholder-enabled', true)
				.trigger('blur.placeholder').end();
		};

		placeholder.input = isInputSupported;
		placeholder.textarea = isTextareaSupported;
		
		var hasDefineProperty = false;
		try{
			if(Object.defineProperty && Object.defineProperty({},'x',{'get': function(){return true}}).x){
				hasDefineProperty = true;
			}
		}
		catch(ლ_ಠ益ಠ_ლ){ /*do nothing*/ }
		
		// test for Object.defineProperty
		if ( hasDefineProperty ) {
			
			// We use a string wrapper so we can detect if the value
			// of our placeholder was changed.
			Placeholder = function (value){ this.value = value; };
			Placeholder.prototype = {
				'toString': function(){
					return this.value;
				},
				'valueOf': function(){
					return this.value;
				}
			};
			
			// TODO: figure out how to define getters and setters for innerHTML on the HTMLTextAreaElement
			// Monkey patch input and textareas so that when we get their values we can opt to return ""
			// if our placeholder is active. 
			$.each( [HTMLInputElement, HTMLTextAreaElement], function(i, obj){
				var prototype = obj.prototype,
					prop = "value",
					originalValuePropDesc = Object.getOwnPropertyDescriptor(prototype, prop),
					set = originalValuePropDesc.set,
					get = originalValuePropDesc.get,
					hooks = {
						"get": function () {
							var lastValue = $(this).data("placeholder-last-" + prop),
								browserValue = get.call(this);
							// if our value is a Placeholder and its value is equal to the currentValue
							// we really are an "empty" string.
							return lastValue instanceof Placeholder && browserValue == lastValue ? "" : browserValue;
						},
						"set": function (value) {
							var $element = $(this);
							// trigger the browser's' default `set`
							set.call(this, value);
							
							// If we are not an instance of Placeholder then we
							// were not set by this plugin so remove our placeholder class
							if(!(value instanceof Placeholder)){
								$element.removeClass("placeholder");
							}
							
							// originalValuePropDesc.set coerces our Placeholder object to a string
							// which is not what we want.
							$element.data("placeholder-last-" + prop, value);
							
						}
					};
				Object.defineProperty(prototype, prop, hooks);
			});
			
		}
		else{
			
			Placeholder = String;
			
			hooks = {
				'get': function(element) {
					var $element = $(element);
					return $element.data('placeholder-enabled') && $element.hasClass('placeholder') ? '' : element.value;
				},
				'set': function(element, value) {
					var $element = $(element);
					if (!$element.data('placeholder-enabled')) {
						return element.value = value;
					}
					if (value == '') {
						element.value = value;
						// We can’t use `triggerHandler` here because of dummy text/password inputs :(
						setPlaceholder.call(element);
					} else if ($element.hasClass('placeholder')) {
						clearPlaceholder.call(element, true, value) || (element.value = value);
					} else {
						element.value = value;
					}
					// `set` can not return `undefined`; see http://jsapi.info/jquery/1.7.1/val#L2363
					return $element;
				}
			};
	
			isInputSupported || (valHooks.input = hooks);
			isTextareaSupported || (valHooks.textarea = hooks);
			
		}

		$(function() {
			// Look for forms
			$(document).delegate('form', 'submit.placeholder', function() {
				// Clear the placeholder values so they don’t get submitted
				var $inputs = $('.placeholder', this).each(clearPlaceholder);
				setTimeout(function() {
					$inputs.each(setPlaceholder);
				}, 10);
			});
		});

		// Clear placeholder values upon page reload
		$(window).bind('beforeunload.placeholder', function() {
			$('.placeholder').each(function() {
				this.value = '';
			});
		});

	}

	function args(elem) {
		// Return an object of element attributes
		var newAttrs = {},
		    rinlinejQuery = /^jQuery\d+$/;
		$.each(elem.attributes, function(i, attr) {
			if (attr.specified && !rinlinejQuery.test(attr.name)) {
				newAttrs[attr.name] = attr.value;
			}
		});
		return newAttrs;
	}

	function clearPlaceholder(event, value) {
		var input = this,
		    $input = $(input);
	    // input.value lies to us now in IE8,
	    // it may == "" even if it's actual value is its placeholders value.
		if ( (input.value == '' || input.value == $input.attr('placeholder')) && $input.hasClass('placeholder')) {
			if ($input.data('placeholder-password')) {
				$input = $input.hide().next().show().attr('id', $input.removeAttr('id').data('placeholder-id'));
				// If `clearPlaceholder` was called from `$.valHooks.input.set`
				if (event === true) {
					return $input[0].value = value;
				}
				$input.focus();
			} else {
				input.value = '';
				$input.removeClass('placeholder');
			}
		}
	}

	function setPlaceholder() {
		var $replacement,
		    input = this,
		    $input = $(input),
		    $origInput = $input,
		    id = this.id;
		if (input.value == '') {
			if (input.type == 'password') {
				if (!$input.data('placeholder-textinput')) {
					try {
						$replacement = $input.clone().attr({ 'type': 'text' });
					} catch(e) {
						$replacement = $('<input>').attr($.extend(args(this), { 'type': 'text' }));
					}
					$replacement
						.removeAttr('name')
						.data({
							'placeholder-password': true,
							'placeholder-id': id
						})
						.bind('focus.placeholder', clearPlaceholder);
					$input
						.data({
							'placeholder-textinput': $replacement,
							'placeholder-id': id
						})
						.before($replacement);
				}
				$input = $input.removeAttr('id').hide().prev().attr('id', id).show();
				// Note: `$input[0] != input` now!
			}
			$input.addClass('placeholder');
			$input[0].value = new Placeholder($input.attr('placeholder'));
		} else {
			$input.removeClass('placeholder');
		}
	}

}(this, document, jQuery));