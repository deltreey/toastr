﻿/*
 * Copyright 2012 John Papa and Hans Fjällemark.  
 * All Rights Reserved.  
 * Use, reproduction, distribution, and modification of this code is subject to the terms and 
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * Author: John Papa and Hans Fjällemark
 * Project: https://github.com/CodeSeven/toastr
 */
; (function (define) {
    define(['jquery'], function ($) {
        return (function () {
            var version = '2.0.0rc1';
            var $container;
            var listener;
            var toastId = 0;
            var toastType = {
                error: 'error',
                info: 'info',
                success: 'success',
                warning: 'warning'
            };

            var toastr = {
                clear: clear,
                error: error,
                getContainer: getContainer,
                info: info,
                options: {},
                subscribe: subscribe,
                success: success,
                version: version,
                warning: warning
            };

            return toastr;

            //#region Accessible Methods
            function error(message, title, optionsOverride) {
                return notify({
                    type: toastType.error,
                    iconClass: getOptions().iconClasses.error,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function info(message, title, optionsOverride) {
                return notify({
                    type: toastType.info,
                    iconClass: getOptions().iconClasses.info,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function subscribe(callback) {
                listener = callback;
            }

            function success(message, title, optionsOverride) {
                return notify({
                    type: toastType.success,
                    iconClass: getOptions().iconClasses.success,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function warning(message, title, optionsOverride) {
                return notify({
                    type: toastType.warning,
                    iconClass: getOptions().iconClasses.warning,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function clear($toastElement) {
                var options = getOptions();
                if (!$container) { getContainer(options); }
                if ($toastElement && $(':focus', $toastElement).length === 0) {
                    $toastElement[options.hideMethod]({
                        duration: options.hideDuration,
                        easing: options.hideEasing,
                        complete: function () { removeToast($toastElement); }
                    });
                    return;
                }
                if ($container.children().length) {
                    $container[options.hideMethod]({
                        duration: options.hideDuration,
                        easing: options.hideEasing,
                        complete: function () {
							remove($container);
						}
                    });
                }
            }
            //#endregion

            //#region Internal Methods

            function getDefaults() {
                return {
                    tapToDismiss: true,
                    toastClass: 'toast',
                    containerId: 'toast-container',
                    debug: false,

                    showMethod: 'fadeIn', //fadeIn, slideDown, and show are built into jQuery
                    showDuration: 300,
                    showEasing: 'swing', //swing and linear are built into jQuery
                    onShown: undefined,
                    hideMethod: 'fadeOut',
                    hideDuration: 1000,
                    hideEasing: 'swing',
                    onHidden: undefined,

                    extendedTimeOut: 1000,
                    iconClasses: {
                        error: 'toast-error',
                        info: 'toast-info',
                        success: 'toast-success',
                        warning: 'toast-warning'
                    },
                    iconClass: 'toast-info',
                    positionClass: 'toast-top-right',
                    timeOut: 5000, // Set timeOut and extendedTimeout to 0 to make it sticky
                    titleClass: 'toast-title',
                    messageClass: 'toast-message',
                    target: 'body',
                    closeHtml: '<button>&times;</button>',
                    newestOnTop: true
                };
            }

            function publish(args) {
                if (!listener) {
                    return;
                }
                listener(args);
            }

            function notify(map) {
                var
					options = getOptions(),
					div = document.createElement('div'),
					iconClass = map.iconClass || options.iconClass;

                if (typeof (map.optionsOverride) !== 'undefined') {
                    options = $.extend(options, map.optionsOverride);
                    iconClass = map.optionsOverride.iconClass || iconClass;
                }

                toastId++;

                $container = getContainer(options);
                var
					intervalId = null,
					$toastElement = $('<div/>'),
					$titleElement = div.cloneNode(false),
					$messageElement = div.cloneNode(false),
				    $closeElement = $(options.closeHtml),
					response = {
					    toastId: toastId,
					    state: 'visible',
					    startTime: new Date(),
					    options: options,
					    map: map
					};

                if (map.iconClass) {
                    addClass($toastElement, options.toastClass);
					addClass($toastElement, iconClass);
                }

                if (map.title) {
                    $titleElement.innerHTML = map.title;
					addClass($titleElement, options.titleClass);
					for (var i = 0; i < $toastElement.length; ++i) {
						$toastElement[i].appendChild($titleElement);
					}
                }

                if (map.message) {
                    $messageElement.innerHTML = map.message;
					addClass($messageElement, options.messageClass);
					for (var i = 0; i < $toastElement.length; ++i) {
						$toastElement[i].appendChild($messageElement);
					}
                }

                if (options.closeButton) {
                    addClass($closeElement, 'toast-close-button');
                    $toastElement.prepend($closeElement);
                }

                $toastElement.hide();
                if (options.newestOnTop) {
                    $container.prepend($toastElement);
                } else {
					for (var i = 0; i < $container.length; ++i) {
						for (var j = 0; j < $toastElement.length; ++j) {
							$container[i].appendChild($toastElement[j]);
						}
					}
                }


                $toastElement[options.showMethod](
				    { duration: options.showDuration, easing: options.showEasing, complete: options.onShown }
				);
                if (options.timeOut > 0) {
                    intervalId = setTimeout(hideToast, options.timeOut);
                }

                $toastElement.hover(stickAround, delayedhideToast);
                if (!options.onclick && options.tapToDismiss) {
                    $toastElement.click(hideToast);
                }

                if (options.onclick) {
                    $toastElement.click(function () {
                        options.onclick() && hideToast();
                    });
                }

                publish(response);

                if (options.debug && console) {
                    console.log(response);
                }

                return $toastElement;

                function hideToast() {
                    if ($(':focus', $toastElement).length > 0) {
                        return;
                    }
                    return $toastElement[options.hideMethod]({
                        duration: options.hideDuration,
                        easing: options.hideEasing,
                        complete: function () {
                            removeToast($toastElement);
                            if (options.onHidden) {
                                options.onHidden();
                            }
                            response.state = 'hidden';
                            response.endTime = new Date(),
							publish(response);
                        }
                    });
                }

                function delayedhideToast() {
                    if (options.timeOut > 0 || options.extendedTimeOut > 0) {
                        intervalId = setTimeout(hideToast, options.extendedTimeOut);
                    }
                }

                function stickAround() {
                    clearTimeout(intervalId);
                    $toastElement.stop(true, true)[options.showMethod](
						{ duration: options.showDuration, easing: options.showEasing }
					);
                }
            }
            function getContainer(options) {
                if (!options) { options = getOptions(); }
                $container = $('#' + options.containerId);
                if ($container.length) {
                    return $container;
                }
                $container = $('<div/>')
					.attr('id', options.containerId);
				addClass($container, options.positionClass);
                $container.appendTo($(options.target));
                return $container;
            }

            function getOptions() {
                return $.extend({}, getDefaults(), toastr.options);
            }

            function removeToast($toastElement) {
                if (!$container) { $container = getContainer(); }
                if ($toastElement.is(':visible')) {
                    return;
                }
                remove($toastElement);
                $toastElement = null;
                if ($container.children().length === 0) {
                    remove($container);
                }
            }
			
			function addClass(element, newClass) {
				if (typeof (element).innerHTML === "string") {
					var currentClass = element.getAttribute('class');
					if (currentClass) {
						newClass = currentClass + ' ' + newClass;
					}
					element.setAttribute('class', newClass);
				}
				else {
					for (var i = 0; i < element.length; ++i) {
						var currentClass = element[i].getAttribute('class');
						if (currentClass) {
							newClass = currentClass + ' ' + newClass;
						}
						element[i].setAttribute('class', newClass);
					}
				}
			}
			
			function remove(element) {
				if (typeof (element).innerHTML === "string") {
					var parent = element.parentNode;
					parent.removeChild(element);
				}
				else if (element.length > 0) {
					for (var i = 0; i < element.length; ++i) {
						var parent = element[i].parentNode;
						if (parent) {
							parent.removeChild(element[i]);
						}
					}
				}
			}
            //#endregion

        })();
    });
}(typeof define === 'function' && define.amd ? define : function (deps, factory) {
    if (typeof module !== 'undefined' && module.exports) { //Node
        module.exports = factory(require(deps[0]));
    } else {
        window['toastr'] = factory(window['jQuery']);
    }
}));