/**
 * Copyright 2011-2013, Dell
 * Copyright 2013-2014, SUSE LINUX Products GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
;(function($, doc, win) {
  'use strict';

  function LedUpdate(el, options) {
    this.$el = $(el);

    this.defaults = {
      beforeProcess: null,
      afterProcess: null
    };

    this.options = $.extend(
      this.defaults,
      options
    );

    this.init();
  }

  LedUpdate.prototype.init = function() {
    var self = this;

    self.animate();
    self.process();

    if ($.queryString['nopoll'] == undefined) {
      setInterval(
        function() {
          self.process()
        },
        30000
      );
    }
  };

  LedUpdate.prototype.process = function() {
    var self = this;

    self.destroy();
    self.animate();

    try {
      $.getJSON(this.$el.data('ledupdate'), function(response) {
        if ($.isFunction(self.options.beforeProcess)) {
          self.options.beforeProcess.call(this, response);
        }

        if (response.groups) {
          $.each(response.groups, function(key, val) {
            var current = $(
              '[data-group="{0}"] [data-piechart]'.format(key)
            );

            var chartVals = [
              val.status.ready,
              val.status.failed,
              val.status.unknown,
              val.status.unready + val.status.pending
            ];

            current.attr('title', val.tooltip).tooltip('destroy').tooltip({
              html: true
            });

            current.sparkline(
              chartVals,
              {
                type: 'pie',
                tagValuesAttribute: 'data-piechart',
                disableTooltips: true,
                disableHighlight: true,
                sliceColors: [
                  '#0f0',
                  '#f00',
                  '#999',
                  '#ff0'
                ]
              }
            );
          });
        }

        if (response.nodes) {
          $.each(response.nodes, function(key, val) {
            var current = $(
              '[data-node="{0}"]'.format(key)
            );

            if(current.hasClass('unknown')) {
              self.update(
                current,
                val.class,
                val.status
              );
            } else {
              self.update(
                current,
                val.class,
                val.status,
                function() {
                  current.effect('fade').effect('fade');
                }
              );
            }

            var text = $(
              '[data-node-state="{0}"]'.format(key)
            );

            if (text.html() != val.status) {
              text.html(val.status).effect('fade').effect('fade');
            }
          });
        }

        if (response.proposals) {
          $.each(response.proposals, function(key, val) {
            var current = $(
              '#{0}'.format(key)
            );

            if(current.hasClass('unknown')) {
              self.update(
                current,
                val,
                response['i18n'][key]['status']
              );
            } else {
              self.update(
                current,
                val,
                response['i18n'][key]['status'],
                function() {
                  current.effect('fade').effect('fade');
                }
              );
            }
          });
        }

        self.destroy();
        self.animate();

        if ($.isFunction(self.options.afterProcess)) {
          self.options.afterProcess.call(this, response);
        }
      });
    }
    catch(e) {
      if (window.console) {
        console.log(e)
      }
    }
  };

  LedUpdate.prototype.update = function(element, clazz, title, callback) {
    if (!element.hasClass(clazz)) {
      element.attr(
        'title',
        title
      );

      element.attr(
        'class',
        'led {0}'.format(clazz)
      );

      if ($.isFunction(callback)) {
        callback.call();
      }
    }
  };

  LedUpdate.prototype.animate = function() {
    $('.led.unready, .led.in_process, .led.spin').sprite({
      fps: 6,
      no_of_frames: 8
    }).active();
  };

  LedUpdate.prototype.destroy = function() {
    $('.led.unready, .led.in_process, .led.spin').destroy();
  };

  $.fn.ledUpdate = function(options) {
    return this.each(function() {
      new LedUpdate(this, options);
    });
  };
}(jQuery, document, window));